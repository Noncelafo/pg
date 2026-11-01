import { Link } from "wouter";
import { Logo } from "@/components/logo";

export default function Footer() {
  return (
    <footer className="mt-12 border-t bg-background/60 pb-24 pt-8 md:pb-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 text-center">
        <Logo />
        <p className="max-w-md text-sm text-muted-foreground">
          Il posto felice per chi ci scodinzola, ci fa le fusa e ci riempie la casa. Oggi, domani e per sempre. 🐾
        </p>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold" aria-label="Piè di pagina">
          <Link href="/esplora" className="hover:text-primary">Esplora</Link>
          <Link href="/ponte" className="hover:text-primary">Ponte dell'Arcobaleno</Link>
          <Link href="/negozio" className="hover:text-primary">Braccialetti NFC</Link>
          <Link href="/auth" className="hover:text-primary">Accedi</Link>
        </nav>
        <div className="rainbow-bar h-1 w-24 rounded-full" aria-hidden="true" />
      </div>
    </footer>
  );
}
