import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flag, Send, Trash2 } from "lucide-react";
import type { TributeView } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReportDialog } from "@/components/report-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { timeAgo } from "@/lib/format";

/** Le dediche lasciate a un amico che ha attraversato il Ponte. */
export function Tributes({ petId, petName }: { petId: number; petName: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const key = [`/api/pets/${petId}/tributes`];
  const { data: tributes } = useQuery<TributeView[]>({ queryKey: key, staleTime: 0 });
  const [message, setMessage] = useState("");
  const [reporting, setReporting] = useState<number | null>(null);

  const add = useMutation({
    mutationFn: async () => { await apiRequest("POST", `/api/pets/${petId}/tributes`, { message }); },
    onSuccess: () => { setMessage(""); qc.invalidateQueries({ queryKey: key }); toast({ title: "Dedica lasciata 💌", description: `${petName} sarà felice di leggerla.` }); },
    onError: (e: Error) => toast({ title: "Dedica non inviata", description: e.message, variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/tributes/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return (
    <section className="space-y-4" aria-label="Dediche">
      {user ? (
        <div className="soft-card space-y-3 p-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Lascia una dedica per ${petName}…`}
            rows={3}
            maxLength={500}
          />
          <div className="text-right">
            <Button onClick={() => add.mutate()} disabled={add.isPending || !message.trim()}>
              <Send /> Lascia la dedica
            </Button>
          </div>
        </div>
      ) : (
        <p className="soft-card p-4 text-center text-sm text-muted-foreground">
          <Link href="/auth" className="font-semibold text-primary underline">Accedi</Link> per lasciare una dedica a {petName}.
        </p>
      )}

      {tributes?.length === 0 && (
        <p className="py-6 text-center text-muted-foreground">Nessuna dedica ancora: scrivi la prima, {petName} la leggerà con la coda che scodinzola. 💛</p>
      )}
      {tributes?.map((t) => (
        <div key={t.id} className="soft-card flex gap-3 p-4" data-testid={`tribute-${t.id}`}>
          <div className="min-w-0 flex-1">
            <p className="whitespace-pre-wrap break-words">{t.message}</p>
            <p className="mt-2 text-xs text-muted-foreground">— {t.authorName} · {timeAgo(t.createdAt)}</p>
          </div>
          {user && (t.canDelete ? (
            <button aria-label="Elimina dedica" className="self-start p-1 text-muted-foreground hover:text-destructive" onClick={() => remove.mutate(t.id)}>
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <button aria-label="Segnala dedica" className="self-start p-1 text-muted-foreground hover:text-foreground" onClick={() => setReporting(t.id)}>
              <Flag className="h-4 w-4" />
            </button>
          ))}
        </div>
      ))}
      {reporting !== null && <ReportDialog target={{ tributeId: reporting }} open onOpenChange={(o) => !o && setReporting(null)} />}
    </section>
  );
}
