import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { eq, sql } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";
import { db, pool } from "./db";
import { users, insertUserSchema, type User } from "@shared/schema";
import { containsProfanity } from "./profanity";

declare global {
  namespace Express {
    interface User extends Omit<import("@shared/schema").User, never> {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function publicUser(user: User) {
  const { password, ...rest } = user;
  return rest;
}

// Limite semplice ai tentativi per indirizzo: frena chi prova password a raffica
const tentativi = new Map<string, { count: number; resetAt: number }>();
export function limitaTentativi(max: number, finestraMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const chiave = `${req.path}:${req.ip}`;
    const now = Date.now();
    const voce = tentativi.get(chiave);
    if (!voce || voce.resetAt < now) {
      tentativi.set(chiave, { count: 1, resetAt: now + finestraMs });
      return next();
    }
    if (++voce.count > max) {
      return res.status(429).json({ message: "Troppi tentativi, riprova tra qualche minuto." });
    }
    next();
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Accedi per continuare" });
  next();
}

export function setupAuth(app: Express) {
  const inProduzione = process.env.NODE_ENV === "production";

  // Il segreto firma i cookie di sessione: con un valore prevedibile
  // chiunque potrebbe fabbricarsi una sessione da amministratore.
  const secret = process.env.SESSION_SECRET;
  const segnaposto = !secret
    || secret.length < 32
    || /dev|test|cambiami|changeme|secret-123|placeholder|esempio/i.test(secret);
  if (inProduzione && segnaposto) {
    throw new Error(
      "SESSION_SECRET assente, troppo corto o ancora quello di esempio. " +
      "Genera un valore casuale di almeno 32 caratteri (es. `openssl rand -base64 48`) " +
      "e impostalo nelle variabili d'ambiente prima di avviare il sito."
    );
  }

  // Dietro un proxy (Railway, Cloudflare) serve per riconoscere l'HTTPS e l'IP reale
  if (inProduzione) app.set("trust proxy", 1);

  const PostgresStore = connectPgSimple(session);
  app.use(session({
    secret: secret || "segreto-solo-per-sviluppo-locale",
    resave: false,
    saveUninitialized: false,
    store: new PostgresStore({ pool, createTableIfMissing: true }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: inProduzione,
      sameSite: "lax",
    },
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  // Si entra con nome utente oppure con email
  passport.use(new LocalStrategy(async (login, password, done) => {
    try {
      const chiave = login.trim().toLowerCase();
      const [user] = await db.select().from(users)
        .where(sql`lower(${users.username}) = ${chiave} or lower(${users.email}) = ${chiave}`);
      if (!user || !(await comparePasswords(password, user.password))) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      // Una sospensione ha effetto subito, anche sulle sessioni già aperte
      if (!user || user.suspendedAt) return done(null, false);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  app.post("/api/register", limitaTentativi(10, 15 * 60 * 1000), async (req, res, next) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Dati non validi" });
      }
      const { username, email, password, name } = parsed.data;
      if (containsProfanity(username) || (name && containsProfanity(name))) {
        return res.status(400).json({ message: "Scegli un nome gentile: qui siamo tutti amici." });
      }

      const [duplicato] = await db.select({ username: users.username, email: users.email }).from(users)
        .where(sql`lower(${users.username}) = ${username.toLowerCase()} or lower(${users.email}) = ${email.toLowerCase()}`);
      if (duplicato) {
        return res.status(400).json({
          message: duplicato.username.toLowerCase() === username.toLowerCase()
            ? "Questo nome utente è già preso"
            : "Questa email è già registrata",
        });
      }

      const [user] = await db.insert(users).values({
        username,
        email: email.toLowerCase(),
        name: name || null,
        password: await hashPassword(password),
        // Il ruolo di amministratore non si ottiene mai dalla registrazione
        isAdmin: false,
      }).returning();

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(publicUser(user));
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", limitaTentativi(20, 15 * 60 * 1000), (req, res, next) => {
    passport.authenticate("local", (err: unknown, user: User | false | null) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Nome utente o password non corretti" });
      if (user.suspendedAt) {
        return res.status(403).json({ message: "Questo account è stato sospeso. Scrivici per chiarimenti." });
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json(publicUser(user));
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Non autenticato" });
    res.json(publicUser(req.user as User));
  });
}
