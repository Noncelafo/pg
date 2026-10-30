import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import type { PetSummary } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { PetCard } from "@/components/pets/pet-card";
import { BrandVideo } from "@/components/media/brand-video";
import { BrandPhoto } from "@/components/media/brand-photo";
import { usePageTitle } from "@/components/page-title";
import { FOTO, VIDEO } from "@/lib/brand-media";

const FEATURES = [
  {
    foto: FOTO.profilo,
    title: "Un profilo tutto suo",
    text: "Foto, storia e le cose che ama di più. Ogni amico merita la sua pagina, con tanto di copertina.",
  },
  {
    foto: FOTO.coccole,
    title: "Coccole a volontà",
    text: "Pubblica i suoi momenti migliori, ricevi coccole e parole dolci, segui gli amici che ti fanno sorridere.",
  },
  {
    foto: FOTO.ponte,
    title: "Il Ponte dell'Arcobaleno",
    text: "Quando arriva il momento di salutarsi, nessun addio: il profilo resta con te e si trasferisce nei Prati dell'Arcobaleno.",
  },
];

export default function Landing() {
  usePageTitle();
  const { data } = useQuery<{ items: PetSummary[] }>({ queryKey: ["/api/pets"], staleTime: 60_000 });
  const recent = data?.items.slice(0, 4) ?? [];

  return (
    <div>
      {/* Apertura: video a tutto schermo */}
      <section className="relative isolate flex min-h-[88svh] items-end overflow-hidden text-white">
        <BrandVideo media={VIDEO.heroCorsa} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-5xl px-4 pb-16 pt-32 sm:pb-24">
          <p className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold backdrop-blur">
            Il social network degli animali 🐾
          </p>
          <h1 className="text-5xl drop-shadow-lg sm:text-7xl md:text-8xl">Resta con me.</h1>
          <p className="mt-5 max-w-xl text-lg text-white/90 drop-shadow sm:text-xl">
            Tu sei il mio animale, e resti con me ovunque io sia. Il posto dove raccontare ogni corsa, ogni fusa, ogni giorno insieme.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link href="/auth?tab=register">Crea il profilo del tuo amico</Link></Button>
            <Button asChild size="lg" variant="outline" className="border-white/60 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white">
              <Link href="/esplora">Dai un'occhiata in giro</Link>
            </Button>
          </div>
        </div>
        <ChevronDown className="absolute bottom-4 left-1/2 h-7 w-7 -translate-x-1/2 animate-bounce text-white/80" aria-hidden="true" />
      </section>

      {/* Mosaico di momenti */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Momenti</p>
          <h2 className="mt-2 text-3xl sm:text-4xl">Le piccole cose che ci rendono felici</h2>
        </div>
        <div className="grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[220px] md:grid-cols-4">
          {FOTO.momenti.map((m, i) => (
            <figure
              key={m.src}
              className={[
                "group relative overflow-hidden rounded-3xl",
                i === 0 ? "col-span-2 row-span-2" : "",
                i === 3 || i === 4 ? "md:col-span-2" : "",
                i === 5 ? "col-span-2" : "",
              ].join(" ")}
            >
              <BrandPhoto src={m.src} alt={m.alt} index={i} className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 font-heading text-lg text-white">
                {m.didascalia}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Come funziona, con foto */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-8 text-center text-3xl sm:text-4xl">Come funziona? È una festa.</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map(({ foto, title, text }, i) => (
            <div key={title} className="soft-card hover-lift overflow-hidden">
              <BrandPhoto src={foto.src} alt={foto.alt} index={i + 1} className="aspect-[4/3] w-full" />
              <div className="p-6">
                <h3 className="mb-2 text-xl">{title}</h3>
                <p className="text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Insieme: video e parole */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-16 md:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-xl sm:aspect-[4/3] md:aspect-[4/5]">
          <BrandVideo media={VIDEO.insieme} fallbackClass="bg-gradient-to-br from-[#ffd29d] via-[#f7a07b] to-[#f76c4b]" />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Insieme</p>
          <h2 className="mt-2 text-3xl sm:text-4xl">Ogni giorno insieme è un regalo</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            La corsa del mattino, il muso sul cuscino, l'attesa dietro la porta quando torni a casa.
            Su Resta con me questi momenti diventano storie da condividere con chi li capisce davvero.
          </p>
          <Button asChild size="lg" className="mt-6"><Link href="/auth?tab=register">Inizia a raccontare</Link></Button>
        </div>
      </section>

      {/* Il Ponte, con video */}
      <section className="relative isolate overflow-hidden py-24 text-center text-white sm:py-32">
        <BrandVideo media={VIDEO.ponteTramonto} fallbackClass="bg-gradient-to-b from-[#7c9cf0] via-[#b48ce0] to-[#ffb28a]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2b2350]/50 via-[#2b2350]/30 to-[#2b2350]/60" aria-hidden="true" />
        <div className="rainbow-bar absolute inset-x-0 top-0 h-1.5" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-4">
          <p className="text-5xl drop-shadow" aria-hidden="true">🌈</p>
          <h2 className="mt-4 text-3xl drop-shadow-lg sm:text-5xl">
            Tu sei il mio animale,<br />e resti con me ovunque io sia.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/90 drop-shadow sm:text-lg">
            Nei Prati dell'Arcobaleno gli amici che hanno attraversato il Ponte continuano a correre, felici, nei nostri ricordi.
            Si accende una luce, si lascia una dedica, si sorride ripensando a loro.
          </p>
          <Button asChild size="lg" className="mt-8 bg-white text-[#2b2350] hover:bg-white/90">
            <Link href="/ponte">Visita il Ponte dell'Arcobaleno</Link>
          </Button>
        </div>
      </section>

      {recent.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-8 text-center text-3xl sm:text-4xl">Gli ultimi arrivati 🎉</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {recent.map((pet) => <PetCard key={pet.id} pet={pet} />)}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-3xl sm:text-4xl">Pronti a farvi un po' di coccole?</h2>
        <Button asChild size="lg" className="mt-6"><Link href="/auth?tab=register">Unisciti a Resta con me</Link></Button>
      </section>
    </div>
  );
}
