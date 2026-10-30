import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Flag, Heart, MessageCircle, Trash2 } from "lucide-react";
import type { PostView } from "@shared/schema";
import { speciesInfo } from "@shared/species";
import { PetAvatar } from "@/components/pets/pet-avatar";
import { Comments } from "./comments";
import { ReportDialog } from "@/components/report-dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PostCard({ post, onChanged }: { post: PostView; onChanged: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [cuddled, setCuddled] = useState(post.cuddled);
  const [count, setCount] = useState(post.cuddles);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [showComments, setShowComments] = useState(false);
  const [popping, setPopping] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const rainbow = post.pet.status === "rainbow";
  const info = speciesInfo(post.pet.species);

  const toggle = useMutation({
    mutationFn: async (next: boolean) => (await apiRequest(next ? "POST" : "DELETE", `/api/posts/${post.id}/cuddle`)).json(),
    onMutate: (next) => { setCuddled(next); setCount((c) => c + (next ? 1 : -1)); if (next) setPopping(true); },
    onSuccess: (data: { cuddles: number; cuddled: boolean }) => { setCount(data.cuddles); setCuddled(data.cuddled); },
    onError: (e: Error, next) => {
      setCuddled(!next); setCount((c) => c + (next ? -1 : 1));
      toast({ title: "Non è andata", description: e.message, variant: "destructive" });
    },
  });

  const remove = useMutation({
    mutationFn: async () => { await apiRequest("DELETE", `/api/posts/${post.id}`); },
    onSuccess: () => { qc.invalidateQueries(); onChanged(); toast({ title: "Post eliminato" }); },
    onError: (e: Error) => toast({ title: "Non riesco a eliminarlo", description: e.message, variant: "destructive" }),
  });

  function cuddle() {
    if (!user) {
      toast({ title: "Accedi per coccolare 🐾", description: "Ci vuole un attimo, promesso." });
      return;
    }
    toggle.mutate(!cuddled);
  }

  return (
    <article className="soft-card overflow-hidden" data-testid={`post-${post.id}`}>
      <header className="flex items-center gap-3 p-4 pb-3">
        <Link href={`/pet/${post.pet.id}`}><PetAvatar pet={post.pet} /></Link>
        <div className="min-w-0 flex-1">
          <Link href={`/pet/${post.pet.id}`} className="block truncate font-heading text-base hover:underline">
            {post.pet.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {info.emoji} {post.pet.breed || info.label} · {timeAgo(post.createdAt)}
            {rainbow && <span className="ml-1.5 font-semibold text-violet-500">🌈 dal Ponte</span>}
          </p>
        </div>
        {user && (post.canDelete ? (
          <button className="p-2 text-muted-foreground hover:text-destructive" aria-label="Elimina post" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" />
          </button>
        ) : (
          <button className="p-2 text-muted-foreground hover:text-foreground" aria-label="Segnala post" onClick={() => setReporting(true)}>
            <Flag className="h-4 w-4" />
          </button>
        ))}
      </header>

      {post.text && <p className="whitespace-pre-wrap break-words px-4 pb-3 text-[15px]">{post.text}</p>}
      {post.imageUrl && (
        <img src={post.imageUrl} alt={`Foto di ${post.pet.name}`} className="max-h-[34rem] w-full object-cover" loading="lazy" />
      )}

      <div className="flex items-center gap-1 px-2 py-2">
        <button
          onClick={cuddle}
          aria-pressed={cuddled}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent",
            cuddled ? "text-primary" : "text-muted-foreground",
          )}
          data-testid={`cuddle-${post.id}`}
        >
          <Heart
            className={cn("h-5 w-5", cuddled && "fill-current", popping && "animate-pop")}
            onAnimationEnd={() => setPopping(false)}
          />
          {count > 0 ? `${count} ${count === 1 ? "coccola" : "coccole"}` : "Coccola"}
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent"
          data-testid={`comments-toggle-${post.id}`}
        >
          <MessageCircle className="h-5 w-5" />
          {commentCount > 0 ? `${commentCount} ${commentCount === 1 ? "parola dolce" : "parole dolci"}` : "Scrivi"}
        </button>
      </div>

      {showComments && (
        <div className="px-4 pb-4">
          <Comments postId={post.id} onCount={setCommentCount} />
        </div>
      )}

      {reporting && <ReportDialog target={{ postId: post.id }} open onOpenChange={setReporting} />}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo post?</AlertDialogTitle>
            <AlertDialogDescription>Spariranno anche le coccole e le parole dolci che ha ricevuto.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Lo tengo</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate()}>Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
