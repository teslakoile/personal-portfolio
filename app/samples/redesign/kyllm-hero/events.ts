/** Opens the KYLLM sheet from anywhere on the page, optionally asking `q`. */
export const KYLLM_OPEN = "kyllm:open";
export const openKyllm = (q?: string) => window.dispatchEvent(new CustomEvent(KYLLM_OPEN, { detail: { q } }));
