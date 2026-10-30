import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/components/page-title";

export default function NotFound() {
  usePageTitle("Pagina non trovata");
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="animate-floaty text-7xl" aria-hidden="true">🐕‍🦺</p>
      <h1 className="mt-4 text-3xl">Ops, qui non c'è nessuno!</h1>
      <p className="mt-2 text-muted-foreground">
        Questa pagina ha preso il guinzaglio ed è scappata a giocare. Torniamo a casa?
      </p>
      <Button asChild className="mt-6"><Link href="/">Torna a casa</Link></Button>
    </div>
  );
}
