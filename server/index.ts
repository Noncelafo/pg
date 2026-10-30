import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { applySchemaUpdates } from "./schema-updates";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms`);
    }
  });
  next();
});

// Il service worker non deve restare in cache: il browser lo ricontrolla
// a ogni apertura, così gli aggiornamenti dell'app arrivano subito.
app.get("/sw.js", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Service-Worker-Allowed", "/");
  next();
});

(async () => {
  await applySchemaUpdates();
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    // Risponde al client e registra l'errore: rilanciarlo farebbe
    // terminare il processo lasciando il sito irraggiungibile.
    console.error("[errore]", err);
    if (!res.headersSent) {
      res.status(status).json({ message: status >= 500 ? "Qualcosa è andato storto, riprova tra un attimo." : err.message });
    }
  });

  // Il catch-all di Vite va registrato dopo tutte le altre rotte
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || 5000);
  server.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port}`);
  });
})();
