import { createFileRoute } from "@tanstack/react-router";
import { Bike, Bus, Car, Plane, Plus, Ship, Train, Trash2 } from "lucide-react";
import { AppShell, Card, Field, inputClass } from "@/components/app/AppShell";
import { LinkList, StatusPicker } from "@/components/app/bits";
import {
  boardLabels,
  eur,
  mealsPerDay,
  normalizeUrl,
  tripTotals,
  uid,
  useTrip,
  type Activity,
  type Board,
  type Stay,
  type Transport,
  type Trip,
} from "@/lib/trip-store";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Reiseplan & Kosten – TraveliVibes" },
      {
        name: "description",
        content:
          "Plane Fortbewegung, Unterkünfte, Verpflegung und Aktivitäten mit Kosten, Zahlungsstatus und Fristen – inklusive Sparplan bis zur Reise.",
      },
      { property: "og:title", content: "Reiseplan & Kosten – TraveliVibes" },
      {
        property: "og:description",
        content: "Fortbewegung, Unterkünfte, Essen und Aktivitäten mit Kosten und Zahlungsstatus.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlanTab,
});

const modes = [
  { key: "Flugzeug", icon: Plane },
  { key: "Bahn", icon: Train },
  { key: "Bus", icon: Bus },
  { key: "Auto", icon: Car },
  { key: "Velo", icon: Bike },
  { key: "Schiff", icon: Ship },
];

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mb-2 mt-6 px-1 text-sm font-semibold uppercase tracking-wide">{children}</h2>;
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" aria-label="Eintrag löschen" onClick={onClick}>
      <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
    </button>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:border-primary hover:text-foreground"
    >
      <Plus className="size-4" /> {label}
    </button>
  );
}

