import { useState } from "react";
import { Check, X } from "lucide-react";
import type { ScannedFields } from "@/lib/scan";
import { formatDateLong } from "@/lib/trip-store";
import { money } from "@/lib/currency";

/**
 * Was der Beleg hergab — zur Bestätigung, Feld für Feld.
 *
 * Nichts wird automatisch übernommen. Jede Zeile ist einzeln abwählbar, und
 * was nicht erkannt wurde, erscheint gar nicht erst — eine leere Zeile
 * "Abflug: —" suggeriert, es sei nachgesehen worden.
 *
 * Der Grund für die Bestätigung ist nicht Misstrauen gegen die Technik,
 * sondern die Folge eines Fehlers: eine falsche Abflugzeit merkt man am
 * Flughafen.
 */
export type ScanFieldKey = keyof ScannedFields;

export function ScanSheet({
  fields,
  currency,
  onApply,
  onDismiss,
}: {
  fields: ScannedFields;
  currency: string;
  onApply: (accepted: Partial<ScannedFields>) => void;
  onDismiss: () => void;
}) {
  const rows: { key: ScanFieldKey; label: string; shown: string }[] = [];
  const add = (key: ScanFieldKey, label: string, shown: string | null) => {
    if (shown) rows.push({ key, label, shown });
  };

  add("title", "Name", fields.title);
  add("address", "Adresse", fields.address);
  add("startDate", "Beginn", fields.startDate ? formatDateLong(fields.startDate) : null);
  add("startTime", "Uhrzeit", fields.startTime);
  add("endDate", "Ende", fields.endDate ? formatDateLong(fields.endDate) : null);
  add(
    "amount",
    "Betrag",
    fields.amount !== null ? money(fields.amount, fields.currency || currency) : null,
  );
  add("bookingRef", "Buchungsnummer", fields.bookingRef);

  const [off, setOff] = useState<Set<ScanFieldKey>>(new Set());
  const toggle = (k: ScanFieldKey) =>
    setOff((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  if (!rows.length) {
    return (
      <div className="mt-2 rounded-2xl bg-secondary/60 p-3">
        <p className="text-sm font-medium">Nichts Verwertbares gefunden</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Der Beleg bleibt angehängt. Bei einem Foto hilft oft, den Text gerade und gut
          ausgeleuchtet aufzunehmen.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 w-full rounded-xl bg-card px-3 py-2 text-xs font-semibold"
        >
          Schließen
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-2xl bg-secondary/60 p-3">
      <p className="text-sm font-semibold">Das steht auf dem Beleg</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Prüf es kurz — übernommen wird nur, was angehakt ist.
      </p>

      <ul className="mt-2 space-y-1">
        {rows.map((r) => {
          const on = !off.has(r.key);
          return (
            <li key={r.key}>
              <button
                type="button"
                onClick={() => toggle(r.key)}
                aria-pressed={on}
                className="flex w-full items-center gap-2 rounded-xl bg-card px-2.5 py-2 text-left"
              >
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-md border ${
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {on && <Check className="size-3" />}
                </span>
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{r.label}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.shown}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            const accepted: Partial<ScannedFields> = {};
            for (const r of rows) {
              if (!off.has(r.key)) {
                (accepted as Record<string, unknown>)[r.key] = fields[r.key];
              }
            }
            if (!off.has("amount") && fields.currency) accepted.currency = fields.currency;
            onApply(accepted);
          }}
          className="acrylic-warm flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold text-background"
        >
          Übernehmen
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Verwerfen"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-card"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
