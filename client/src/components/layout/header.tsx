import { Link, useLocation } from "wouter";
import { LogOut, PawPrint, PlusCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const NAV = [
  { href: "/", label: "Casa", match: (p: string) => p === "/" },
  { href: "/esplora", label: "Esplora", match: (p: string) => p.startsWith("/esplora") },
  { href: "/ponte", label: "Ponte dell'Arcobaleno 🌈", match: (p: string) => p.startsWith("/ponte") },
  { href: "/negozio", label: "Ciondoli", match: (p: string) => p.startsWith("/negozio") },
];

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
        <Link href="/" aria-label="Resta con me, home"><Logo /></Link>
        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Principale">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent",
                item.match(location) && "bg-accent text-primary",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/nuovo-animale"><PlusCircle /> Aggiungi un amico</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="user-menu">
                    <PawPrint /> {user.name || user.username}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>Ciao, {user.name || user.username}!</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/miei-animali")}>I miei animali</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/nuovo-animale")}>Aggiungi un amico</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/ordini")}>{user.isAdmin ? "Prenotazioni" : "I miei ciondoli"}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                    <LogOut className="mr-2 h-4 w-4" /> Esci
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link href="/auth">Accedi</Link></Button>
              <Button asChild size="sm"><Link href="/auth?tab=register">Unisciti</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
