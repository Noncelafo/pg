import { Link } from "wouter";
import type { PetSummary } from "@shared/schema";
import { speciesInfo } from "@shared/species";
import { PetAvatar } from "./pet-avatar";
import { longDate } from "@/lib/format";

export function PetCard({ pet }: { pet: PetSummary }) {
  const info = speciesInfo(pet.species);
  const rainbow = pet.status === "rainbow";
  return (
    <Link
      href={`/pet/${pet.id}`}
      className="soft-card hover-lift group flex flex-col items-center gap-3 p-5 text-center"
      data-testid={`pet-card-${pet.id}`}
    >
      <PetAvatar pet={pet} className="h-24 w-24 text-4xl" />
      <div className="min-w-0">
        <p className="truncate font-heading text-lg">{pet.name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {info.emoji} {pet.breed || info.label}
        </p>
      </div>
      {rainbow && (
        <span className="rainbow-bar rounded-full px-3 py-0.5 text-xs font-bold text-white/95 shadow-sm">
          🌈 {pet.rainbowAt ? `sul Ponte dal ${longDate(pet.rainbowAt)}` : "sul Ponte"}
        </span>
      )}
    </Link>
  );
}
