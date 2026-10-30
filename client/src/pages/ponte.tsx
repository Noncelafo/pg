import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { PetSummary } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PetCard } from "@/components/pets/pet-card";
import { PostList } from "@/components/posts/post-list";
import { usePageTitle } from "@/components/page-title";
import { useAuth } from "@/hooks/use-auth";

interface Bridge { items: PetSummary[]; hasMore: boolean; residents: number; lights: number }

export default function Ponte() {
  usePageTitle("Il Ponte dell'Arcobaleno");
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching } = useQuery<Bridge>({ queryKey: [`/api/bridge?page=${page}`], staleTime: 30_000 });

  return (
    <div>
      <section className="rainbow-sky relative overflow-hidden py-14 text-center text-slate-800">
        <div className="mx-auto max-w-3xl px-4">
          <p className="animate-floaty text-6xl" aria-hidden="true">🌈</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">Il Ponte dell'Arcobaleno</h1>
          <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg">
            Qui gli amici che hanno attraversato l'arcobaleno corrono felici, senza più nessun dolore, in prati senza fine.
            Non sono andati via: restano con noi, nelle foto, nelle storie e in ogni luce che accendiamo per loro.
          </p>
          {data && (
            <div className="mt-6 flex justify-center gap-8">
              <div><p className="font-heading text-3xl">{data.residents}</p><p className="text-xs font-bold uppercase tracking-wide">{data.residents === 1 ? "Amico" : "Amici"} sul Ponte</p></div>
              <div><p className="font-heading text-3xl">{data.lights} ✨</p><p className="text-xs font-bold uppercase tracking-wide">{data.lights === 1 ? "Luce accesa" : "Luci accese"}</p></div>
            </div>
          )}
          <div className="rainbow-bar mx-auto mt-8 h-2 w-40 rounded-full" aria-hidden="true" />
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="soft-card p-6 text-center">
          <h2 className="text-2xl">Il tuo amico ha attraversato il Ponte?</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Dal suo profilo puoi accompagnarlo sul Ponte con un tocco: il profilo, le foto e i post restano esattamente dove sono,
            e da quel momento amici e familiari possono accendere una luce e lasciargli una dedica.
          </p>
          {user ? (
            <Button asChild className="mt-4"><Link href="/miei-animali">Vai ai miei amici</Link></Button>
          ) : (
            <Button asChild className="mt-4"><Link href="/auth?tab=register">Unisciti a Resta con me</Link></Button>
          )}
        </div>

        <Tabs defaultValue="prati">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="prati">I Prati</TabsTrigger>
            <TabsTrigger value="ricordi">Ricordi dal Ponte</TabsTrigger>
          </TabsList>

          <TabsContent value="prati" className="mt-5">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-3xl" />)}</div>
            ) : data && data.items.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4" data-testid="bridge-grid">
                  {data.items.map((pet) => <PetCard key={pet.id} pet={pet} />)}
                </div>
                <div className="mt-5 flex justify-center gap-3">
                  {page > 0 && <Button variant="outline" onClick={() => setPage(page - 1)} disabled={isFetching}>Indietro</Button>}
                  {data.hasMore && <Button variant="outline" onClick={() => setPage(page + 1)} disabled={isFetching}>Avanti</Button>}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <p className="text-5xl" aria-hidden="true">🌤️</p>
                <p className="mt-2">I Prati sono ancora vuoti. E va bene così: significa che tutti gli amici sono ancora qui a giocare.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ricordi" className="mx-auto mt-5 max-w-2xl">
            <PostList
              url="/api/bridge/posts"
              empty={<p className="py-12 text-center text-muted-foreground">Ancora nessun ricordo condiviso dal Ponte.</p>}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
