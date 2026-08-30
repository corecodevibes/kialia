import { COMMON_CURRENCIES } from "@/lib/currency";

/**
 * Die Waehrung, in der jemand rechnet — nicht die, in der er zahlt.
 *
 * Auf Kreta zahlt Steffen in Euro und traegt Euro ein. Wissen will er am Ende
 * aber, was ihn die Reise in Franken gekostet hat. Das sind zwei
 * verschiedene Dinge, und bisher kannte die App nur eines davon: eine Waehrung
 * pro Reise.
 *
 * Die Rechenwaehrung gehoert zur PERSON, nicht zur Reise — sie aendert sich
 * nicht, wenn man verreist. Deshalb hier und nicht im Reisedokument. Sie liegt
 * lokal, weil sie niemanden ausser dem Geraet etwas angeht.
 */
const KEY = "kialia.homeCurrency";
const GUELTIG = new Set(COMMON_CURRENCIES.map((c) => c.code));

/** Ohne Angabe der Euro — die Mehrheit der Ziele dieser App rechnet so. */
export const FALLBACK = "EUR";

/**
 * Nur bekannte Kuerzel durchlassen.
 *
 * Steht spaeter eine Waehrung im Speicher, die es nicht gibt, laesst sie sich
 * nicht umrechnen — und die Anzeige zeigt Betraege in einer Einheit, die
 * niemand kennt. Lieber der Rueckfall.
 */
export function normalizeCurrency(code: string | null | undefined): string {
  const c = (code ?? "").toUpperCase().trim();
  return GUELTIG.has(c) ? c : FALLBACK;
}

export function loadHomeCurrency(): string {
  if (typeof window === "undefined") return FALLBACK;
  try {
    const v = window.localStorage.getItem(KEY);
    return normalizeCurrency(v);
  } catch {
    return FALLBACK;
  }
}

export function saveHomeCurrency(code: string): void {
  if (typeof window === "undefined") return;
  if (normalizeCurrency(code) !== code.toUpperCase().trim()) return;
  try {
    window.localStorage.setItem(KEY, code);
  } catch {
    /* Voller Speicher darf nicht abstuerzen lassen. */
  }
}
