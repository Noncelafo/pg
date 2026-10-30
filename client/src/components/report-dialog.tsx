import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type ReportTarget = { postId: number } | { commentId: number } | { tributeId: number } | { petId: number };

/** Finestra per segnalare qualcosa che non va, con tono gentile. */
export function ReportDialog({
  target,
  open,
  onOpenChange,
}: {
  target: ReportTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  async function send() {
    setSending(true);
    try {
      await apiRequest("POST", "/api/reports", { ...target, reason });
      toast({ title: "Grazie! 💛", description: "Abbiamo ricevuto la segnalazione e ce ne occupiamo noi." });
      setReason("");
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Non è partita", description: (error as Error).message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Qualcosa non va?</DialogTitle>
          <DialogDescription>
            Resta con me è un posto felice per tutti. Raccontaci cosa hai visto e ci pensiamo noi.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Cosa ti ha dato fastidio?"
          maxLength={500}
          rows={4}
        />
        <Button onClick={send} disabled={sending || reason.trim().length < 3}>
          {sending ? "Invio…" : "Invia segnalazione"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

