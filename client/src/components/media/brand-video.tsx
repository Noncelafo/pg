import { useEffect, useRef, useState } from "react";
import type { MediaSlot } from "@/lib/brand-media";
import { cn } from "@/lib/utils";

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Video di sfondo muto e in loop. Parte solo quando è visibile (risparmia
 * batteria e dati), e chi ha chiesto meno animazioni vede solo l'immagine ferma.
 * Se mancano video e immagine resta la sfumatura passata in `fallbackClass`.
 */
export function BrandVideo({
  media,
  className,
  fallbackClass = "bg-gradient-to-br from-[#f76c4b] via-[#c86bb0] to-[#5b7bd6]",
}: {
  media: MediaSlot;
  className?: string;
  fallbackClass?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [videoOk, setVideoOk] = useState(true);
  const [posterOk, setPosterOk] = useState(!!media.poster);
  const [motion] = useState(() => !reducedMotion());

  useEffect(() => {
    const video = ref.current;
    if (!video || !motion) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.15 });
    observer.observe(video);
    return () => observer.disconnect();
  }, [motion, videoOk]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", fallbackClass, className)} aria-hidden="true">
      {posterOk && media.poster && (
        <img src={media.poster} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setPosterOk(false)} />
      )}
      {motion && videoOk && (
        <video
          ref={ref}
          className="absolute inset-0 h-full w-full object-cover"
          src={media.src}
          poster={posterOk ? media.poster : undefined}
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setVideoOk(false)}
          data-testid="brand-video"
        />
      )}
    </div>
  );
}
