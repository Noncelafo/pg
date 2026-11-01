import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
import multer from "multer";
import { nanoid } from "nanoid";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "./db";
import {
  pets, posts, comments, cuddles, follows, lights, tributes, reports, orders, users,
  petInputSchema, rainbowInputSchema, postInputSchema, commentInputSchema,
  tributeInputSchema, reportInputSchema, orderInputSchema,
} from "@shared/schema";
import { ORDER_STATUSES } from "@shared/shop";
import { isValidSpecies } from "@shared/species";
import { setupAuth, requireAuth } from "./auth";
import { uploadsDir } from "./data-dir";
import { optimizeUploadedImage } from "./image-optimizer";
import { containsProfanity } from "./profanity";
import { errorMessage } from "./request-utils";
import { getPetProfile, listPets, listPosts, listComments, listTributes, today } from "./queries";

const GENTILE = "Qui si parla con dolcezza: riscrivi il messaggio senza parole offensive.";

// ---------- Caricamento foto ----------

const imageDir = uploadsDir("images");
fs.mkdirSync(imageDir, { recursive: true });

const FORMATI_AMMESSI = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: imageDir,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${nanoid(8)}${path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "")}`),
  }),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (FORMATI_AMMESSI.has(file.mimetype)) return cb(null, true);
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Sono ammesse solo foto JPG, PNG, WebP o GIF"));
  },
});

/** Esegue multer e traduce i suoi errori in risposte leggibili. */
function receiveImage(field: string) {
  const handler = imageUpload.single(field);
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, (error: unknown) => {
      if (!error) return next();
      if (error instanceof multer.MulterError) {
        const message = error.code === "LIMIT_FILE_SIZE"
          ? "La foto è troppo grande (massimo 15 MB)"
          : "Sono ammesse solo foto JPG, PNG, WebP o GIF";
        return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ message });
      }
      next(error);
    });
  };
}

/** Salva la foto ricevuta (ottimizzata) e restituisce l'URL pubblico. */
async function storeImage(file: Express.Multer.File): Promise<string> {
  const optimized = await optimizeUploadedImage(file);
  return `/uploads/images/${path.basename(optimized.path)}`;
}

function removeUploadedFile(url: string | null | undefined) {
  if (!url?.startsWith("/uploads/images/")) return;
  const file = path.join(imageDir, path.basename(url));
  fs.promises.unlink(file).catch(() => {});
}

// ---------- Utilità ----------

function paramId(req: Request, name = "id"): number | null {
  const n = Number(req.params[name]);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const viewerId = (req: Request) => (req.isAuthenticated() ? req.user!.id : null);
const viewerIsAdmin = (req: Request) => (req.isAuthenticated() ? req.user!.isAdmin : false);

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Dati non validi";
}

async function ownedPet(req: Request, res: Response, id: number) {
  const [pet] = await db.select().from(pets).where(eq(pets.id, id));
  if (!pet) { res.status(404).json({ message: "Non troviamo questo animale" }); return null; }
  if (pet.ownerId !== req.user!.id && !req.user!.isAdmin) {
    res.status(403).json({ message: "Solo chi si prende cura di questo animale può farlo" });
    return null;
  }
  return pet;
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.use("/uploads", express.static(uploadsDir(), { maxAge: "30d", immutable: true, index: false }));

  // ---------- Animali ----------

  // Esplora: ricerca per nome/razza e filtro per specie o per stato
  app.get("/api/pets", async (req, res) => {
    const q = String(req.query.q ?? "").trim().slice(0, 60);
    const species = String(req.query.species ?? "");
    const status = String(req.query.status ?? "");
    const page = Math.max(0, Number(req.query.page) || 0);
    const conditions = [
      q ? or(ilike(pets.name, `%${q}%`), ilike(pets.breed, `%${q}%`)) : undefined,
      isValidSpecies(species) ? eq(pets.species, species) : undefined,
      status === "alive" || status === "rainbow" ? eq(pets.status, status) : undefined,
    ].filter(Boolean) as ReturnType<typeof eq>[];
    const limit = 24;
    const items = await listPets({
      where: conditions.length ? and(...conditions) : undefined,
      limit: limit + 1,
      offset: page * limit,
    });
    res.json({ items: items.slice(0, limit), hasMore: items.length > limit });
  });

  app.get("/api/pets/mine", requireAuth, async (req, res) => {
    res.json(await listPets({ where: eq(pets.ownerId, req.user!.id), order: [pets.createdAt], limit: 100 }));
  });

  app.post("/api/pets", requireAuth, async (req, res) => {
    const parsed = petInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: firstIssue(parsed.error) });
    const data = parsed.data;
    if (!isValidSpecies(data.species)) return res.status(400).json({ message: "Scegli una specie dall'elenco" });
    if ([data.name, data.breed, data.bio, data.favoriteThings].some((t) => t && containsProfanity(t))) {
      return res.status(400).json({ message: GENTILE });
    }
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(pets).where(eq(pets.ownerId, req.user!.id));
    if (total >= 30) return res.status(400).json({ message: "Hai già una bella famiglia! Per ora il limite è 30 animali." });
    const [pet] = await db.insert(pets).values({ ...data, ownerId: req.user!.id }).returning({ id: pets.id });
    res.status(201).json(pet);
  });

  app.get("/api/pets/:id", async (req, res) => {
    const id = paramId(req);
    if (!id) return res.status(404).json({ message: "Non troviamo questo animale" });
    const profile = await getPetProfile(id, viewerId(req));
    if (!profile) return res.status(404).json({ message: "Non troviamo questo animale" });
    res.json(profile);
  });

  app.patch("/api/pets/:id", requireAuth, async (req, res) => {
    const id = paramId(req);
    if (!id) return res.status(404).json({ message: "Non troviamo questo animale" });
    const pet = await ownedPet(req, res, id);
    if (!pet) return;
    const parsed = petInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: firstIssue(parsed.error) });
    const data = parsed.data;
    if (!isValidSpecies(data.species)) return res.status(400).json({ message: "Scegli una specie dall'elenco" });
    if ([data.name, data.breed, data.bio, data.favoriteThings].some((t) => t && containsProfanity(t))) {
      return res.status(400).json({ message: GENTILE });
    }
    await db.update(pets).set({
      name: data.name,
      species: data.species,
      breed: data.breed ?? null,
      birthDate: data.birthDate ?? null,
      bio: data.bio ?? null,
      favoriteThings: data.favoriteThings ?? null,
    }).where(eq(pets.id, id));
    res.json({ id });
  });

  for (const [route, column] of [["avatar", "avatarUrl"], ["cover", "coverUrl"]] as const) {
    app.post(`/api/pets/:id/${route}`, requireAuth, receiveImage("file"), async (req, res) => {
      const id = paramId(req);
      try {
        if (!req.file) return res.status(400).json({ message: "Scegli una foto" });
        const pet = id ? await ownedPet(req, res, id) : null;
        if (!pet) {
          fs.promises.unlink(req.file.path).catch(() => {});
          if (!id) res.status(404).json({ message: "Non troviamo questo animale" });
          return;
        }
        const url = await storeImage(req.file);
        removeUploadedFile(pet[column]);
        await db.update(pets).set({ [column]: url }).where(eq(pets.id, pet.id));
        res.json({ url });
      } catch (error) {
        res.status(400).json({ message: errorMessage(error) });
      }
    });
  }

  // Eliminare un animale è definitivo: cancella anche post, commenti e dediche
  app.delete("/api/pets/:id", requireAuth, async (req, res) => {
    const id = paramId(req);
    if (!id) return res.status(404).json({ message: "Non troviamo questo animale" });
    const pet = await ownedPet(req, res, id);
    if (!pet) return;
    const images = await db.select({ url: posts.imageUrl }).from(posts).where(eq(posts.petId, id));
    await db.delete(pets).where(eq(pets.id, id));
    [pet.avatarUrl, pet.coverUrl, ...images.map((i) => i.url)].forEach(removeUploadedFile);
    res.sendStatus(204);
  });

  // ---------- Seguire ----------

  app.post("/api/pets/:id/follow", requireAuth, async (req, res) => {
    const id = paramId(req);
    if (!id) return res.status(404).json({ message: "Non troviamo questo animale" });
    const [pet] = await db.select({ id: pets.id }).from(pets).where(eq(pets.id, id));
    if (!pet) return res.status(404).json({ message: "Non troviamo questo animale" });
    await db.insert(follows).values({ petId: id, userId: req.user!.id }).onConflictDoNothing();
    res.sendStatus(204);
  });

  app.delete("/api/pets/:id/follow", requireAuth, async (req, res) => {
    const id = paramId(req);
    if (!id) return res.status(404).json({ message: "Non troviamo questo animale" });
    await db.delete(follows).where(and(eq(follows.petId, id), eq(follows.userId, req.user!.id)));
    res.sendStatus(204);
  });

  // ---------- Ponte dell'Arcobaleno ----------

  // L'ultima staffetta di corsa: chi è arrivato di recente e quante luci brillano
  app.get("/api/bridge", async (req, res) => {
    const page = Math.max(0, Number(req.query.page) || 0);
    const limit = 24;
    const items = await listPets({
      where: eq(pets.status, "rainbow"),
      order: [desc(sql`coalesce(${pets.rainbowAt}, ${pets.createdAt}::date)`), desc(pets.id)],
      limit: limit + 1,
      offset: page * limit,
    });
    const [{ residents }] = await db.select({ residents: sql<number>`count(*)::int` }).from(pets).where(eq(pets.status, "rainbow"));
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(lights);
    res.json({ items: items.slice(0, limit), hasMore: items.length > limit, residents, lights: total });
  });

  // "Accompagna sul Ponte": il profilo si sposta nei Prati dell'Arcobaleno
  app.post("/api/pets/:id/rainbow", requireAuth, async (req, res) => {
    const id = paramId(req);
    if (!id) return res.status(404).json({ message: "Non troviamo questo animale" });
    const pet = await ownedPet(req, res, id);
    if (!pet) return;
    if (pet.status === "rainbow") return res.status(400).json({ message: "Questo amico è già sul Ponte" });
    const parsed = rainbowInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: firstIssue(parsed.error) });
    const { rainbowAt, rainbowMessage } = parsed.data;
    if (rainbowAt && rainbowAt > today()) return res.status(400).json({ message: "La data non può essere nel futuro" });
    if (rainbowMessage && containsProfanity(rainbowMessage)) return res.status(400).json({ message: GENTILE });
    await db.update(pets).set({
      status: "rainbow",
      rainbowAt: rainbowAt ?? today(),
      rainbowMessage: rainbowMessage ?? null,
    }).where(eq(pets.id, id));
    res.json({ id });
  });

  // "Riporta tra noi": annulla un passaggio sul Ponte fatto per errore.
  // Luci e dediche non si cancellano: restano nel database, solo non si vedono
  // finché il profilo è tra gli amici di oggi.
  app.post("/api/pets/:id/return", requireAuth, async (req, res) => {
    const id = paramId(req);
    if (!id) return res.status(404).json({ message: "Non troviamo questo animale" });
    const pet = await ownedPet(req, res, id);
    if (!pet) return;
    if (pet.status !== "rainbow") return res.status(400).json({ message: "Questo amico è già qui con noi" });
    await db.update(pets).set({ status: "alive", rainbowAt: null, rainbowMessage: null }).where(eq(pets.id, id));
    res.json({ id });
  });

  // Le foto dei suoi post, per la galleria e la presentazione sul Ponte
  app.get("/api/pets/:id/photos", async (req, res) => {
    const id = paramId(req);
    if (!id) return res.status(404).json({ message: "Non troviamo questo animale" });
    const rows = await db.select({ id: posts.id, url: posts.imageUrl, text: posts.text }).from(posts)
      .where(and(eq(posts.petId, id), sql`${posts.imageUrl} is not null`))
      .orderBy(desc(posts.id))
      .limit(60);
    res.json(rows);
  });

  // Accendere una luce: una al giorno per persona
  app.post("/api/pets/:id/light", requireAuth, async (req, res) => {
    const id = paramId(req);
    if (!id) return res.status(404).json({ message: "Non troviamo questo animale" });
    const [pet] = await db.select({ status: pets.status }).from(pets).where(eq(pets.id, id));
    if (!pet) return res.status(404).json({ message: "Non troviamo questo animale" });
    if (pet.status !== "rainbow") return res.status(400).json({ message: "Le luci si accendono sul Ponte dell'Arcobaleno" });
    await db.insert(lights).values({ petId: id, userId: req.user!.id, day: today() }).onConflictDoNothing();
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(lights).where(eq(lights.petId, id));
    res.json({ lights: total, lightedToday: true });
  });

  app.get("/api/pets/:id/tributes", async (req, res) => {
    const id = paramId(req);
    if (!id) return res.status(404).json({ message: "Non troviamo questo animale" });
    res.json(await listTributes(id, viewerId(req), viewerIsAdmin(req)));
  });

  app.post("/api/pets/:id/tributes", requireAuth, async (req, res) => {
    const id = paramId(req);
    if (!id) return res.status(404).json({ message: "Non troviamo questo animale" });
    const [pet] = await db.select({ status: pets.status }).from(pets).where(eq(pets.id, id));
    if (!pet) return res.status(404).json({ message: "Non troviamo questo animale" });
    if (pet.status !== "rainbow") return res.status(400).json({ message: "Le dediche si lasciano sul Ponte dell'Arcobaleno" });
    const parsed = tributeInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: firstIssue(parsed.error) });
    if (containsProfanity(parsed.data.message)) return res.status(400).json({ message: GENTILE });
    const [tribute] = await db.insert(tributes).values({ petId: id, authorId: req.user!.id, message: parsed.data.message }).returning({ id: tributes.id });
    res.status(201).json(tribute);
  });

  app.delete("/api/tributes/:id", requireAuth, async (req, res) => {
    const id = paramId(req);
    if (!id) return res.sendStatus(404);
    const [row] = await db.select({ authorId: tributes.authorId, ownerId: pets.ownerId }).from(tributes)
      .innerJoin(pets, eq(pets.id, tributes.petId)).where(eq(tributes.id, id));
    if (!row) return res.sendStatus(404);
    if (![row.authorId, row.ownerId].includes(req.user!.id) && !req.user!.isAdmin) return res.sendStatus(403);
    await db.delete(tributes).where(eq(tributes.id, id));
    res.sendStatus(204);
  });

  // ---------- Post ----------

  // Home: "tutti" (animali in vita) oppure "seguiti" (anche chi è sul Ponte)
  app.get("/api/feed", async (req, res) => {
    const scope = req.query.scope === "following" ? "following" : "all";
    const beforeId = Number(req.query.before) || undefined;
    const uid = viewerId(req);
    if (scope === "following" && !uid) return res.status(401).json({ message: "Accedi per vedere chi segui" });
    const limit = 10;
    const where = scope === "following"
      ? inArray(posts.petId, db.select({ id: follows.petId }).from(follows).where(eq(follows.userId, uid!)))
      : eq(pets.status, "alive");
    const items = await listPosts(uid, viewerIsAdmin(req), { where, beforeId, limit: limit + 1 });
    res.json({ items: items.slice(0, limit), hasMore: items.length > limit });
  });

  // Post di un animale (profilo) — anche quelli del Ponte
  app.get("/api/pets/:id/posts", async (req, res) => {
    const id = paramId(req);
    if (!id) return res.status(404).json({ message: "Non troviamo questo animale" });
    const beforeId = Number(req.query.before) || undefined;
    const limit = 10;
    const items = await listPosts(viewerId(req), viewerIsAdmin(req), { where: eq(posts.petId, id), beforeId, limit: limit + 1 });
    res.json({ items: items.slice(0, limit), hasMore: items.length > limit });
  });

  // Ricordi dal Ponte: post degli animali che hanno attraversato l'arcobaleno
  app.get("/api/bridge/posts", async (req, res) => {
    const beforeId = Number(req.query.before) || undefined;
    const limit = 10;
    const items = await listPosts(viewerId(req), viewerIsAdmin(req), { where: eq(pets.status, "rainbow"), beforeId, limit: limit + 1 });
    res.json({ items: items.slice(0, limit), hasMore: items.length > limit });
  });

  app.post("/api/posts", requireAuth, receiveImage("image"), async (req, res) => {
    try {
      const parsed = postInputSchema.safeParse(req.body);
      if (!parsed.success) {
        if (req.file) fs.promises.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ message: firstIssue(parsed.error) });
      }
      const { petId, text } = parsed.data;
      if (!text && !req.file) return res.status(400).json({ message: "Aggiungi una foto o scrivi qualcosa" });
      if (text && containsProfanity(text)) {
        if (req.file) fs.promises.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ message: GENTILE });
      }
      const pet = await ownedPet(req, res, petId);
      if (!pet) {
        if (req.file) fs.promises.unlink(req.file.path).catch(() => {});
        return;
      }
      const imageUrl = req.file ? await storeImage(req.file) : null;
      const [post] = await db.insert(posts).values({ petId, authorId: req.user!.id, text: text ?? null, imageUrl }).returning({ id: posts.id });
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ message: errorMessage(error) });
    }
  });

  app.delete("/api/posts/:id", requireAuth, async (req, res) => {
    const id = paramId(req);
    if (!id) return res.sendStatus(404);
    const [row] = await db.select({ authorId: posts.authorId, ownerId: pets.ownerId, imageUrl: posts.imageUrl }).from(posts)
      .innerJoin(pets, eq(pets.id, posts.petId)).where(eq(posts.id, id));
    if (!row) return res.sendStatus(404);
    if (![row.authorId, row.ownerId].includes(req.user!.id) && !req.user!.isAdmin) return res.sendStatus(403);
    await db.delete(posts).where(eq(posts.id, id));
    removeUploadedFile(row.imageUrl);
    res.sendStatus(204);
  });

  app.post("/api/posts/:id/cuddle", requireAuth, async (req, res) => {
    const id = paramId(req);
    if (!id) return res.sendStatus(404);
    const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, id));
    if (!post) return res.sendStatus(404);
    await db.insert(cuddles).values({ postId: id, userId: req.user!.id }).onConflictDoNothing();
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(cuddles).where(eq(cuddles.postId, id));
    res.json({ cuddles: total, cuddled: true });
  });

  app.delete("/api/posts/:id/cuddle", requireAuth, async (req, res) => {
    const id = paramId(req);
    if (!id) return res.sendStatus(404);
    await db.delete(cuddles).where(and(eq(cuddles.postId, id), eq(cuddles.userId, req.user!.id)));
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(cuddles).where(eq(cuddles.postId, id));
    res.json({ cuddles: total, cuddled: false });
  });

  // ---------- Commenti ----------

  app.get("/api/posts/:id/comments", async (req, res) => {
    const id = paramId(req);
    if (!id) return res.sendStatus(404);
    res.json(await listComments(id, viewerId(req), viewerIsAdmin(req)));
  });

  app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
    const id = paramId(req);
    if (!id) return res.sendStatus(404);
    const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, id));
    if (!post) return res.status(404).json({ message: "Questo post non c'è più" });
    const parsed = commentInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: firstIssue(parsed.error) });
    if (containsProfanity(parsed.data.text)) return res.status(400).json({ message: GENTILE });
    const [comment] = await db.insert(comments).values({ postId: id, authorId: req.user!.id, text: parsed.data.text }).returning({ id: comments.id });
    res.status(201).json(comment);
  });

  app.delete("/api/comments/:id", requireAuth, async (req, res) => {
    const id = paramId(req);
    if (!id) return res.sendStatus(404);
    const [row] = await db.select({ authorId: comments.authorId, ownerId: pets.ownerId }).from(comments)
      .innerJoin(posts, eq(posts.id, comments.postId))
      .innerJoin(pets, eq(pets.id, posts.petId))
      .where(eq(comments.id, id));
    if (!row) return res.sendStatus(404);
    if (![row.authorId, row.ownerId].includes(req.user!.id) && !req.user!.isAdmin) return res.sendStatus(403);
    await db.delete(comments).where(eq(comments.id, id));
    res.sendStatus(204);
  });

  // ---------- Segnalazioni ----------

  app.post("/api/reports", requireAuth, async (req, res) => {
    const parsed = reportInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: firstIssue(parsed.error) });
    await db.insert(reports).values({ ...parsed.data, reporterId: req.user!.id });
    res.status(201).json({ message: "Grazie! Ci pensiamo noi." });
  });

  // ---------- Ciondoli NFC ----------

  // Indirizzo breve scritto nel chip: avvicini il telefono e arrivi al profilo.
  // Il chip non va mai riscritto: se un domani cambia la pagina, cambia solo questo.
  app.get("/p/:id", (req, res) => {
    const id = paramId(req);
    res.redirect(302, id ? `/pet/${id}?nfc=1` : "/");
  });

  app.post("/api/orders", requireAuth, async (req, res) => {
    const parsed = orderInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: firstIssue(parsed.error) });
    const { engraving, engravedText, symbol, petId, ...rest } = parsed.data;
    const pet = await ownedPet(req, res, petId);
    if (!pet) return;
    if ([engravedText, rest.note].some((t) => t && containsProfanity(t))) {
      return res.status(400).json({ message: GENTILE });
    }
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(orders)
      .where(and(eq(orders.userId, req.user!.id), eq(orders.status, "new")));
    if (total >= 10) return res.status(400).json({ message: "Hai già tante prenotazioni in attesa: ti scriviamo presto per confermarle." });
    const [order] = await db.insert(orders).values({
      ...rest,
      petId,
      userId: req.user!.id,
      engravedText: engraving === "name" ? engravedText : null,
      symbol: engraving === "symbol" ? symbol : null,
    }).returning({ id: orders.id });
    res.status(201).json(order);
  });

  // Le mie prenotazioni; chi gestisce il sito (admin) con ?all=1 le vede tutte
  app.get("/api/orders", requireAuth, async (req, res) => {
    const all = req.query.all === "1" && req.user!.isAdmin;
    const rows = await db.select({
      id: orders.id, petId: orders.petId, petName: pets.name, symbol: orders.symbol,
      engravedText: orders.engravedText, color: orders.color, attachment: orders.attachment, quantity: orders.quantity,
      note: orders.note, status: orders.status, createdAt: orders.createdAt,
      customerName: users.name, customerUsername: users.username, customerEmail: users.email,
    }).from(orders)
      .leftJoin(pets, eq(pets.id, orders.petId))
      .innerJoin(users, eq(users.id, orders.userId))
      .where(all ? undefined : eq(orders.userId, req.user!.id))
      .orderBy(desc(orders.createdAt))
      .limit(200);
    res.json(rows.map(({ customerName, customerUsername, customerEmail, createdAt, ...o }) => ({
      ...o,
      createdAt: createdAt.toISOString(),
      ...(all ? { customerName: customerName || customerUsername, customerEmail } : {}),
    })));
  });

  app.patch("/api/orders/:id", requireAuth, async (req, res) => {
    if (!req.user!.isAdmin) return res.sendStatus(403);
    const id = paramId(req);
    const status = String(req.body?.status ?? "");
    if (!id || !(ORDER_STATUSES as readonly string[]).includes(status)) return res.status(400).json({ message: "Stato non valido" });
    const result = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning({ id: orders.id });
    if (!result.length) return res.sendStatus(404);
    res.sendStatus(204);
  });

  // Gli errori di percorso /api sconosciuti non devono finire nella pagina HTML
  app.use("/api", (_req, res) => res.status(404).json({ message: "Non trovato" }));

  return createServer(app);
}
