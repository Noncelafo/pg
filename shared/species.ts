// Le specie tra cui scegliere. L'emoji fa da faccina quando manca la foto.
export const SPECIES = [
  { id: "cane", label: "Cane", emoji: "🐶" },
  { id: "gatto", label: "Gatto", emoji: "🐱" },
  { id: "coniglio", label: "Coniglio", emoji: "🐰" },
  { id: "criceto", label: "Criceto e roditori", emoji: "🐹" },
  { id: "uccello", label: "Uccellino", emoji: "🐦" },
  { id: "pesce", label: "Pesciolino", emoji: "🐠" },
  { id: "tartaruga", label: "Tartaruga", emoji: "🐢" },
  { id: "rettile", label: "Rettile", emoji: "🦎" },
  { id: "cavallo", label: "Cavallo", emoji: "🐴" },
  { id: "furetto", label: "Furetto", emoji: "🦦" },
  { id: "altro", label: "Altro amico", emoji: "🐾" },
] as const;

export type SpeciesId = typeof SPECIES[number]["id"];

export function speciesInfo(id: string) {
  return SPECIES.find((s) => s.id === id) ?? SPECIES[SPECIES.length - 1];
}

export function isValidSpecies(id: string): boolean {
  return SPECIES.some((s) => s.id === id);
}
