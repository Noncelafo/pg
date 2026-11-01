import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ATTACHMENTS, BEAD_COLORS, ORDER_STATUSES, ORDER_STATUS_LABEL, SYMBOLS, type OrderStatus, type OrderView } from "@shared/shop";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CharmArt } from "@/components/shop/charm-art";
import { usePageTitle } from "@/components/page-title";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

function OrderRow({ order, admin }: { order: OrderView; admin: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const setStatus = useMutation({
    mutationFn: async (status: OrderStatus) => { await apiRequest("PATCH", `/api/orders/${order.id}`, { status }); },
    onSuccess: () => qc.invalidateQueries(),
    onError: (e: Error) => toast({ title: "Non riesco ad aggiornarlo", description: e.message, variant: "destructive" }),
  });
  const colorLabel = BEAD_COLORS.find((c) => c.id === order.color)?.label ?? order.color;
  const attachmentLabel = ATTACHMENTS.find((a) => a.id === order.attachment)?.label ?? order.attachment;
  const symbolLabel = SYMBOLS.find((s) => s.id === order.symbol)?.label;

  return (
    <li className="soft-card flex items-center gap-4 p-4">
      <CharmArt symbol={order.symbol} text={order.engravedText} color={order.color} attachment={order.attachment} className="h-28 w-24 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-heading text-lg">
          {order.petName ?? "Profilo eliminato"} · {order.quantity} {order.quantity === 1 ? "ciondolo" : "ciondoli"}
        </p>
        <p className="text-sm text-muted-foreground">
          {order.engravedText ? `Nome: ${order.engravedText}` : `Simbolo: ${symbolLabel ?? order.symbol}`} · {colorLabel} · {attachmentLabel}
        </p>
        {order.note && <p className="mt-1 text-sm">“{order.note}”</p>}
        {admin && <p className="mt-1 text-sm font-semibold">{order.customerName} · {order.customerEmail}</p>}
        <p className="mt-1 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("it-IT")}</p>
      </div>
      {admin ? (
        <select
          aria-label="Stato"
          className="rounded-xl border bg-background px-2 py-1 text-sm"
          value={order.status}
          disabled={setStatus.isPending}
          onChange={(e) => setStatus.mutate(e.target.value as OrderStatus)}
        >
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
        </select>
      ) : (
        <span className="rounded-full bg-accent px-3 py-1 text-sm font-bold text-primary">{ORDER_STATUS_LABEL[order.status]}</span>
      )}
    </li>
  );
}

export default function Ordini() {
  usePageTitle("I miei ciondoli");
  const { user } = useAuth();
  const admin = !!user?.isAdmin;
  const url = admin ? "/api/orders?all=1" : "/api/orders";
  const { data, isLoading } = useQuery<OrderView[]>({ queryKey: [url], staleTime: 0 });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl">{admin ? "Tutte le prenotazioni" : "I miei ciondoli"}</h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        {admin ? "Cambia lo stato man mano che li confermi e li prepari." : "Qui vedi a che punto sono le tue prenotazioni."}
      </p>
      {isLoading ? (
        <Skeleton className="h-28 rounded-3xl" />
      ) : data && data.length > 0 ? (
        <ul className="space-y-3">{data.map((o) => <OrderRow key={o.id} order={o} admin={admin} />)}</ul>
      ) : (
        <div className="soft-card space-y-3 p-8 text-center">
          <p className="text-muted-foreground">Nessuna prenotazione, per ora.</p>
          <Button asChild><Link href="/negozio">Scopri il ciondolo</Link></Button>
        </div>
      )}
    </div>
  );
}
