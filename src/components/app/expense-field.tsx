import { CATEGORY_COLORS, CATEGORY_LABELS, expensesTotal, parseExpenses } from "@/lib/expenses";
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
}: {
  entry: DiaryEntry;
  onChange: (patch: Partial<DiaryEntry>) => void;
  currency: string;
}) {
  const items = parseExpenses(entry.expenses);
  const total = expensesTotal(items);

  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground">
        Ausgaben — einfach hintereinander, mit Komma getrennt
      </span>
      <textarea
        value={entry.expenses}
        onChange={(ev) => {
          const text = ev.target.value;
          onChange({ expenses: text, spent: expensesTotal(parseExpenses(text)) });
        }}
        rows={2}
        placeholder="Taverne 45, Taxi 8, Souvenirs 15"
        className={`mt-1 block w-full min-w-0 resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground transition focus:border-primary`}
      />

      {items.length > 0 && (
        <div className="mt-2 space-y-1">
          {items.map((it, i) => (
            <div
              key={`${it.label}-${i}`}
              className="flex items-center gap-2 rounded-xl bg-secondary/40 px-2.5 py-1.5"
            >
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-[#2F2A3E]"
                style={{ background: CATEGORY_COLORS[it.category] }}
              >
                {CATEGORY_LABELS[it.category]}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{it.label}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {money(it.amount, currency)}
              </span>
            </div>
          ))}

          <div className="flex items-center justify-between px-2.5 pt-1.5">
            <span className="text-sm font-semibold">Summe heute</span>
            <span className="text-base font-bold tabular-nums">{money(total, currency)}</span>
          </div>
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
