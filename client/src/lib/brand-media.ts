/**
 * Foto e video del sito (non quelli caricati dagli utenti).
 *
 * I file vanno in client/public/brand/video e client/public/brand/foto con
 * esattamente questi nomi. Se un file manca il sito non si rompe: al suo
 * posto compare una sfumatura colorata.
 *
 * `cerca` = parole chiave per trovarli su Pexels / Mixkit (licenza gratuita
 * anche per uso commerciale). Video: orizzontali, 10-20 secondi, senza
 * scritte né loghi; poi si comprimono (720p, ~2-4 MB) prima di caricarli.
 */
export interface MediaSlot {
  src: string;
  poster?: string;
  alt: string;
  cerca: string;
}

export const VIDEO = {
  heroCorsa: {
    src: "/brand/video/hero-corsa.mp4",
    poster: "/brand/video/hero-corsa.jpg",
    alt: "Un cane corre felice in un prato insieme alla sua umana",
    cerca: "dog running meadow golden hour owner slow motion",
  },
  insieme: {
    src: "/brand/video/insieme.mp4",
    poster: "/brand/video/insieme.jpg",
    alt: "Una famiglia gioca con il proprio cane e il proprio gatto",
    cerca: "family playing with dog park, girl hugging cat, man playing with puppy",
  },
  ponteTramonto: {
    src: "/brand/video/ponte-tramonto.mp4",
    poster: "/brand/video/ponte-tramonto.jpg",
    alt: "Una persona cammina con il suo cane in un campo al tramonto",
    cerca: "woman walking with dog sunset field silhouette, rainbow sky meadow",
  },
  ponteAbbraccio: {
    src: "/brand/video/ponte-abbraccio.mp4",
    poster: "/brand/video/ponte-abbraccio.jpg",
    alt: "Un uomo abbraccia il suo vecchio cane, sereno, sotto una luce calda",
    cerca: "man hugging old dog warm light, elderly woman with cat window light, owner and dog peaceful",
  },
} satisfies Record<string, MediaSlot>;

export const FOTO = {
  momenti: [
    { src: "/brand/foto/momento-1.jpg", alt: "Bambina che ride abbracciando un cucciolo", cerca: "child hugging puppy laughing", didascalia: "Il primo abbraccio" },
    { src: "/brand/foto/momento-2.jpg", alt: "Cane che corre sulla spiaggia", cerca: "dog running beach splash", didascalia: "La prima volta al mare" },
    { src: "/brand/foto/momento-3.jpg", alt: "Gatto addormentato sulle gambe di una persona", cerca: "cat sleeping on lap cozy", didascalia: "Il pisolino preferito" },
    { src: "/brand/foto/momento-4.jpg", alt: "Coppia anziana sulla panchina con il suo cane", cerca: "elderly couple bench with dog", didascalia: "Insieme da sempre" },
    { src: "/brand/foto/momento-5.jpg", alt: "Coniglio tenuto in braccio con dolcezza", cerca: "person holding rabbit gently", didascalia: "Piccolo grande amore" },
    { src: "/brand/foto/momento-6.jpg", alt: "Ragazzo e cane che si guardano negli occhi", cerca: "young man and dog looking at each other", didascalia: "Ci capiamo al volo" },
  ],
  profilo: { src: "/brand/foto/funzione-profilo.jpg", alt: "Ritratto di un cane felice", cerca: "happy dog portrait smiling" },
  coccole: { src: "/brand/foto/funzione-coccole.jpg", alt: "Mani che accarezzano un gatto", cerca: "hands petting cat" },
  ponte: { src: "/brand/foto/funzione-ponte.jpg", alt: "Cane in un prato fiorito sotto un cielo pastello", cerca: "dog flower meadow pastel sky" },
  accesso: { src: "/brand/foto/accesso.jpg", alt: "Una ragazza e il suo cane si sorridono", cerca: "woman smiling with her dog close up" },
} satisfies Record<string, MediaSlot | (MediaSlot & { didascalia: string })[]>;
