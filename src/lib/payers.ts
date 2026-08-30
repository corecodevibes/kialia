import { parseExpenses, type ParsedExpense } from "@/lib/expenses";

/**
 * Wer hat welchen Posten bezahlt.
 *
 * Die Aufstellung entsteht aus dem Freitext und wird bei jedem Tippen neu
 * berechnet — sie hat also keine dauerhafte Identitaet, an die man "bezahlt
 * von Annalina" haengen koennte. Der Zahler wird deshalb getrennt gemerkt und
 * beim Neu-Berechnen wieder zugeordnet.
 *
 * Zugeordnet wird ueber Bezeichnung + Betrag, nicht ueber die Position. Wer
 * vorne einen Posten einfuegt, verschiebt sonst alle Zahler um eins — der
 * haeufigste Fall beim Nachtragen und der aergerlichste Fehler.
 *
 * Gleiche Posten (zweimal "Kaffee 4") bekommen der Reihe nach die gemerkten
 * Zahler; das ist die einzig sinnvolle Annahme ohne echte Identitaet.
 */
export type PayerMap = Record<string, string>;

/** Der Schluessel, unter dem ein Zahler gemerkt wird. */
export function payerKey(item: ParsedExpense, laufnummer: number): string {
  return `${item.label.toLowerCase().trim()}|${item.amount}|${laufnummer}`;
}

/** Posten samt Zahler, in der Reihenfolge des Textes. */
export function itemsWithPayers(
  text: string,
  payers: PayerMap | undefined,
): { item: ParsedExpense; key: string; paidBy: string }[] {
  const zaehler = new Map<string, number>();
  return parseExpenses(text).map((item) => {
    const basis = `${item.label.toLowerCase().trim()}|${item.amount}`;
    const n = zaehler.get(basis) ?? 0;
    zaehler.set(basis, n + 1);
    const key = payerKey(item, n);
    return { item, key, paidBy: payers?.[key] ?? "" };
  });
}

/**
 * Wer hat an diesem Tag wie viel ausgelegt.
 *
 * Bewusst OHNE Ausgleichsrechnung: das ist eine Uebersicht, keine Abrechnung.
 * Wer sich das Geld zurueckholen will, sieht die Zahlen und regelt es selbst.
 */
export function paidTotals(
  entries: { item: ParsedExpense; paidBy: string }[],
): { name: string; amount: number }[] {
  const summe = new Map<string, number>();
  for (const { item, paidBy } of entries) {
    const wer = paidBy.trim();
    if (!wer) continue;
    summe.set(wer, (summe.get(wer) ?? 0) + item.amount);
  }
  return [...summe.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/** Zahler zu Posten, die es nicht mehr gibt, wegwerfen. */
export function prunePayers(text: string, payers: PayerMap | undefined): PayerMap {
  if (!payers) return {};
  const gueltig = new Set(itemsWithPayers(text, payers).map((e) => e.key));
  const out: PayerMap = {};
  for (const [k, v] of Object.entries(payers)) if (gueltig.has(k) && v) out[k] = v;
  return out;
}
