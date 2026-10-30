import express, { type Express, type Request } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { getPetProfile } from "./queries";
import { speciesInfo } from "@shared/species";

const viteLogger = createLogger();

type StaticSeo = { title: string; description: string; image?: string };

const staticSeo: Record<string, StaticSeo> = {
  "/": {
    title: "Resta con me | Il social network degli animali",
    description: "Il posto felice dove cani, gatti e tutti gli animali hanno il loro profilo, le loro foto e i loro amici. E quando attraversano il Ponte dell'Arcobaleno, restano con noi.",
  },
  "/esplora": {
    title: "Esplora gli animali | Resta con me",
    description: "Scopri i profili di cani, gatti e tanti altri amici a quattro zampe (e non solo). Segui i tuoi preferiti!",
  },
  "/ponte": {
    title: "Il Ponte dell'Arcobaleno | Resta con me",
    description: "Il posto dove gli animali che ci hanno lasciato continuano a vivere nel nostro cuore: accendi una luce e lascia una dedica.",
  },
};

function escapeAttribute(value: string): string {
  return value.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c] || c));
}

function requestOrigin(req: Request): string {
  const configured = process.env.BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const protocol = req.get("x-forwarded-proto")?.split(",")[0]?.trim() || req.protocol;
  return `${protocol}://${req.get("host")}`.replace(/\/$/, "");
}

async function seoForRequest(req: Request): Promise<StaticSeo | undefined> {
  const pathname = req.originalUrl.split("?")[0].replace(/(.)\/$/, "$1");
  const staticPage = staticSeo[pathname];
  if (staticPage) return staticPage;
  const match = pathname.match(/^\/pet\/(\d+)$/);
  if (!match) return undefined;
  const pet = await getPetProfile(Number(match[1]), null).catch(() => null);
  if (!pet) return undefined;
  const info = speciesInfo(pet.species);
  const bio = pet.bio?.replace(/\s+/g, " ").trim().slice(0, 155);
  if (pet.status === "rainbow") {
    return {
      title: `${pet.name} sul Ponte dell'Arcobaleno | Resta con me`,
      description: bio || `${pet.name} è sul Ponte dell'Arcobaleno e resta con chi gli vuole bene. Accendi una luce per ${pet.name}.`,
      image: pet.avatarUrl ?? undefined,
    };
  }
  return {
    title: `${pet.name} ${info.emoji} | Resta con me`,
    description: bio || `Conosci ${pet.name}: foto, storie e coccole su Resta con me.`,
    image: pet.avatarUrl ?? undefined,
  };
}

async function injectSeo(html: string, req: Request): Promise<string> {
  const pathname = req.originalUrl.split("?")[0];
  const seo = await seoForRequest(req);
  if (!seo) return html;
  const origin = requestOrigin(req);
  const canonical = `${origin}${pathname}`;
  const image = seo.image ? new URL(seo.image, `${origin}/`).toString() : null;
  const tags = [
    `<link rel="canonical" href="${escapeAttribute(canonical)}" />`,
    `<meta property="og:locale" content="it_IT" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Resta con me" />`,
    `<meta property="og:title" content="${escapeAttribute(seo.title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(seo.description)}" />`,
    `<meta property="og:url" content="${escapeAttribute(canonical)}" />`,
    ...(image ? [
      `<meta property="og:image" content="${escapeAttribute(image)}" />`,
      `<meta name="twitter:image" content="${escapeAttribute(image)}" />`,
    ] : []),
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${escapeAttribute(seo.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttribute(seo.description)}" />`,
  ].join("\n    ");
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttribute(seo.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escapeAttribute(seo.description)}" />`)
    .replace("</head>", `    ${tags}\n  </head>`);
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: viteLogger,
    server: { middlewareMode: true, hmr: { server }, allowedHosts: true as const },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    try {
      const clientTemplate = path.resolve(import.meta.dirname, "..", "client", "index.html");
      // Si rilegge l'index.html a ogni richiesta, così le modifiche si vedono subito
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
      const page = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
  }

  app.use(express.static(distPath, { index: false }));
  app.use("*", async (req, res, next) => {
    try {
      const html = await fs.promises.readFile(path.resolve(distPath, "index.html"), "utf-8");
      res.status(200).type("html").set("Cache-Control", "no-cache").send(await injectSeo(html, req));
    } catch (error) {
      next(error);
    }
  });
}
