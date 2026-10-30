import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import ffmpegPath from "ffmpeg-static";

export const MAX_IMAGE_EDGE = 1600;
export const IMAGE_WEBP_QUALITY = 82;

// Formati che il browser sa mostrare da soli: se l'ottimizzazione non riesce
// si tiene l'originale invece di perdere la foto.
const FORMATI_VISUALIZZABILI = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) return reject(new Error("Ottimizzazione immagini non disponibile"));
    const proc = spawn(ffmpegPath, ["-y", "-hide_banner", "-loglevel", "error", ...args]);
    let stderr = "";
    proc.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    proc.on("error", reject);
    proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(`Immagine non valida: ${stderr.slice(-400)}`)));
  });
}

/**
 * Riduce la foto (lato lungo max 1600 px) e la converte in WebP.
 * Le GIF animate si lasciano com'erano.
 * Se la conversione fallisce: un formato comune resta com'è, uno strano viene rifiutato.
 */
export async function optimizeUploadedImage(file: Express.Multer.File): Promise<Express.Multer.File> {
  if (file.mimetype === "image/gif") return file;

  const parsed = path.parse(file.path);
  const outputPath = path.join(parsed.dir, `${parsed.name}-optimized.webp`);
  try {
    await runFfmpeg([
      "-i", file.path,
      "-frames:v", "1",
      "-vf", `scale='min(${MAX_IMAGE_EDGE}\\,iw)':'min(${MAX_IMAGE_EDGE}\\,ih)':force_original_aspect_ratio=decrease`,
      "-c:v", "libwebp",
      "-quality", String(IMAGE_WEBP_QUALITY),
      "-compression_level", "6",
      outputPath,
    ]);
    const stat = await fs.promises.stat(outputPath);
    await fs.promises.unlink(file.path);
    return { ...file, path: outputPath, filename: path.basename(outputPath), mimetype: "image/webp", size: stat.size };
  } catch (error) {
    await fs.promises.unlink(outputPath).catch(() => {});
    if (FORMATI_VISUALIZZABILI.has(file.mimetype)) {
      console.error("[immagini] ottimizzazione non riuscita, tengo l'originale:", error);
      return file;
    }
    await fs.promises.unlink(file.path).catch(() => {});
    throw new Error("Non riesco a leggere questa foto. Prova con un JPG o un PNG.");
  }
}
