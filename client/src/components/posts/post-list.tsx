import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import type { PostView } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "./post-card";
import type { ReactNode } from "react";

interface Page { items: PostView[]; hasMore: boolean }

/** Elenco di post con "Mostra altri": `url` è l'endpoint, `queryKey` la chiave in cache. */
export function PostList({ url, empty }: { url: string; empty: ReactNode }) {
  const q = useInfiniteQuery<Page, Error, InfiniteData<Page, number | undefined>, string[], number | undefined>({
    queryKey: ["posts", url],
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      const sep = url.includes("?") ? "&" : "?";
      const res = await fetch(`${url}${pageParam ? `${sep}before=${pageParam}` : ""}`, { credentials: "include" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Non riesco a caricare i post");
      return res.json();
    },
    getNextPageParam: (last) => (last.hasMore ? last.items[last.items.length - 1]?.id : undefined),
    staleTime: 0,
  });

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => <Skeleton key={i} className="h-72 rounded-3xl" />)}
      </div>
    );
  }
  if (q.isError) return <p className="py-8 text-center text-muted-foreground">{(q.error as Error).message}</p>;

  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  if (items.length === 0) return <>{empty}</>;

  return (
    <div className="space-y-4">
      {items.map((post) => <PostCard key={post.id} post={post} onChanged={() => q.refetch()} />)}
      {q.hasNextPage && (
        <div className="text-center">
          <Button variant="outline" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>
            {q.isFetchingNextPage ? "Un attimo…" : "Mostra altri"}
          </Button>
        </div>
      )}
    </div>
  );
}
