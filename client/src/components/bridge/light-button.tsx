import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

/** "Accendi una luce": una al giorno per persona, per chi è sul Ponte. */
export function LightButton({ petId, petName, lightedToday }: { petId: number; petName: string; lightedToday: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [lit, setLit] = useState(lightedToday);

  const light = useMutation({
    mutationFn: async () => (await apiRequest("POST", `/api/pets/${petId}/light`)).json(),
    onSuccess: () => {
      setLit(true);
      qc.invalidateQueries({ queryKey: [`/api/pets/${petId}`] });
      qc.invalidateQueries({ queryKey: ["/api/bridge"] });
      toast({ title: "Luce accesa ✨", description: `${petName} sente il tuo affetto.` });
    },
    onError: (e: Error) => toast({ title: "Non si è accesa", description: e.message, variant: "destructive" }),
  });

  if (!user) {
    return (
      <Button asChild size="lg" className="rainbow-bar border-0 text-white hover:opacity-90">
        <Link href="/auth"><Sparkles /> Accedi per accendere una luce</Link>
      </Button>
    );
  }
  return (
    <Button
      size="lg"
      className="rainbow-bar border-0 text-white hover:opacity-90 disabled:opacity-90"
      disabled={lit || light.isPending}
      onClick={() => light.mutate()}
      data-testid="light-button"
    >
      <Sparkles className={lit ? "animate-glow" : ""} />
      {lit ? "Luce accesa oggi, grazie 💛" : `Accendi una luce per ${petName}`}
    </Button>
  );
}
