import { cn } from "@/lib/utils";

/** Cuore con zampetta: il simbolo di Resta con me. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-9 w-9", className)} aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="hsl(var(--coral))" />
      <path
        d="M32 53C14 40 12 29 12 24.500 12 18.700 16.600 14.500 22 14.500c4 0 7.300 2.200 10 6 2.700-3.800 6-6 10-6 5.400 0 10 4.200 10 10 0 4.500-2 15.500-20 28.500z"
        fill="#fff"
      />
      <g fill="hsl(var(--coral))">
        <ellipse cx="32" cy="40" rx="6.500" ry="5.200" />
        <circle cx="22.500" cy="32.500" r="2.800" />
        <circle cx="28" cy="27.500" r="2.800" />
        <circle cx="36" cy="27.500" r="2.800" />
        <circle cx="41.500" cy="32.500" r="2.800" />
      </g>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-heading text-xl font-semibold tracking-tight">Resta con me</span>
    </span>
  );
}