function PlanTab() {
  const { trip, update, ready } = useTrip();
  const totals = tripTotals(trip);

  const setTransport = (id: string, patch: Partial<Transport>) =>
    update({ transports: trip.transports.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  const setStay = (id: string, patch: Partial<Stay>) =>
    update({ stays: trip.stays.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const setActivity = (id: string, patch: Partial<Activity>) =>
    update({ activities: trip.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  const setMeals = (patch: Partial<Trip["meals"]>) => update({ meals: { ...trip.meals, ...patch } });
  const setSavings = (patch: Partial<Trip["savings"]>) =>
    update({ savings: { ...trip.savings, ...patch } });

  const perDay = mealsPerDay(trip.meals);
  const overMax = perDay > trip.meals.maxPerDay && trip.meals.maxPerDay > 0;
  const openAmount = Math.max(0, totals.total - trip.savings.saved - trip.savings.credit);
  const perMonth = trip.savings.monthsLeft > 0 ? openAmount / trip.savings.monthsLeft : openAmount;

  if (!ready) return <div className="min-h-screen bg-background" />;

  return (
    <AppShell title="Plan" subtitle="Fortbewegung, Unterkunft, Essen und Aktivitäten.">
      <div className="space-y-3">
        <SectionTitle>Fortbewegungsmittel</SectionTitle>
        {trip.transports.map((t, i) => (
          <Card key={t.id}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Nr. {i + 1}</p>
              <DeleteButton
                onClick={() => update({ transports: trip.transports.filter((x) => x.id !== t.id) })}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {modes.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTransport(t.id, { mode: key })}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                    t.mode === key ? "border-primary bg-primary/10 font-medium" : "border-border"
                  }`}
                >
                  <Icon className="size-3.5" /> {key}
                </button>
              ))}
            </div>
            <div className="mt-3 space-y-3">
              <Field label="Strecke / Anbieter">
                <input
                  value={t.label}
                  onChange={(e) => setTransport(t.id, { label: e.target.value })}
                  placeholder="z. B. Hinflug Zürich – Lissabon"
                  className={inputClass}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kosten (€)">
                  <input
                    type="number"
                    min={0}
                    value={t.cost}
                    onChange={(e) => setTransport(t.id, { cost: Number(e.target.value) })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Zahlen bis / Rate bis">
                  <input
                    type="date"
                    value={t.dueDate}
                    onChange={(e) => setTransport(t.id, { dueDate: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>
              <StatusPicker value={t.status} onChange={(status) => setTransport(t.id, { status })} />
              <Field label="Notiz (z. B. Ratenzahlung)">
                <input
                  value={t.note}
                  onChange={(e) => setTransport(t.id, { note: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Link">
                <input
                  value={t.url}
                  onChange={(e) => setTransport(t.id, { url: e.target.value })}
                  onBlur={(e) => setTransport(t.id, { url: normalizeUrl(e.target.value) })}
                  placeholder="Buchungs-Link"
                  className={inputClass}
                />
              </Field>
              {t.url && (
                <a
                  href={t.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-xs font-medium text-primary underline"
                >
                  Buchung öffnen
                </a>
              )}
            </div>
          </Card>
        ))}
        <AddButton
          label="Fortbewegungsmittel hinzufügen"
          onClick={() =>
            update({
              transports: [
                ...trip.transports,
                { id: uid(), mode: "Flugzeug", label: "", cost: 0, status: "offen", dueDate: "", note: "", url: "" },
              ],
            })
          }
        />

        <SectionTitle>Unterkünfte</SectionTitle>
        {trip.stays.map((s) => (
          <Card key={s.id}>
            <div className="flex items-center justify-between gap-2">
              <input
                value={s.name}
                onChange={(e) => setStay(s.id, { name: e.target.value })}
                placeholder="Name der Unterkunft"
                className={`${inputClass} font-semibold`}
              />
              <DeleteButton onClick={() => update({ stays: trip.stays.filter((x) => x.id !== s.id) })} />
            </div>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Von">
                  <input
                    type="date"
                    value={s.from}
                    onChange={(e) => setStay(s.id, { from: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Bis">
                  <input
                    type="date"
                    value={s.to}
                    onChange={(e) => setStay(s.id, { to: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Link zur Unterkunft (Booking, Airbnb …)">
                <input
                  value={s.url}
                  onChange={(e) => setStay(s.id, { url: e.target.value })}
                  onBlur={(e) => setStay(s.id, { url: normalizeUrl(e.target.value) })}
                  className={inputClass}
                />
              </Field>
              {s.url && (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-xs font-medium text-primary underline"
                >
                  Website öffnen
                </a>
              )}
              <Field label="Was ist inkludiert?">
                <select
                  value={s.board}
                  onChange={(e) => setStay(s.id, { board: e.target.value as Board })}
                  className={inputClass}
                >
                  {(Object.keys(boardLabels) as Board[]).map((b) => (
                    <option key={b} value={b}>
                      {boardLabels[b]}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kosten (€)">
                  <input
                    type="number"
                    min={0}
                    value={s.cost}
                    onChange={(e) => setStay(s.id, { cost: Number(e.target.value) })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Zahlen bis">
                  <input
                    type="date"
                    value={s.dueDate}
                    onChange={(e) => setStay(s.id, { dueDate: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>
              <StatusPicker value={s.status} onChange={(status) => setStay(s.id, { status })} />
            </div>
          </Card>
        ))}
        <AddButton
          label="Unterkunft hinzufügen"
          onClick={() =>
            update({
              stays: [
                ...trip.stays,
                { id: uid(), name: "", url: "", from: "", to: "", cost: 0, status: "offen", dueDate: "", board: "nichts" },
              ],
            })
          }
        />

        <SectionTitle>Essen pro Tag</SectionTitle>
        <Card>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Morgens (€)">
              <input
                type="number"
                min={0}
                value={trip.meals.breakfast}
                onChange={(e) => setMeals({ breakfast: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="Mittags (€)">
              <input
                type="number"
                min={0}
                value={trip.meals.lunch}
                onChange={(e) => setMeals({ lunch: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="Abends (€)">
              <input
                type="number"
                min={0}
                value={trip.meals.dinner}
                onChange={(e) => setMeals({ dinner: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="Snacks (€)">
              <input
                type="number"
                min={0}
                value={trip.meals.snacks}
                onChange={(e) => setMeals({ snacks: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Maximal pro Tag (€)">
              <input
                type="number"
                min={0}
                value={trip.meals.maxPerDay}
                onChange={(e) => setMeals({ maxPerDay: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
          </div>
          <p className={`mt-3 text-sm ${overMax ? "text-destructive" : "text-muted-foreground"}`}>
            Geplant: {eur(perDay)} pro Tag
            {overMax ? ` – ${eur(perDay - trip.meals.maxPerDay)} über deinem Limit.` : "."}
          </p>
        </Card>

        <SectionTitle>Aktivitäten</SectionTitle>
        {trip.activities.map((a) => (
          <Card key={a.id}>
            <div className="flex items-center justify-between gap-2">
              <input
                value={a.name}
                onChange={(e) => setActivity(a.id, { name: e.target.value })}
                placeholder="Name der Aktivität"
                className={`${inputClass} font-semibold`}
              />
              <DeleteButton
                onClick={() => update({ activities: trip.activities.filter((x) => x.id !== a.id) })}
              />
            </div>
            <div className="mt-3 space-y-3">
              <Field label="Link (z. B. GetYourGuide)">
                <input
                  value={a.url}
                  onChange={(e) => setActivity(a.id, { url: e.target.value })}
                  onBlur={(e) => setActivity(a.id, { url: normalizeUrl(e.target.value) })}
                  className={inputClass}
                />
              </Field>
              {a.url && (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-xs font-medium text-primary underline"
                >
                  Website öffnen
                </a>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kosten (€)">
                  <input
                    type="number"
                    min={0}
                    value={a.cost}
                    onChange={(e) => setActivity(a.id, { cost: Number(e.target.value) })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Zahlen bis">
                  <input
                    type="date"
                    value={a.dueDate}
                    onChange={(e) => setActivity(a.id, { dueDate: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>
              <StatusPicker value={a.status} onChange={(status) => setActivity(a.id, { status })} />
            </div>
          </Card>
        ))}
        <AddButton
          label="Aktivität hinzufügen"
          onClick={() =>
            update({
              activities: [
                ...trip.activities,
                { id: uid(), name: "", url: "", cost: 0, status: "offen", dueDate: "" },
              ],
            })
          }
        />

        <SectionTitle>Gesamtkosten</SectionTitle>
        <Card>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Die Reise kostet bis jetzt
          </p>
          <p className="mt-1 text-4xl font-semibold">{eur(totals.total)}</p>
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            <p>Fortbewegung: {eur(totals.transport)}</p>
            <p>Unterkünfte: {eur(totals.stays)}</p>
            <p>
              Essen: {eur(totals.food)} ({totals.days} Tage)
            </p>
            <p>Aktivitäten: {eur(totals.activities)}</p>
            <p className="pt-2 font-medium text-foreground">
              Bereits bezahlt: {eur(totals.paid)} · offen: {eur(totals.open)}
            </p>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={trip.savings.enabled}
              onChange={(e) => setSavings({ enabled: e.target.checked })}
              className="size-4 accent-[var(--primary)]"
            />
            Möchtest du wissen, wie viel du bis zur Reise sparen solltest?
          </label>

          {trip.savings.enabled && (
            <div className="mt-3 space-y-3 rounded-2xl bg-secondary/40 p-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Schon gespart (€)">
                  <input
                    type="number"
                    min={0}
                    value={trip.savings.saved}
                    onChange={(e) => setSavings({ saved: Number(e.target.value) })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Kredit (€)">
                  <input
                    type="number"
                    min={0}
                    value={trip.savings.credit}
                    onChange={(e) => setSavings({ credit: Number(e.target.value) })}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Monate bis zur Reise">
                <input
                  type="number"
                  min={1}
                  value={trip.savings.monthsLeft}
                  onChange={(e) => setSavings({ monthsLeft: Number(e.target.value) })}
                  className={inputClass}
                />
              </Field>
              <div className="rounded-2xl bg-accent/25 p-3">
                <p className="text-sm font-medium">Spar-Empfehlung</p>
                <p className="mt-1 text-2xl font-semibold">{eur(perMonth)} / Monat</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Noch offen: {eur(openAmount)} in {trip.savings.monthsLeft} Monaten.
                </p>
              </div>
            </div>
          )}
        </Card>

        <SectionTitle>Gespeicherte Links</SectionTitle>
        <Card>
          <p className="mb-2 text-xs text-muted-foreground">
            Alles, was du schnell wieder öffnen willst.
          </p>
          <LinkList
            links={trip.ideas.flatMap((i) => i.links)}
            onChange={() => undefined}
            placeholder="Links legst du bei den Ideen an"
          />
        </Card>
      </div>
    </AppShell>
  );
}
