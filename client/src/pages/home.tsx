import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import type { PetSummary } from "@shared/schema";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Composer } from "@/components/posts/composer";
import { PostList } from "@/components/posts/post-list";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/components/page-title";
import Landing from "./landing";

function Feed() {
  usePageTitle("Casa");
  const { user } = useAuth();
  const [scope, setScope] = useState<"all" | "following">("all");
  const { data: pets, isLoading } = useQuery<PetSummary[]>({ queryKey: ["/api/pets/mine"], staleTime: 0 });

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <h1 className="text-2xl">Ciao {user?.name || user?.username}! 👋</h1>

      {isLoading ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : pets && pets.length > 0 ? (
        <Composer pets={pets} />
      ) : (
        <div className="soft-card space-y-3 p-6 text-center">
          <p className="text-5xl" aria-hidden="true">🐾</p>
          <h2 className="text-xl">Presenta il tuo amico al mondo!</h2>
          <p className="text-muted-foreground">Crea il suo profilo e inizia a condividere i suoi momenti migliori.</p>
          <Button asChild><Link href="/nuovo-animale"><PlusCircle /> Crea il primo profilo</Link></Button>
        </div>
      )}

      <Tabs value={scope} onValueChange={(v) => setScope(v as "all" | "following")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">Per te</TabsTrigger>
          <TabsTrigger value="following">Chi segui</TabsTrigger>
        </TabsList>
      </Tabs>

      {scope === "all" ? (
        <PostList
          key="all"
          url="/api/feed"
          empty={
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-4xl" aria-hidden="true">🌱</p>
              <p className="mt-2">Qui non c'è ancora niente. Scrivi il primo post!</p>
            </div>
          }
        />
      ) : (
        <PostList
          key="following"
          url="/api/feed?scope=following"
          empty={
            <div className="space-y-3 py-12 text-center text-muted-foreground">
              <p className="text-4xl" aria-hidden="true">🔎</p>
              <p>Non segui ancora nessuno. Trova qualche nuovo amico!</p>
              <Button asChild variant="outline"><Link href="/esplora">Esplora</Link></Button>
            </div>
          }
        />
      )}
    </div>
  );
}

export default function Home() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? <Feed /> : <Landing />;
}
