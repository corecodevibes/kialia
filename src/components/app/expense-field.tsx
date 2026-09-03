import { CATEGORY_COLORS, CATEGORY_LABELS, expensesTotal, parseExpenses } from "@/lib/expenses";
import { itemsWithPayers, paidTotals, prunePayers } from "@/lib/payers";
import { money } from "@/lib/currency";
import type { DiaryEntry } from "@/lib/trip-store";

/**
 * Ausgaben eines Reisetags.
 *
 * Ein Feld statt eines Formulars: man tippt den Tag als Satz, die Aufstellung
 * entsteht beim Tippen. Sie ist bewusst sichtbar — der Nutzer soll sehen, was
 * verstanden wurde, statt einer Zahl vertrauen zu müssen, die irgendwo
 * herkommt.
 *
 * Die Summe wird BERECHNET, nicht getippt. Ein eigenes Summenfeld daneben
 * hätte zwei Wahrheiten erzeugt, die auseinanderlaufen.
 */
export function ExpenseField({
  entry,
  onChange,
  currency,
  people,
}: {
  entry: DiaryEntry;
  onChange: (patch: Partial<DiaryEntry>) => void;
  currency: string;
  /** Wer auf dieser Reise dabei ist — zur Auswahl beim Zahler. */
  people: string[];
}) {
  const rows = itemsWithPayers(entry.expenses, entry.paidBy);
  const items = rows.map((r) => r.item);
  const total = expensesTotal(items);
  const ausgelegt = paidTotals(rows);

  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground">
        Ausgaben — einfach hintereinander, mit Komma getrennt
      </span>
      <textarea
        value={entry.expenses}
        onChange={(ev) => {
          const text = ev.target.value;
          // Zahler zu geloeschten Posten mitnehmen — sonst waechst die
          // Zuordnung mit jeder Korrektur weiter an.
          onChange({
            expenses: text,
            spent: expensesTotal(parseExpenses(text)),
            paidBy: prunePayers(text, entry.paidBy),
          });
        }}
        rows={2}
        placeholder="Taverne 45, Taxi 8, Souvenirs 15"
        className={`mt-1 block w-full min-w-0 resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground transition focus:border-primary`}
      />

      {items.length > 0 && (
        <div className="mt-2 space-y-1">
          {rows.map(({ item: it, key, paidBy }) => (
            <div key={key} className="rounded-xl bg-secondary/40 px-2.5 py-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-foreground"
                  style={{ background: CATEGORY_COLORS[it.category] }}
                >
                  {CATEGORY_LABELS[it.category]}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{it.label}</span>
                <span className="amount shrink-0 text-[0.95rem]">{money(it.amount, currency)}</span>
              </div>
              {/* Wer ausgelegt hat. Nur sichtbar, wenn ihr mehr als eine
                  Person seid — allein reist man ohne Aufteilung. */}
              {people.length > 1 && (
                <select
                  value={paidBy}
                  aria-label={`Wer hat ${it.label} bezahlt?`}
                  onChange={(ev) =>
                    onChange({
                      paidBy: { ...(entry.paidBy ?? {}), [key]: ev.target.value },
                    })
                  }
                  className="mt-1 w-full appearance-none rounded-lg bg-transparent py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  <option value="">bezahlt von …</option>
                  {people.map((n) => (
                    <option key={n} value={n}>
                      bezahlt von {n}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between px-2.5 pt-1.5">
            <span className="text-sm font-semibold">Summe heute</span>
            <span className="amount text-[1.1rem]">{money(total, currency)}</span>
          </div>

          {/* Wer wie viel vorgestreckt hat. Bewusst OHNE Ausgleichsrechnung:
              das ist eine Uebersicht, keine Abrechnung — ihr seht die Zahlen
              und regelt es unter euch. */}
          {ausgelegt.length > 0 && (
            <div className="mt-1 space-y-0.5 border-t border-border px-2.5 pt-1.5">
              {ausgelegt.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{p.name} hat ausgelegt</span>
                  <span className="font-semibold tabular-nums">{money(p.amount, currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {entry.expenses.trim() && items.length === 0 && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Noch kein Betrag erkannt — schreib die Zahl hinter den Namen, etwa „Taverne 45".
        </p>
      )}
    </div>
  );
}
