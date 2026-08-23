/**
 * Währungen einer Reise.
 *
 * GRUNDSATZ: Beträge werden nie umgerechnet gespeichert. Was in Euro
 * eingegeben wurde, bleibt Euro — für immer. Umgerechnet wird nur zur Anzeige,
 * und dann sichtbar als Schätzung, mit Kurs und Datum daneben.
 *
 * Der Grund: Kurse ändern sich. Eine gespeicherte Umrechnung wäre in vier
 * Wochen falsch, ohne dass es jemand merkt — und niemand könnte den
 * Originalbetrag rekonstruieren. Die Buchung, die du getätigt hast, war in
 * einer bestimmten Währung; das ist die Tatsache, alles andere ist abgeleitet.
 *
 * ZWEI WÄHRUNGEN, nicht beliebig viele: eine Reise hat praktisch immer genau
 * die Heimatwährung und die des Ziels. Mehr Auswahl kostet bei jeder Eingabe
 * Zeit und bringt fast nie etwas.
 */

export type CurrencyCode = string;

export const COMMON_CURRENCIES: { code: string; label: string }[] = [
  { code: "CHF", label: "Schweizer Franken" },
  { code: "EUR", label: "Euro" },
  { code: "USD", label: "US-Dollar" },
  { code: "GBP", label: "Britisches Pfund" },
  { code: "SEK", label: "Schwedische Krone" },
  { code: "NOK", label: "Norwegische Krone" },
  { code: "DKK", label: "Dänische Krone" },
  { code: "PLN", label: "Polnischer Złoty" },
  { code: "CZK", label: "Tschechische Krone" },
  { code: "TRY", label: "Türkische Lira" },
  { code: "THB", label: "Thai-Baht" },
  { code: "JPY", label: "Japanischer Yen" },
  { code: "AUD", label: "Australischer Dollar" },
  { code: "NZD", label: "Neuseeland-Dollar" },
  { code: "CAD", label: "Kanadischer Dollar" },
];

/** Formatiert einen Betrag in seiner eigenen Währung. */
export function money(amount: number, currency: CurrencyCode = "EUR"): string {
  const n = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    // Unbekannter Code: lieber die Zahl mit dem Kürzel als gar nichts.
    return `${Math.round(n).toLocaleString("de-DE")} ${currency}`;
  }
}

export type Rate = {
  /** Wie viel Hauptwährung ein Stück Zweitwährung kostet. */
  value: number;
  /** Wann der Kurs gesetzt oder geholt wurde. */
  at: string;
  /** "manual" = vom Nutzer eingetragen, "ecb" = abgerufen. */
  source: "manual" | "ecb";
};

/**
 * Rechnet um — und gibt `null` zurück, wenn kein Kurs vorliegt.
 *
 * Bewusst kein Rückfall auf 1:1: eine erfundene Umrechnung ist schlimmer als
 * eine fehlende. Ohne Kurs zeigt die Oberfläche die Summen einzeln.
 */
export function convert(amount: number, rate: Rate | undefined | null): number | null {
  if (!rate || !Number.isFinite(rate.value) || rate.value <= 0) return null;
  return amount * rate.value;
}

/**
 * Holt den Tageskurs bei der EZB (über frankfurter.app — frei, ohne Schlüssel).
 *
 * Schlägt der Abruf fehl, gibt es `null` und der zuletzt bekannte Kurs gilt
 * weiter. Ein Kurs, der aufs Netz wartet, wäre in einer Reise-App nutzlos.
 */
export async function fetchRate(from: string, to: string): Promise<Rate | null> {
  if (from === to) return { value: 1, at: new Date().toISOString(), source: "ecb" };
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { rates?: Record<string, number>; date?: string };
    const value = json.rates?.[to];
    if (!value || !Number.isFinite(value)) return null;
    return { value, at: json.date ?? new Date().toISOString().slice(0, 10), source: "ecb" };
  } catch {
    return null;
  }
}
