import path from "path";

/**
 * Cartella base dei file scritti dall'app (foto, video, musica).
 *
 * In locale è semplicemente la cartella del progetto. Su un hosting come
 * Railway, dove un servizio può avere un solo volume persistente, si punta
 * DATA_DIR a quel volume e "uploads" e "private" nascono come sue
 * sottocartelle — così un unico disco basta per tutto.
 */
export function dataDir(): string {
  return process.env.DATA_DIR || process.cwd();
}

export function uploadsDir(...segments: string[]): string {
  return path.join(dataDir(), "uploads", ...segments);
}

export function privateDir(...segments: string[]): string {
  return path.join(dataDir(), "private", ...segments);
}
