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
import { BrandVideo } from "@/components/media/brand-video";
import { VIDEO } from "@/lib/brand-media";
import { useAuth } from "@/hooks/use-auth";

interface Bridge { items: PetSummary[]; hasMore: boolean; residents: number; lights: number }

export default function Ponte() {
  usePageTitle("Il Ponte dell'Arcobaleno");
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching } = useQuery<Bridge>({ queryKey: [`/api/bridge?page=${page}`], staleTime: 30_000 });

  return (
    <div>
      <section className="relative isolate flex min-h-[78svh] items-center overflow-hidden py-20 text-center text-white">
        <BrandVideo media={VIDEO.ponteTramonto} fallbackClass="bg-gradient-to-b from-[#7c9cf0] via-[#b48ce0] to-[#ffb28a]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2b2350]/45 via-[#2b2350]/25 to-[#2b2350]/65" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-4">
          <p className="animate-floaty text-6xl drop-shadow" aria-hidden="true">🌈</p>
          <h1 className="mt-3 text-4xl drop-shadow-lg sm:text-6xl">Il Ponte dell'Arcobaleno</h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/90 drop-shadow sm:text-lg">
            Qui gli amici che hanno attraversato l'arcobaleno corrono felici, in prati senza fine.
            Non sono andati via: restano con noi, nelle foto, nelle storie e in ogni luce che accendiamo per loro.
          </p>
          {data && (
            <div className="mt-8 inline-flex gap-8 rounded-3xl bg-white/15 px-8 py-4 backdrop-blur">
              <div><p className="font-heading text-3xl">{data.residents}</p><p className="text-xs font-bold uppercase tracking-wide text-white/85">{data.residents === 1 ? "Amico" : "Amici"} sul Ponte</p></div>
              <div><p className="font-heading text-3xl">{data.lights} ✨</p><p className="text-xs font-bold uppercase tracking-wide text-white/85">{data.lights === 1 ? "Luce accesa" : "Luci accese"}</p></div>
            </div>
          )}
        </div>
        <div className="rainbow-bar absolute inset-x-0 bottom-0 h-2" aria-hidden="true" />
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <p className="text-sm font-bold uppercase tracking-widest text-violet-500">Resta con me</p>
          <h2 className="mt-2 text-3xl sm:text-4xl">L'amore non attraversa il Ponte: resta qui, con te</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Il muso che cercava la tua mano, il peso leggero ai piedi del letto, la festa ogni volta che tornavi.
            Niente di tutto questo se ne va. Qui puoi continuare a raccontarlo, a guardarlo, a sorriderne, con chi gli ha voluto bene quanto te.
          </p>
        </div>
        <div className="relative order-1 aspect-[4/5] overflow-hidden rounded-[2rem] shadow-xl sm:aspect-[4/3] md:order-2 md:aspect-[4/5]">
          <BrandVideo media={VIDEO.ponteAbbraccio} fallbackClass="bg-gradient-to-br from-[#e6dbff] via-[#ffd6c2] to-[#ffe9a8]" />
          <div className="rainbow-bar absolute inset-x-0 bottom-0 h-1.5" aria-hidden="true" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-4 pb-8">
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
