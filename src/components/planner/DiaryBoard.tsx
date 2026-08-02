import { Plus, Printer, Trash2 } from "lucide-react";
import { eur, totalBudget, uid, type Trip } from "@/lib/trip-store";

export function DiaryBoard({ trip, update }: { trip: Trip; update: (p: Partial<Trip>) => void }) {
  const total = totalBudget(trip.budget, trip.days);
  const dailyBudget = trip.days > 0 ? total / trip.days : 0;
  const spent = trip.diary.reduce((s, e) => s + (e.spent || 0), 0);
  const expected = dailyBudget * trip.diary.length;
  const diff = expected - spent;

  function addDay() {
    const day = trip.diary.length + 1;
    update({
      diary: [
        ...trip.diary,
        {
          id: uid(),
          day,
          date: new Date().toISOString().slice(0, 10),
          text: "",
          highlight: "",
          spent: 0,
        },
      ],
    });
  }

  const set = (id: string, patch: Partial<Trip["diary"][number]>) =>
    update({ diary: trip.diary.map((e) => (e.id === id ? { ...e, ...patch } : e)) });

  return (
    <div className="space-y-6">
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-card p-6 print:hidden"
        style={{ boxShadow: "var(--shadow-soft)" }}
      >
        <div>
          <p className="text-sm text-muted-foreground">Tagesbudget</p>
          <p className="text-2xl font-semibold">{eur(dailyBudget)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Bisher ausgegeben</p>
          <p className="text-2xl font-semibold">{eur(spent)}</p>
        </div>
        <div className="rounded-2xl bg-accent/25 px-4 py-3 text-sm">
          {trip.diary.length === 0
            ? "Noch keine Einträge – leg mit Tag 1 los."
            : diff >= 0
              ? `Ihr liegt ${eur(diff)} unter Plan – super, es bleibt Luft für etwas Besonderes.`
              : `Ihr liegt ${eur(-diff)} über Plan – morgen vielleicht etwas sparsamer.`}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addDay}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" /> Neuer Tag
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:border-primary"
          >
            <Printer className="size-4" /> Als PDF
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {trip.diary.map((e) => (
          <article
            key={e.id}
            className="rounded-3xl bg-card p-6"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">{e.day}. Tag</h3>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={e.date}
                  onChange={(ev) => set(e.id, { date: ev.target.value })}
                  className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => update({ diary: trip.diary.filter((x) => x.id !== e.id) })}
                  aria-label="Eintrag löschen"
                  className="print:hidden"
                >
                  <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </div>

            <label className="mt-4 block text-sm font-medium text-muted-foreground">
              Wie war dein Tag heute?
            </label>
            <textarea
              value={e.text}
              onChange={(ev) => set(e.id, { text: ev.target.value })}
              rows={4}
              className="mt-1 w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
            />

            <label className="mt-4 block text-sm font-medium text-muted-foreground">Highlight</label>
            <input
              value={e.highlight}
              onChange={(ev) => set(e.id, { highlight: ev.target.value })}
              className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary"
            />

            <label className="mt-4 block text-sm font-medium text-muted-foreground">
              Ausgaben heute
            </label>
            <input
              type="number"
              min={0}
              value={e.spent}
              onChange={(ev) => set(e.id, { spent: Number(ev.target.value) })}
              className="mt-1 w-40 rounded-2xl border border-border bg-background px-4 py-2.5"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {e.spent > dailyBudget
                ? `${eur(e.spent - dailyBudget)} über dem Tagesbudget.`
                : `${eur(dailyBudget - e.spent)} unter dem Tagesbudget.`}
            </p>
          </article>
        ))}

        {trip.diary.length === 0 && (
          <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Dein Reisetagebuch ist noch leer. Jeder Tag wird später Teil deines PDF-Albums.
          </p>
        )}
      </div>
    </div>
  );
}
