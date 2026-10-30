import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flag, Send, Trash2 } from "lucide-react";
import type { CommentView } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { timeAgo } from "@/lib/format";
import { ReportDialog } from "@/components/report-dialog";

export function Comments({ postId, onCount }: { postId: number; onCount: (n: number) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const key = [`/api/posts/${postId}/comments`];
  const { data: comments, isLoading } = useQuery<CommentView[]>({ queryKey: key, staleTime: 0 });
  const [text, setText] = useState("");
  useEffect(() => { if (comments) onCount(comments.length); }, [comments]); // eslint-disable-line react-hooks/exhaustive-deps
  const [reporting, setReporting] = useState<number | null>(null);

  const add = useMutation({
    mutationFn: async () => { await apiRequest("POST", `/api/posts/${postId}/comments`, { text }); },
    onSuccess: () => { setText(""); qc.invalidateQueries({ queryKey: key }); },
    onError: (e: Error) => toast({ title: "Commento non inviato", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/comments/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); },
  });

  return (
    <div className="space-y-3 border-t pt-3">
      {isLoading && <p className="text-sm text-muted-foreground">Un attimo…</p>}
      {comments?.length === 0 && (
        <p className="text-sm text-muted-foreground">Nessuna parola dolce, per ora. Scrivi tu la prima!</p>
      )}
      {comments?.map((c) => (
        <div key={c.id} className="group flex gap-2 text-sm" data-testid={`comment-${c.id}`}>
          <div className="min-w-0 flex-1 rounded-2xl bg-muted px-3 py-2">
            <p className="font-semibold">
              {c.authorName} <span className="font-normal text-muted-foreground">· {timeAgo(c.createdAt)}</span>
            </p>
            <p className="whitespace-pre-wrap break-words">{c.text}</p>
          </div>
          {user && (
            <div className="flex flex-col justify-center gap-1 opacity-60 hover:opacity-100">
              {c.canDelete ? (
                <button aria-label="Elimina commento" onClick={() => remove.mutate(c.id)}><Trash2 className="h-4 w-4" /></button>
              ) : (
                <button aria-label="Segnala commento" onClick={() => setReporting(c.id)}><Flag className="h-4 w-4" /></button>
              )}
            </div>
          )}
        </div>
      ))}

      {user ? (
        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); if (text.trim()) add.mutate(); }}
        >
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Scrivi una parola dolce…" maxLength={500} />
          <Button type="submit" size="icon" disabled={add.isPending || !text.trim()} aria-label="Invia">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href="/auth" className="font-semibold text-primary underline">Accedi</Link> per lasciare una parola dolce.
        </p>
      )}
      {reporting !== null && (
        <ReportDialog target={{ commentId: reporting }} open onOpenChange={(o) => !o && setReporting(null)} />
      )}
    </div>
  );
}
