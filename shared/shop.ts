/**
 * Il ciondolo NFC di Resta con me: un disco con un chip dentro, da appendere
 * a un bracciale, a una collanina, al collare o dove si vuole. Avvicini il
 * telefono e si apre il profilo dell'animale (indirizzo breve /p/:id, vedi
 * server/routes.ts). Qui c'è tutto ciò che si può scegliere.
 */

export const SYMBOLS = [
  { id: "zampina", label: "Zampina" },
  { id: "cagnolino", label: "Cagnolino" },
  { id: "gattino", label: "Gattino" },
  { id: "coniglietto", label: "Coniglietto" },
  { id: "cuore", label: "Cuore" },
] as const;
export type SymbolId = (typeof SYMBOLS)[number]["id"];

export const BEAD_COLORS = [
  { id: "corallo", label: "Corallo", hex: "#f76c4b", dark: "#c9482b" },
  { id: "sole", label: "Sole", hex: "#ffc247", dark: "#d99412" },
  { id: "cielo", label: "Cielo", hex: "#6fb7ee", dark: "#3f8ac4" },
  { id: "menta", label: "Menta", hex: "#7fd6b4", dark: "#47a583" },
  { id: "lilla", label: "Lilla", hex: "#b99be8", dark: "#8a68c4" },
] as const;
export type BeadColorId = (typeof BEAD_COLORS)[number]["id"];

// Con cosa si appende: catenina e cordino si vendono insieme al ciondolo
export const ATTACHMENTS = [
  { id: "catenina", label: "Con catenina" },
  { id: "cordino", label: "Con cordino" },
  { id: "solo", label: "Solo ciondolo" },
] as const;
export type AttachmentId = (typeof ATTACHMENTS)[number]["id"];

export const MAX_ENGRAVED = 12;
export const MAX_QUANTITY = 5;

/**
 * Prezzo in euro. `null` = ancora da decidere: finché è null la pagina dice
 * che il prezzo si conferma prima di pagare. Quando Sara lo decide basta
 * scriverlo qui (per esempio 24).
 */
export const PRICE_EURO: number | null = null;

export const ORDER_STATUSES = ["new", "confirmed", "making", "shipped", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Prenotato",
  confirmed: "Confermato",
  making: "In preparazione",
  shipped: "Spedito",
  cancelled: "Annullato",
};

export interface OrderView {
  id: number;
  petId: number | null;
  petName: string | null;
  symbol: string | null;
  engravedText: string | null;
  color: string;
  attachment: string;
  quantity: number;
  note: string | null;
  status: OrderStatus;
  createdAt: string;
  // Solo per chi gestisce gli ordini
  customerName?: string;
  customerEmail?: string;
}
