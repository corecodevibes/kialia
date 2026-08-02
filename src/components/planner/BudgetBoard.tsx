import { Plane, Bus, Train, Car, Bike, Ship } from "lucide-react";
import { eur, totalBudget, type Trip } from "@/lib/trip-store";

const modes = [
  { key: "Flugzeug", icon: Plane },
  { key: "Bahn", icon: Train },
  { key: "Bus", icon: Bus },
  { key: "Auto", icon: Car },
  { key: "Velo", icon: Bike },
  { key: "Schiff", icon: Ship },
];

const fields: { key: keyof Trip["budget"]; label: string; hint: string }[] = [
  { key: "transport", label: "Fortbewegung gesamt", hint: "Flüge, Tickets, Mietwagen" },
  { key: "accommodation", label: "Unterkunft gesamt", hint: "Hotels, Airbnb, Camping" },
  { key: "foodPerDay", label: "Essen pro Tag", hint: "pro Reisegruppe und Tag" },
  { key: "activities", label: "Aktivitäten & Ausflüge", hint: "Touren, Eintritte" },
  { key: "extras", label: "Puffer & Sonstiges", hint: "Souvenirs, Versicherung" },
];

export function BudgetBoard({ trip, update }: { trip: Trip; update: (p: Partial<Trip>) => void }) {
  const b = trip.budget;
  const total = totalBudget(b, trip.days);
  const open = Math.max(0, total - b.saved);
  const perMonth = b.monthsLeft > 0 ? open / b.monthsLeft : open;
  const perPerson = trip.travellers > 0 ? total / trip.travellers : total;
  const progress = total > 0 ? Math.min(100, (b.saved / total) * 100) : 0;

  const setB = (patch: Partial<Trip["budget"]>) => update({ budget: { ...b, ...patch } });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <section className="rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
        <p className="text-sm font-medium text-muted-foreground">Womit seid ihr unterwegs?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {modes.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setB({ transportMode: key })}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                b.transportMode === key
                  ? "border-primary bg-primary/10 font-medium"
                  : "border-border hover:border-primary"
              }`}
            >
              <Icon className="size-4" /> {key}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-sm font-medium">{f.label}</label>
              <input
                type="number"
                min={0}
                value={b[f.key] as number}
                onChange={(e) => setB({ [f.key]: Number(e.target.value) } as Partial<Trip["budget"]>)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">{f.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="rounded-3xl p-6 text-background"
        style={{ background: "var(--gradient-sky)", boxShadow: "var(--shadow-soft)" }}
      >
        <div className="rounded-2xl bg-background/85 p-5 text-foreground">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Gesamtbudget</p>
          <p className="mt-1 text-4xl font-semibold">{eur(total)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {eur(perPerson)} pro Person · {trip.days} Tage
          </p>

          <div className="mt-5 grid gap-3">
            <div>
              <label className="text-sm font-medium">Schon gespart</label>
              <input
                type="number"
                min={0}
                value={b.saved}
                onChange={(e) => setB({ saved: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-2.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Monate bis zur Reise</label>
              <input
                type="number"
                min={1}
                value={b.monthsLeft}
                onChange={(e) => setB({ monthsLeft: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-2.5"
              />
            </div>
          </div>

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: "var(--gradient-warm)" }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {Math.round(progress)} % gespart · noch offen: {eur(open)}
          </p>

          <div className="mt-5 rounded-2xl bg-accent/25 p-4">
            <p className="text-sm font-medium">Spar-Empfehlung</p>
            <p className="mt-1 text-2xl font-semibold">{eur(perMonth)} / Monat</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Damit ist die Reise in {b.monthsLeft} Monaten entspannt bezahlt.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
