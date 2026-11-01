import { useId } from "react";
import { BEAD_COLORS, type AttachmentId, type BeadColorId } from "@shared/shop";
import { cn } from "@/lib/utils";

/** Il simbolo inciso, disegnato attorno al centro (0,0), alto circa 44. */
function Symbol({ id, hole }: { id: string; hole: string }) {
  switch (id) {
    case "cagnolino":
      return (
        <g>
          <ellipse cx="-17" cy="2" rx="6.5" ry="14" transform="rotate(14 -17 2)" />
          <ellipse cx="17" cy="2" rx="6.5" ry="14" transform="rotate(-14 17 2)" />
          <ellipse cx="0" cy="3" rx="14" ry="17" />
          <circle cx="-5.5" cy="0" r="2.2" fill={hole} />
          <circle cx="5.5" cy="0" r="2.2" fill={hole} />
          <ellipse cx="0" cy="9" rx="4" ry="3" fill={hole} />
        </g>
      );
    case "gattino":
      return (
        <g>
          <polygon points="-17,-1 -16,-23 -1,-12" />
          <polygon points="17,-1 16,-23 1,-12" />
          <circle cx="0" cy="5" r="17" />
          <circle cx="-6" cy="3" r="2.2" fill={hole} />
          <circle cx="6" cy="3" r="2.2" fill={hole} />
          <path d="M-3 9 L3 9 L0 12.5 Z" fill={hole} />
        </g>
      );
    case "coniglietto":
      return (
        <g>
          <ellipse cx="-7" cy="-11" rx="5.5" ry="15" transform="rotate(-6 -7 -11)" />
          <ellipse cx="7" cy="-11" rx="5.5" ry="15" transform="rotate(6 7 -11)" />
          <circle cx="0" cy="10" r="14" />
          <circle cx="-5" cy="8" r="2" fill={hole} />
          <circle cx="5" cy="8" r="2" fill={hole} />
          <ellipse cx="0" cy="14" rx="3" ry="2.2" fill={hole} />
        </g>
      );
    case "cuore":
      return <path d="M0 21 C-30 -1 -18 -23 0 -8 C18 -23 30 -1 0 21 Z" />;
    case "zampina":
    default:
      return (
        <g>
          <ellipse cx="0" cy="9" rx="13.5" ry="11" />
          <ellipse cx="-16" cy="-4" rx="5.5" ry="7" transform="rotate(-25 -16 -4)" />
          <ellipse cx="-6" cy="-14" rx="5.5" ry="7.5" transform="rotate(-8 -6 -14)" />
          <ellipse cx="6" cy="-14" rx="5.5" ry="7.5" transform="rotate(8 6 -14)" />
          <ellipse cx="16" cy="-4" rx="5.5" ry="7" transform="rotate(25 16 -4)" />
        </g>
      );
  }
}

/**
 * Il ciondolo con il chip NFC, disegnato in SVG su fondo trasparente (così si
 * può mettere sopra a un video o a una foto). Sul disco c'è il nome
 * dell'animale oppure un simbolo; sopra, l'anellino con catenina o cordino
 * (oppure niente, se il cliente ha già il suo). È un'illustrazione: quando ci
 * sarà la foto del prototipo vero si può sostituire con un PNG scontornato.
 */
export function CharmArt({
  symbol,
  text,
  color = "corallo",
  attachment = "catenina",
  className,
  title = "Ciondolo Resta con me con chip NFC",
}: {
  symbol?: string | null;
  text?: string | null;
  color?: BeadColorId | string;
  attachment?: AttachmentId | string;
  className?: string;
  title?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const tone = BEAD_COLORS.find((c) => c.id === color) ?? BEAD_COLORS[0];
  const label = text?.trim();
  const fontSize = label ? Math.max(13, Math.min(34, 150 / (label.length * 0.62))) : 0;
  const V = "M30 -20 Q 120 30 200 88 Q 280 30 370 -20";

  return (
    <svg viewBox="0 0 400 350" role="img" aria-label={title} className={cn("overflow-visible", className)}>
      <title>{title}</title>
      <defs>
        <radialGradient id={`disc${uid}`} cx="35%" cy="28%" r="85%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="26%" stopColor={tone.hex} />
          <stop offset="100%" stopColor={tone.dark} />
        </radialGradient>
        <linearGradient id={`rim${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#b9bcc6" />
        </linearGradient>
        <filter id={`shadow${uid}`} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#000" floodOpacity="0.32" />
        </filter>
      </defs>

      {/* Catenina o cordino */}
      {attachment === "catenina" && (
        <g filter={`url(#shadow${uid})`}>
          <path d={V} fill="none" stroke="#9aa0ad" strokeWidth="7" strokeLinecap="round" strokeDasharray="10 5" />
          <path d={V} fill="none" stroke="#e7e9ee" strokeWidth="3" strokeLinecap="round" strokeDasharray="10 5" />
        </g>
      )}
      {attachment === "cordino" && (
        <g filter={`url(#shadow${uid})`}>
          <path d={V} fill="none" stroke="#b98d55" strokeWidth="7" strokeLinecap="round" />
          <path d={V} fill="none" stroke="#e8cfa2" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 8" />
        </g>
      )}

      {/* Anellino */}
      <circle cx="200" cy="98" r="15" fill="none" stroke="#9aa0ad" strokeWidth="7" />
      <circle cx="200" cy="98" r="15" fill="none" stroke="#e7e9ee" strokeWidth="2.5" />

      {/* Il disco, con il chip NFC dentro */}
      <g filter={`url(#shadow${uid})`}>
        <circle cx="200" cy="228" r="104" fill={`url(#rim${uid})`} />
        <circle cx="200" cy="228" r="94" fill={`url(#disc${uid})`} />
        <circle cx="200" cy="228" r="78" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="2" strokeDasharray="3 7" />
        <ellipse cx="160" cy="176" rx="34" ry="16" fill="#fff" opacity="0.38" transform="rotate(-30 160 176)" />
      </g>
      {label ? (
        <text
          x="200"
          y={228 + fontSize * 0.34}
          textAnchor="middle"
          fontFamily="Fredoka, Nunito, sans-serif"
          fontWeight="600"
          fontSize={fontSize}
          fill="#fff"
          stroke={tone.dark}
          strokeWidth="0.6"
          style={{ paintOrder: "stroke" }}
        >
          {label}
        </text>
      ) : (
        <g transform="translate(200 228) scale(1.9)" fill="#fff">
          <g transform="translate(0.8 1.2)" fill={tone.dark} opacity="0.45"><Symbol id={symbol ?? "zampina"} hole={tone.dark} /></g>
          <Symbol id={symbol ?? "zampina"} hole={tone.hex} />
        </g>
      )}
    </svg>
  );
}
