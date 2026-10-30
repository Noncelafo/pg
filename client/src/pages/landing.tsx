import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Camera, Heart, Rainbow } from "lucide-react";
import type { PetSummary } from "@shared/schema";
import { SPECIES } from "@shared/species";
import { Button } from "@/components/ui/button";
import { PetCard } from "@/components/pets/pet-card";
import { usePageTitle } from "@/components/page-title";

const FEATURES = [
  {
    icon: Camera,
    tint: "bg-[hsl(var(--sun)/.35)]",
    title: "Un profilo tutto suo",
    text: "Foto, storia e le cose che ama di più. Ogni amico merita la sua paginetta, con tanto di foto di copertina.",
  },
  {
    icon: Heart,
    tint: "bg-[hsl(var(--coral)/.25)]",
    title: "Coccole a volontà",
    text: "Pubblica i suoi momenti migliori, ricevi coccole e parole dolci, segui gli amici che ti fanno sorridere.",
  },
  {
    icon: Rainbow,
    tint: "bg-[hsl(var(--lilac)/.4)]",
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
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-14 text-center sm:pt-20">
          <p className="mb-4 inline-block rounded-full bg-secondary/60 px-4 py-1.5 text-sm font-bold">
            Il social network degli animali 🐾
          </p>
          <h1 className="text-5xl sm:text-7xl">
            Resta <span className="rainbow-text">con me</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Il posto felice dove ogni animale ha il suo profilo, le sue foto e i suoi amici.
            Oggi che scodinzola accanto a te, e domani che ti guarda dall'arcobaleno: <strong className="text-foreground">resta sempre con te</strong>.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto"><Link href="/auth?tab=register">Crea il profilo del tuo amico</Link></Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto"><Link href="/esplora">Dai un'occhiata in giro</Link></Button>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3 text-4xl" aria-hidden="true">
            {SPECIES.slice(0, 8).map((s, i) => (
              <span key={s.id} className="animate-floaty" style={{ animationDelay: `${i * 0.35}s` }}>{s.emoji}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="mb-8 text-center text-3xl">Come funziona? È una festa.</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, tint, title, text }) => (
            <div key={title} className="soft-card hover-lift p-6">
              <span className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${tint}`}>
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mb-2 text-xl">{title}</h3>
              <p className="text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rainbow-sky my-10 py-16 text-center text-slate-800">
        <div className="mx-auto max-w-3xl px-4">
          <p className="text-5xl" aria-hidden="true">🌈</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">
            Tu sei il mio animale,<br />e resti con me ovunque io sia.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg">
            Nei Prati dell'Arcobaleno gli amici che hanno attraversato il Ponte continuano a correre, felici, nei nostri ricordi.
            Si accende una luce, si lascia una dedica, si sorride ripensando a loro.
          </p>
          <Button asChild size="lg" className="mt-6"><Link href="/ponte">Visita il Ponte dell'Arcobaleno</Link></Button>
        </div>
      </section>

      {recent.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-10">
          <h2 className="mb-6 text-center text-3xl">Gli ultimi arrivati 🎉</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {recent.map((pet) => <PetCard key={pet.id} pet={pet} />)}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h2 className="text-3xl">Pronti a farvi un po' di coccole?</h2>
        <Button asChild size="lg" className="mt-5"><Link href="/auth?tab=register">Unisciti a Resta con me</Link></Button>
      </section>
    </div>
  );
}
