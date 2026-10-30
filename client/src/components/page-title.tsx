import { useEffect } from "react";

const BASE = "Resta con me";

/** Imposta il titolo della scheda del browser. */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE}` : `${BASE} | Il social network degli animali`;
  }, [title]);
}
