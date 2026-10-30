import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import type { PetSummary } from "@shared/schema";
import { PetCard } from "@/components/pets/pet-card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/components/page-title";

export default function MieiAnimali() {
  usePageTitle("I miei animali");
  const { data, isLoading } = useQuery<PetSummary[]>({ queryKey: ["/api/pets/mine"], staleTime: 0 });
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <h1 className="text-3xl">I miei amici 🐾</h1>
      {isLoading ? (
        <Skeleton className="h-44 rounded-3xl" />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {data?.map((pet) => <PetCard key={pet.id} pet={pet} />)}
          <Link
            href="/nuovo-animale"
            className="hover-lift flex min-h-44 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed p-5 text-center font-semibold text-muted-foreground hover:border-primary hover:text-primary"
          >
            <PlusCircle className="h-8 w-8" />
            Aggiungi un amico
          </Link>
        </div>
      )}
    </div>
  );
}
