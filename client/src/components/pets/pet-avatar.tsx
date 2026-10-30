import { speciesInfo } from "@shared/species";
import { cn } from "@/lib/utils";

const TINTS = [
  "bg-[hsl(var(--sun)/.35)]",
  "bg-[hsl(var(--sky)/.35)]",
  "bg-[hsl(var(--mint)/.35)]",
  "bg-[hsl(var(--lilac)/.4)]",
  "bg-[hsl(var(--coral)/.25)]",
];

/** Foto tonda dell'animale; senza foto compare la faccina della specie. */
export function PetAvatar({
  pet,
  className,
  rainbowRing,
}: {
  pet: { id: number; name: string; species: string; avatarUrl: string | null; status?: string };
  className?: string;
  rainbowRing?: boolean;
}) {
  const info = speciesInfo(pet.species);
  const ring = rainbowRing ?? pet.status === "rainbow";
  return (
    <span
      className={cn(
        "relative inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-2xl",
        ring ? "ring-2 ring-offset-2 ring-offset-background ring-[#b9a2ff]" : "",
        pet.avatarUrl ? "bg-muted" : TINTS[pet.id % TINTS.length],
        className,
      )}
    >
      {pet.avatarUrl ? (
        <img src={pet.avatarUrl} alt={pet.name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span aria-hidden="true" className="leading-none">{info.emoji}</span>
      )}
    </span>
  );
}
