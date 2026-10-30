import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PetForm, type PetFormValues } from "@/components/pets/pet-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePageTitle } from "@/components/page-title";

export default function PetNew() {
  usePageTitle("Nuovo amico");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async (values: PetFormValues) => (await apiRequest("POST", "/api/pets", values)).json() as Promise<{ id: number }>,
    onSuccess: ({ id }) => {
      qc.invalidateQueries();
      toast({ title: "Evviva, un nuovo amico! 🎉", description: "Aggiungi una foto profilo e scrivi il primo post." });
      navigate(`/pet/${id}`);
    },
    onError: (e: Error) => toast({ title: "Non riesco a crearlo", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-3xl">Presenta il tuo amico 🐾</h1>
      <p className="mb-6 mt-1 text-muted-foreground">Bastano due righe per iniziare: il resto lo aggiungi quando vuoi.</p>
      <div className="soft-card p-6">
        <PetForm submitLabel="Crea il profilo" pending={create.isPending} onSubmit={(v) => create.mutate(v)} />
      </div>
    </div>
  );
}
