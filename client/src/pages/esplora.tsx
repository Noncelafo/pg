import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import type { PetSummary } from "@shared/schema";
import { SPECIES } from "@shared/species";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PetCard } from "@/components/pets/pet-card";
import { usePageTitle } from "@/components/page-title";
import { cn } from "@/lib/utils";

const STATUS = [
  { id: "", label: "Tutti" },
  { id: "alive", label: "Qui con noi" },
  { id: "rainbow", label: "Sul Ponte 🌈" },
];

export default function Esplora() {
  usePageTitle("Esplora");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);

  const params = new URLSearchParams({ q: query, species, status, page: String(page) });
  const { data, isLoading, isFetching } = useQuery<{ items: PetSummary[]; hasMore: boolean }>({
    queryKey: [`/api/pets?${params}`],
    staleTime: 30_000,
  });

  const reset = (fn: () => void) => { fn(); setPage(0); };
  const chip = (active: boolean) =>
    cn("rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors", active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent");

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-3xl">Esplora 🔎</h1>
        <p className="text-muted-foreground">Trova nuovi amici da seguire.</p>
      </div>

      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); reset(() => setQuery(q.trim())); }}>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca per nome o razza…" aria-label="Cerca" />
        <Button type="submit" aria-label="Cerca"><Search /></Button>
      </form>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Stato">
        {STATUS.map((s) => (
          <button key={s.id} className={chip(status === s.id)} onClick={() => reset(() => setStatus(s.id))}>{s.label}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Specie">
        <button className={chip(species === "")} onClick={() => reset(() => setSpecies(""))}>Tutte le specie</button>
        {SPECIES.map((s) => (
          <button key={s.id} className={chip(species === s.id)} onClick={() => reset(() => setSpecies(s.id))}>{s.emoji} {s.label}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-3xl" />)}</div>
      ) : data && data.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4" data-testid="pet-grid">
          {data.items.map((pet) => <PetCard key={pet.id} pet={pet} />)}
        </div>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-5xl" aria-hidden="true">🐾</p>
          <p className="mt-2">Nessun amico trovato. Prova con un'altra ricerca!</p>
        </div>
      )}

      <div className="flex justify-center gap-3">
        {page > 0 && <Button variant="outline" onClick={() => setPage(page - 1)} disabled={isFetching}>Indietro</Button>}
        {data?.hasMore && <Button variant="outline" onClick={() => setPage(page + 1)} disabled={isFetching}>Avanti</Button>}
      </div>
    </div>
  );
}
