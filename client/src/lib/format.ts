import { formatDistanceToNow, differenceInMonths, differenceInYears, parseISO, format } from "date-fns";
import { it } from "date-fns/locale";

export function timeAgo(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: it });
}

export function longDate(date: string): string {
  return format(parseISO(date), "d MMMM yyyy", { locale: it });
}

function span(from: Date, to: Date): string | null {
  if (to < from) return null;
  const years = differenceInYears(to, from);
  if (years >= 1) return years === 1 ? "1 anno" : `${years} anni`;
  const months = differenceInMonths(to, from);
  if (months >= 1) return months === 1 ? "1 mese" : `${months} mesi`;
  return "pochi giorni";
}

/** Età di un animale ancora con noi ("3 anni"). */
export function ageLabel(birthDate: string | null): string | null {
  if (!birthDate) return null;
  return span(parseISO(birthDate), new Date());
}

/** Quanto è durata la sua storia, per chi è sul Ponte ("12 anni"). */
export function lifeSpanLabel(birthDate: string | null, rainbowAt: string | null): string | null {
  if (!birthDate || !rainbowAt) return null;
  return span(parseISO(birthDate), parseISO(rainbowAt));
}
