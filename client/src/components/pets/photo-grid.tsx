import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export interface PetPhoto { id: number; url: string; text: string | null }

export function usePetPhotos(petId: number) {
  return useQuery<PetPhoto[]>({ queryKey: [`/api/pets/${petId}/photos`], staleTime: 0 });
}

/** Tutte le foto dei suoi post, a griglia; un tocco le apre in grande. */
export function PhotoGrid({ petId, petName }: { petId: number; petName: string }) {
  const { data: photos, isLoading } = usePetPhotos(petId);
  const [open, setOpen] = useState<number | null>(null);

  if (isLoading) return <div className="grid grid-cols-3 gap-1.5">{[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}</div>;
  if (!photos?.length) {
    return <p className="py-10 text-center text-muted-foreground">Ancora nessuna foto. Le foto dei post compariranno qui. 📸</p>;
  }

  const current = open !== null ? photos[open] : null;
  const go = (step: number) => setOpen((i) => (i === null ? i : (i + step + photos.length) % photos.length));

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5" data-testid="photo-grid">
        {photos.map((p, i) => (
          <button key={p.id} onClick={() => setOpen(i)} className="group aspect-square overflow-hidden rounded-xl">
            <img src={p.url} alt={p.text || `Foto di ${petName}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </button>
        ))}
      </div>
      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-3xl border-0 bg-black p-0 text-white" onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}>
          <DialogTitle className="sr-only">Foto di {petName}</DialogTitle>
          {current && (
            <div className="relative">
              <img src={current.url} alt={current.text || `Foto di ${petName}`} className="max-h-[80vh] w-full object-contain" />
              {current.text && <p className="p-4 text-sm text-white/90">{current.text}</p>}
              {photos.length > 1 && (
                <>
                  <button onClick={() => go(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2" aria-label="Foto precedente"><ChevronLeft /></button>
                  <button onClick={() => go(1)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2" aria-label="Foto successiva"><ChevronRight /></button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
