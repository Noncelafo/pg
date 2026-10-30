import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const todayIso = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());

/**
 * "Accompagna sul Ponte": il profilo si sposta nei Prati dell'Arcobaleno.
 * Il tono è sempre quello di un viaggio che continua, mai di una fine.
 */
export function RainbowDialog({ petId, petName, open, onOpenChange }: { petId: number; petName: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [rainbowAt, setRainbowAt] = useState(todayIso());
  const [rainbowMessage, setRainbowMessage] = useState("");

  const go = useMutation({
    mutationFn: async () => { await apiRequest("POST", `/api/pets/${petId}/rainbow`, { rainbowAt, rainbowMessage }); },
    onSuccess: () => {
      qc.invalidateQueries();
      onOpenChange(false);
      toast({ title: "🌈 Buon viaggio, " + petName, description: "Resta con te: il suo profilo, le foto e le coccole sono tutti qui." });
    },
    onError: (e: Error) => toast({ title: "Non riesco a completare il passaggio", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl"><span className="rainbow-text">Accompagna {petName} sul Ponte</span> 🌈</DialogTitle>
          <DialogDescription className="space-y-2 pt-1 text-left">
            <span className="block">
              Non è un addio. {petName} resta con te: il profilo, le foto, i post e tutte le coccole rimangono dove sono.
            </span>
            <span className="block">
              Da oggi vivrà nei Prati dell'Arcobaleno, dove amici e familiari potranno accendere una luce e lasciare una dedica.
              Potrai continuare a condividere i suoi ricordi, quando vuoi.
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rainbowAt">Quando ha attraversato il Ponte?</Label>
            <Input id="rainbowAt" type="date" value={rainbowAt} max={todayIso()} onChange={(e) => setRainbowAt(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rainbowMessage">Un pensiero per {petName} (facoltativo)</Label>
            <Textarea
              id="rainbowMessage"
              value={rainbowMessage}
              onChange={(e) => setRainbowMessage(e.target.value)}
              placeholder="Grazie per ogni corsa, ogni fusa, ogni giorno insieme…"
              rows={4}
              maxLength={600}
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Non ancora</Button>
            <Button onClick={() => go.mutate()} disabled={go.isPending} data-testid="confirm-rainbow">
              {go.isPending ? "Un attimo…" : "Accompagnalo sul Ponte"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
