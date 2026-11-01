import { useId } from "react";
import { BEAD_COLORS, type BeadColorId } from "@shared/shop";
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

const SMALL_BEADS = ["#fff4e0", "#ffd47a", "#ffffff", "#ffe3cf"];

/**
 * Il braccialetto con la perlina grande, disegnato in SVG su fondo trasparente
 * (così si può mettere sopra a un video o a una foto). Sulla perlina c'è il
 * nome dell'animale oppure un simbolo. È un'illustrazione: quando ci sarà la
 * foto del prototipo vero si può sostituire con un PNG scontornato.
 */
export function BraceletArt({
  symbol,
  text,
  color = "corallo",
  className,
  title = "Braccialetto Resta con me con perlina NFC",
}: {
  symbol?: string | null;
  text?: string | null;
  color?: BeadColorId | string;
  className?: string;
  title?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const tone = BEAD_COLORS.find((c) => c.id === color) ?? BEAD_COLORS[0];
  const label = text?.trim();

  const cx = 200, cy = 160, rx = 152, ry = 92;
  const beads: { x: number; y: number; fill: string }[] = [];
  for (let i = 0, a = 128; a <= 412; a += 22, i++) {
    const rad = (a * Math.PI) / 180;
    beads.push({
      x: cx + rx * Math.cos(rad),
      y: cy + ry * Math.sin(rad),
      fill: i % 5 === 2 ? tone.hex : SMALL_BEADS[i % SMALL_BEADS.length],
    });
  }
  const fontSize = label ? Math.max(11, Math.min(27, 96 / (label.length * 0.62))) : 0;

  return (
    <svg viewBox="0 0 400 330" role="img" aria-label={title} className={cn("overflow-visible", className)}>
      <title>{title}</title>
      <defs>
        <radialGradient id={`bead${uid}`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="28%" stopColor={tone.hex} />
          <stop offset="100%" stopColor={tone.dark} />
        </radialGradient>
        <radialGradient id={`small${uid}`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
        </radialGradient>
        <filter id={`shadow${uid}`} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="7" stdDeviation="6" floodColor="#000" floodOpacity="0.3" />
        </filter>
      </defs>

      <g filter={`url(#shadow${uid})`}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#c9a26b" strokeWidth="8" />
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#e8cfa2" strokeWidth="2" strokeDasharray="3 7" />
        {beads.map((b, i) => (
          <g key={i}>
            <circle cx={b.x} cy={b.y} r="16" fill={b.fill} />
            <circle cx={b.x} cy={b.y} r="16" fill={`url(#small${uid})`} />
          </g>
        ))}
      </g>

      {/* La perlina grande, con il chip NFC dentro */}
      <g filter={`url(#shadow${uid})`}>
        <circle cx="200" cy="260" r="62" fill={`url(#bead${uid})`} />
        <ellipse cx="176" cy="228" rx="22" ry="11" fill="#fff" opacity="0.4" transform="rotate(-28 176 228)" />
      </g>
      {label ? (
        <text
          x="200"
          y={260 + fontSize * 0.34}
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
        <g transform="translate(200 260) scale(1.15)" fill="#fff">
          <g transform="translate(0.8 1.2)" fill={tone.dark} opacity="0.45"><Symbol id={symbol ?? "zampina"} hole={tone.dark} /></g>
          <Symbol id={symbol ?? "zampina"} hole={tone.hex} />
        </g>
      )}
    </svg>
  );
}
