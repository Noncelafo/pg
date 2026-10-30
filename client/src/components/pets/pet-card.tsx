import { Link } from "wouter";
import type { PetSummary } from "@shared/schema";
import { speciesInfo } from "@shared/species";
import { longDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const TINTS = [
  "from-[#ffd29d] to-[#f76c4b]",
  "from-[#bfe3ff] to-[#7c9cf0]",
  "from-[#c8f0d8] to-[#5ccf8b]",
  "from-[#e6dbff] to-[#a78bfa]",
];

/** Scheda fotografica: la foto riempie la scheda, il nome sta sopra. */
export function PetCard({ pet }: { pet: PetSummary }) {
  const info = speciesInfo(pet.species);
  const rainbow = pet.status === "rainbow";
  return (
    <Link
      href={`/pet/${pet.id}`}
      className={cn("hover-lift group relative block aspect-[4/5] overflow-hidden rounded-3xl shadow-sm", rainbow && "ring-2 ring-[#b9a2ff] ring-offset-2 ring-offset-background")}
      data-testid={`pet-card-${pet.id}`}
    >
      {pet.avatarUrl ? (
        <img src={pet.avatarUrl} alt={pet.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      ) : (
        <div className={cn("absolute inset-0 flex items-center justify-center bg-gradient-to-br text-7xl", TINTS[pet.id % TINTS.length])} aria-hidden="true">
          {info.emoji}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-12 text-white">
        <p className="truncate font-heading text-xl">{pet.name}</p>
        <p className="truncate text-sm text-white/85">{info.emoji} {pet.breed || info.label}</p>
      </div>
      {rainbow && (
        <span className="rainbow-bar absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white shadow">
          🌈 {pet.rainbowAt ? `dal ${longDate(pet.rainbowAt)}` : "sul Ponte"}
        </span>
      )}
    </Link>
  );
}
