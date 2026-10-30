import { useState } from "react";
import { cn } from "@/lib/utils";

const FALLBACKS = [
  "bg-gradient-to-br from-[#ffd29d] to-[#f76c4b]",
  "bg-gradient-to-br from-[#bfe3ff] to-[#7c9cf0]",
  "bg-gradient-to-br from-[#c8f0d8] to-[#5ccf8b]",
  "bg-gradient-to-br from-[#e6dbff] to-[#a78bfa]",
];

/** Foto del sito; se il file manca resta una sfumatura con una zampetta. */
export function BrandPhoto({ src, alt, className, index = 0 }: { src: string; alt: string; className?: string; index?: number }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return (
      <div className={cn("flex items-center justify-center text-5xl text-white/80", FALLBACKS[index % FALLBACKS.length], className)} role="img" aria-label={alt}>
        🐾
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" className={cn("object-cover", className)} onError={() => setOk(false)} />;
}
