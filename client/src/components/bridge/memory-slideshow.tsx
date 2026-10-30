import { useEffect, useState } from "react";
import type { PetPhoto } from "@/components/pets/photo-grid";

/**
 * "I suoi momenti più belli": le foto dei suoi post che si alternano piano,
 * con dissolvenza e un leggero avvicinamento. Chi ha chiesto meno animazioni
 * vede le foto cambiare senza movimento.
 */
export function MemorySlideshow({ photos, petName }: { photos: PetPhoto[]; petName: string }) {
  const [index, setIndex] = useState(0);
  const list = photos.slice(0, 12);

  useEffect(() => {
    if (list.length < 2) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % list.length), 5000);
    return () => window.clearInterval(timer);
  }, [list.length]);

  if (list.length === 0) return null;

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-lg sm:aspect-[16/9]" data-testid="memory-slideshow">
      {list.map((p, i) => (
        <img
          key={p.id}
          src={p.url}
          alt={i === index ? p.text || `Un momento di ${petName}` : ""}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1500ms] ${i === index ? "scale-105 opacity-100 motion-reduce:scale-100" : "scale-100 opacity-0"}`}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-10 text-left text-white">
        <p className="font-heading text-lg">I momenti più belli di {petName}</p>
      </div>
      <div className="rainbow-bar absolute inset-x-0 bottom-0 h-1.5" aria-hidden="true" />
    </div>
  );
}
