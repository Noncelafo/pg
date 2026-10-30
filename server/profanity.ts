// Filtro automatico per contenuti inappropriati nei tributi.
// Normalizza il testo (accenti, leetspeak, punteggiatura) e cerca
// corrispondenze a parola intera, per evitare falsi positivi su
// parole innocue che contengono sequenze simili.

const BAD_WORDS = [
  // Italiano — volgarità comuni e varianti
  "cazzo", "cazzi", "cazzone", "cazzata", "cazzate", "incazzato", "incazzata",
  "merda", "merde", "merdoso", "merdosa", "smerdare",
  "stronzo", "stronza", "stronzi", "stronze", "stronzata", "stronzate",
  "vaffanculo", "fanculo", "affanculo", "inculare", "inculato", "inculata",
  "culo", "culi", "culona", "culone",
  "puttana", "puttane", "puttanata", "puttanate", "troia", "troie",
  "mignotta", "mignotte", "zoccola", "zoccole", "bagascia",
  "porca", "porco", "porcodio", "porcamadonna",
  "coglione", "coglioni", "cogliona", "rincoglionito", "rincoglionita",
  "figa", "fica", "fighe", "fiche", "figata",
  "minchia", "minchiata", "minchiate",
  "bastardo", "bastarda", "bastardi", "bastarde",
  "pompino", "pompini", "bocchino", "bocchini",
  "cornuto", "cornuta", "cornuti",
  "frocio", "froci", "ricchione", "ricchioni", "finocchio",
  "negro", "negri", "negra", "negre",
  "mongoloide", "ritardato", "ritardata", "handicappato", "handicappata",
  // Bestemmie
  "dio cane", "dio porco", "dio boia", "madonna puttana", "dio merda",
  "diocane", "dioporco", "dioboia", "diomerda", "porcoddio", "porcodio",
  "madonna troia", "madonnatroia",
  // Inglese — le più comuni
  "fuck", "fucking", "fucker", "motherfucker", "shit", "bullshit",
  "asshole", "bitch", "bitches", "cunt", "dick", "cock", "pussy",
  "whore", "slut", "nigger", "nigga", "faggot", "retard",
];

// Sostituzioni tipiche usate per aggirare i filtri (leetspeak).
// Alcuni caratteri sono ambigui (1 = i oppure l, ! = i oppure l):
// per questi si generano tutte le varianti e si controllano tutte.
const LEET_MAP: Record<string, string> = {
  "0": "o", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b",
  "@": "a", "$": "s", "€": "e", "+": "t",
};
const AMBIGUOUS: Record<string, string[]> = {
  "1": ["i", "l"],
  "!": ["i", "l"],
};

function normalizeVariants(text: string): string[] {
  let t = text.toLowerCase();
  // Rimuove gli accenti (è→e, à→a, ...)
  t = t.normalize("NFD").replace(/[̀-ͯ]/g, "");
  // Applica la mappa leetspeak non ambigua
  t = t.replace(/[034578@$€+]/g, (c) => LEET_MAP[c] ?? c);

  // Espande i caratteri ambigui in tutte le combinazioni (limitate per sicurezza)
  let variants = [""];
  for (const ch of t) {
    const subs = AMBIGUOUS[ch];
    if (subs && variants.length <= 64) {
      variants = variants.flatMap(v => subs.map(s => v + s));
    } else {
      variants = variants.map(v => v + ch);
    }
  }

  // Tutto ciò che non è lettera diventa spazio
  return variants.map(v => v.replace(/[^a-z]+/g, " ").trim());
}

// Comprime lettere ripetute più di due volte (es. "meeerda" → "meerda" → confronto anche su versione compressa a 1)
function squeeze(text: string): string {
  return text.replace(/(.)\1+/g, "$1");
}

const BAD_SINGLE = new Set<string>();
const BAD_PHRASES: string[] = [];
for (const w of BAD_WORDS) {
  const n = normalizeVariants(w)[0];
  if (n.includes(" ")) BAD_PHRASES.push(n);
  else BAD_SINGLE.add(n);
}
const BAD_SINGLE_SQUEEZED = new Set(Array.from(BAD_SINGLE, squeeze));

function checkNormalized(normalized: string): boolean {
  for (const phrase of BAD_PHRASES) {
    if (normalized.includes(phrase)) return true;
  }

  const words = normalized.split(" ");
  for (const word of words) {
    if (BAD_SINGLE.has(word)) return true;
    if (BAD_SINGLE_SQUEEZED.has(squeeze(word))) return true;
  }

  // Controlla anche parole "attaccate" senza spazi (es. "seiunostronzo")
  const joined = normalized.replace(/ /g, "");
  for (const bad of Array.from(BAD_SINGLE)) {
    if (bad.length >= 5 && joined.includes(bad)) return true;
  }

  return false;
}

/**
 * Ritorna true se il testo contiene volgarità, bestemmie o insulti.
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  return normalizeVariants(text).some(checkNormalized);
}
