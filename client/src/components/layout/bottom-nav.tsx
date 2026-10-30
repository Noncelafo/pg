import { Link, useLocation } from "wouter";
import { Compass, Home, PlusCircle, Rainbow, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

/** Barra in basso, solo su telefono: come in un'app vera. */
export default function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const items = [
    { href: "/", label: "Casa", icon: Home, active: location === "/" },
    { href: "/esplora", label: "Esplora", icon: Compass, active: location.startsWith("/esplora") },
    { href: user ? "/nuovo-animale" : "/auth?tab=register", label: "Nuovo", icon: PlusCircle, active: location === "/nuovo-animale" },
    { href: "/ponte", label: "Ponte", icon: Rainbow, active: location.startsWith("/ponte") },
    { href: user ? "/miei-animali" : "/auth", label: user ? "Io" : "Accedi", icon: User, active: location === "/miei-animali" || location === "/auth" },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Navigazione rapida"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ href, label, icon: Icon, active }) => (
          <li key={label} className="flex-1">
            <Link
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("h-6 w-6", active && "fill-primary/15")} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
