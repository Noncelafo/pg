import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Smartphone, Sparkles, Heart } from "lucide-react";
import type { OrderInput, PetSummary } from "@shared/schema";
import { ATTACHMENTS, BEAD_COLORS, MAX_ENGRAVED, MAX_QUANTITY, PRICE_EURO, SYMBOLS, type AttachmentId, type BeadColorId, type SymbolId } from "@shared/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CharmArt } from "@/components/shop/charm-art";
import { usePageTitle } from "@/components/page-title";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: Smartphone, title: "Avvicini il telefono", text: "Al ciondolo, come per pagare con il cellulare. Non serve nessuna app." },
  { icon: Sparkles, title: "Si apre il suo profilo", text: "Foto, storie e coccole: la pagina dell'animale compare subito." },
  { icon: Heart, title: "Resta con te, sempre", text: "Anche quando ha attraversato il Ponte dell'Arcobaleno: il ciondolo continua a portarti da lui." },
];

const choice = (active: boolean) =>
  cn(
    "rounded-2xl border-2 px-4 py-2 text-sm font-bold transition-colors",
    active ? "border-primary bg-accent text-primary" : "border-border bg-card hover:bg-accent/60",
  );

export default function Negozio() {
  usePageTitle("Ciondoli NFC");
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();

  const { data: pets } = useQuery<PetSummary[]>({ queryKey: ["/api/pets/mine"], enabled: !!user, staleTime: 0 });

  const [petId, setPetId] = useState<number | null>(null);
  const [engraving, setEngraving] = useState<"symbol" | "name">("symbol");
  const [symbol, setSymbol] = useState<SymbolId>("zampina");
  const [text, setText] = useState("");
  const [color, setColor] = useState<BeadColorId>("corallo");
  const [attachment, setAttachment] = useState<AttachmentId>("catenina");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  // Arrivando da un profilo (?pet=ID) l'animale è già scelto
  useEffect(() => {
    if (!pets?.length || petId) return;
    const wanted = Number(new URLSearchParams(window.location.search).get("pet"));
    const found = pets.find((p) => p.id === wanted) ?? pets[0];
    setPetId(found.id);
  }, [pets, petId]);

  const pet = pets?.find((p) => p.id === petId);

  function choosePet(id: number) {
    setPetId(id);
    const chosen = pets?.find((p) => p.id === id);
    if (chosen && !text) setText(chosen.name.slice(0, MAX_ENGRAVED));
  }

  const order = useMutation({
    mutationFn: async (input: OrderInput) => (await apiRequest("POST", "/api/orders", input)).json(),
    onSuccess: () => {
      qc.invalidateQueries();
      toast({ title: "Prenotato! 🎉", description: "Ti scriviamo noi per confermare prezzo e spedizione." });
      navigate("/ordini");
    },
    onError: (e: Error) => toast({ title: "Non riesco a prenotarlo", description: e.message, variant: "destructive" }),
  });

  const shownText = engraving === "name" ? (text || pet?.name || "").slice(0, MAX_ENGRAVED) : null;
  const canOrder = !!petId && (engraving === "symbol" || !!text.trim());

  function submit() {
    if (!petId) return;
    order.mutate({
      petId,
      engraving,
      engravedText: engraving === "name" ? text.trim() : undefined,
      symbol: engraving === "symbol" ? symbol : undefined,
      color,
      attachment,
      quantity,
      note: note.trim() || undefined,
    });
  }

  return (
    <div>
      <section className="rainbow-sky relative overflow-hidden px-4 pb-14 pt-12 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-widest text-white/90">Il ciondolo NFC</p>
          <h1 className="mt-2 text-4xl drop-shadow sm:text-6xl">Resta con me, ovunque tu vada.</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/95 drop-shadow">
            Un ciondolo con il nome o il simbolo del tuo animale. Lo metti in un bracciale, in una collanina, sul collare, dove vuoi: lo sfiori col telefono e il suo profilo si apre.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text: t }) => (
          <div key={title} className="soft-card p-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary"><Icon /></span>
            <h2 className="mt-3 text-xl">{title}</h2>
            <p className="mt-1 text-muted-foreground">{t}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto grid max-w-5xl items-start gap-8 px-4 pb-16 md:grid-cols-2">
        <div className="soft-card sticky top-20 p-6">
          <CharmArt symbol={engraving === "symbol" ? symbol : null} text={shownText} color={color} attachment={attachment} className="mx-auto w-full max-w-xs" />
          <p className="mt-2 text-center text-sm text-muted-foreground">Anteprima: il ciondolo vero sarà fatto a mano.</p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl">Fallo tuo</h2>

          {!user ? (
            <div className="soft-card space-y-3 p-6">
              <p>Per prenotarlo crea il profilo del tuo amico: il ciondolo porterà proprio lì.</p>
              <div className="flex flex-wrap gap-3">
                <Button asChild><Link href="/auth?tab=register">Crea il profilo</Link></Button>
                <Button asChild variant="outline"><Link href="/auth">Ho già un account</Link></Button>
              </div>
            </div>
          ) : pets && pets.length === 0 ? (
            <div className="soft-card space-y-3 p-6">
              <p>Prima serve il profilo del tuo amico: il ciondolo porterà proprio lì.</p>
              <Button asChild><Link href="/nuovo-animale">Crea il primo profilo</Link></Button>
            </div>
          ) : null}

          {pets && pets.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="pet">Per quale amico?</Label>
              <div className="flex flex-wrap gap-2" id="pet" role="radiogroup" aria-label="Per quale amico?">
                {pets.map((p) => (
                  <button key={p.id} type="button" role="radio" aria-checked={p.id === petId} className={choice(p.id === petId)} onClick={() => choosePet(p.id)}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Cosa incidere?</Label>
            <div className="flex gap-2" role="radiogroup" aria-label="Cosa incidere">
              <button type="button" role="radio" aria-checked={engraving === "symbol"} className={choice(engraving === "symbol")} onClick={() => setEngraving("symbol")}>Un simbolo</button>
              <button type="button" role="radio" aria-checked={engraving === "name"} className={choice(engraving === "name")} onClick={() => setEngraving("name")}>Il nome</button>
            </div>
          </div>

          {engraving === "symbol" ? (
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Simbolo">
              {SYMBOLS.map((s) => (
                <button key={s.id} type="button" role="radio" aria-checked={s.id === symbol} className={choice(s.id === symbol)} onClick={() => setSymbol(s.id)}>
                  {s.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="engraved">Il nome sul ciondolo</Label>
              <Input id="engraved" value={text} maxLength={MAX_ENGRAVED} placeholder={pet?.name ?? "Come si chiama?"} onChange={(e) => setText(e.target.value)} />
              <p className="text-xs text-muted-foreground">Al massimo {MAX_ENGRAVED} lettere.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Colore</Label>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Colore">
              {BEAD_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={c.id === color}
                  aria-label={c.label}
                  title={c.label}
                  onClick={() => setColor(c.id)}
                  className={cn("h-10 w-10 rounded-full border-4 transition-transform", c.id === color ? "scale-110 border-foreground/70" : "border-white shadow")}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Come lo porti?</Label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Come lo porti">
              {ATTACHMENTS.map((a) => (
                <button key={a.id} type="button" role="radio" aria-checked={a.id === attachment} className={choice(a.id === attachment)} onClick={() => setAttachment(a.id)}>
                  {a.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Ha un anellino: lo puoi appendere a un bracciale, al collare, alle chiavi o a una catenina tua.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quanti?</Label>
            <Input id="quantity" type="number" min={1} max={MAX_QUANTITY} value={quantity} className="w-24" onChange={(e) => setQuantity(Math.min(MAX_QUANTITY, Math.max(1, Number(e.target.value) || 1)))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Vuoi dirci qualcosa? (facoltativo)</Label>
            <Textarea id="note" value={note} maxLength={300} rows={2} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div className="soft-card space-y-3 p-5">
            <p className="font-heading text-xl">
              {PRICE_EURO !== null ? `${PRICE_EURO.toFixed(2).replace(".", ",")} € l'uno` : "Prezzo di lancio in arrivo"}
            </p>
            <p className="text-sm text-muted-foreground">
              Per ora si prenota e basta: non paghi niente adesso. Ti scriviamo all'email del tuo account per confermare prezzo e spedizione.
            </p>
            <Button size="lg" className="w-full" disabled={!user || !canOrder || order.isPending} onClick={submit}>
              {order.isPending ? "Un attimo…" : "Prenota il ciondolo"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
