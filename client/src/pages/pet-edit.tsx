import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import type { PetProfile } from "@shared/schema";
import { PetForm, type PetFormValues } from "@/components/pets/pet-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePageTitle } from "@/components/page-title";
import NotFound from "./not-found";

export default function PetEdit() {
  usePageTitle("Modifica profilo");
  const [, params] = useRoute("/pet/:id/modifica");
  const id = Number(params?.id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: pet, isLoading, isError } = useQuery<PetProfile>({ queryKey: [`/api/pets/${id}`], staleTime: 0 });

  const save = useMutation({
    mutationFn: async (values: PetFormValues) => { await apiRequest("PATCH", `/api/pets/${id}`, values); },
    onSuccess: () => {
      qc.invalidateQueries();
      toast({ title: "Salvato! ✨" });
      navigate(`/pet/${id}`);
    },
    onError: (e: Error) => toast({ title: "Non riesco a salvare", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="mx-auto max-w-xl px-4 py-8"><Skeleton className="h-96 rounded-3xl" /></div>;
  if (isError || !pet || !pet.isOwner) return <NotFound />;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-3xl">Modifica il profilo di {pet.name}</h1>
      <div className="soft-card p-6">
        <PetForm
          submitLabel="Salva"
          pending={save.isPending}
          onSubmit={(v) => save.mutate(v)}
          defaults={{
            name: pet.name,
            species: pet.species,
            breed: pet.breed ?? "",
            birthDate: pet.birthDate ?? "",
            bio: pet.bio ?? "",
            favoriteThings: pet.favoriteThings ?? "",
          }}
        />
      </div>
    </div>
  );
}
