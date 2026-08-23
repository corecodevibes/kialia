import { createFileRoute } from "@tanstack/react-router";
import { Bike, Bus, Car, Plane, Ship, Train } from "lucide-react";
import {
  AddButton,
  AppShell,
  Card,
  DeleteButton,
  Field,
  FieldRow,
  SectionTitle,
  CardTitle,
  chipClass,
  dateInputClass,
  inputClass,
  selectClass,
  Money,
  NoTripYet,
  NumberField,
  PlaceField,
} from "@/components/app/AppShell";
import { StatusPicker } from "@/components/app/bits";

import {
  boardLabels,
  eur,
  mealsPerDay,
  normalizeUrl,
  tripTotals,
  savingsPlan,
  uid,
  useTrip,
  type Activity,
  type Board,
  type Stay,
  type Transport,
  type Trip,
  formatDateLong,
  tripItinerary,
} from "@/lib/trip-store";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Reiseplan & Kosten – kialia" },
      {
        name: "description",
        content:
          "Plane Fortbewegung, Unterkünfte, Verpflegung und Aktivitäten mit Kosten, Zahlungsstatus und Fristen – inklusive Sparplan bis zur Reise.",
      },
      { property: "og:title", content: "Reiseplan & Kosten – kialia" },
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

function PlanTab() {
  const { trip, update, ready, hasTrip } = useTrip();
  const totals = tripTotals(trip);

  const setTransport = (id: string, patch: Partial<Transport>) =>
    update({ transports: trip.transports.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  const setStay = (id: string, patch: Partial<Stay>) =>
    update({ stays: trip.stays.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const setActivity = (id: string, patch: Partial<Activity>) =>
    update({ activities: trip.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  const setMeals = (patch: Partial<Trip["meals"]>) =>
    update({ meals: { ...trip.meals, ...patch } });
  const setSavings = (patch: Partial<Trip["savings"]>) =>
    update({ savings: { ...trip.savings, ...patch } });

  const perDay = mealsPerDay(trip.meals);
  const overMax = perDay > trip.meals.maxPerDay && trip.meals.maxPerDay > 0;
  // Bewusst bei jedem Rendern neu berechnet statt gespeichert: die Rate muss
  // mitziehen, wenn sich Datum, Kosten oder Erspartes aendern.
  const plan = savingsPlan(trip, totals);

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!hasTrip) return <NoTripYet what="Ein Plan mit Kosten" />;

  return (
    <AppShell title="Plan" subtitle="Fortbewegung, Unterkunft, Essen und Aktivitäten.">
      <div className="space-y-3">
        <SectionTitle>Reiseverlauf</SectionTitle>
        <Itinerary trip={trip} />

        <SectionTitle>Fortbewegungsmittel</SectionTitle>
        {trip.transports.map((t, i) => (
          <Card key={t.id}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <Field label={`Nr. ${i + 1} – Strecke / Anbieter`}>
                  <input
                    value={t.label}
                    onChange={(e) => setTransport(t.id, { label: e.target.value })}
                    placeholder="z. B. Hinflug Zürich – Lissabon"
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="pt-5">
                <DeleteButton
                  onClick={() =>
                    update({ transports: trip.transports.filter((x) => x.id !== t.id) })
                  }
                />
              </div>
            </div>
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {modes.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTransport(t.id, { mode: key })}
                    className={chipClass(t.mode === key)}
                  >
                    <Icon className="size-3.5" /> {key}
                  </button>
                ))}
              </div>
              <Field label="Wann reist ihr?">
                <input
                  type="date"
                  value={t.date}
                  onChange={(e) => setTransport(t.id, { date: e.target.value })}
                  className={dateInputClass}
                />
              </Field>
              <FieldRow>
                <Field label="Kosten (€)">
                  <NumberField
                    value={t.cost}
                    onChange={(n) => setTransport(t.id, { cost: n })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Zahlen bis / Rate bis">
                  <input
                    type="date"
                    value={t.dueDate}
                    onChange={(e) => setTransport(t.id, { dueDate: e.target.value })}
                    className={dateInputClass}
                  />
                </Field>
              </FieldRow>
              <StatusPicker
                value={t.status}
                onChange={(status) => setTransport(t.id, { status })}
              />
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
                  className="block truncate text-xs font-medium text-primary underline"
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
                {
                  id: uid(),
                  mode: "Flugzeug",
                  label: "",
                  cost: 0,
                  status: "offen",
                  date: "",
                  dueDate: "",
                  note: "",
                  url: "",
                },
              ],
            })
          }
        />

        <SectionTitle>Unterkünfte</SectionTitle>
        {trip.stays.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <Field label="Name der Unterkunft">
                  <input
                    value={s.name}
                    onChange={(e) => setStay(s.id, { name: e.target.value })}
                    placeholder="z. B. Casa Azul"
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="pt-5">
                <DeleteButton
                  onClick={() => update({ stays: trip.stays.filter((x) => x.id !== s.id) })}
                />
              </div>
            </div>
            <div className="mt-3 space-y-3">
              <PlaceField
                name={s.name}
                address={s.address}
                destination={trip.destination}
                onChange={(v) => setStay(s.id, { address: v })}
              />
              <FieldRow>
                <Field label="Von">
                  <input
                    type="date"
                    value={s.from}
                    onChange={(e) => setStay(s.id, { from: e.target.value })}
                    className={dateInputClass}
                  />
                </Field>
                <Field label="Bis">
                  <input
                    type="date"
                    value={s.to}
                    onChange={(e) => setStay(s.id, { to: e.target.value })}
                    className={dateInputClass}
                  />
                </Field>
              </FieldRow>
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
                  className="block truncate text-xs font-medium text-primary underline"
                >
                  Website öffnen
                </a>
              )}
              <Field label="Was ist inkludiert?">
                <select
                  value={s.board}
                  onChange={(e) => setStay(s.id, { board: e.target.value as Board })}
                  className={selectClass}
                >
                  {(Object.keys(boardLabels) as Board[]).map((b) => (
                    <option key={b} value={b}>
                      {boardLabels[b]}
                    </option>
                  ))}
                </select>
              </Field>
              <FieldRow>
                <Field label="Kosten (€)">
                  <NumberField
                    value={s.cost}
                    onChange={(n) => setStay(s.id, { cost: n })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Zahlen bis">
                  <input
                    type="date"
                    value={s.dueDate}
                    onChange={(e) => setStay(s.id, { dueDate: e.target.value })}
                    className={dateInputClass}
                  />
                </Field>
              </FieldRow>
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
                {
                  id: uid(),
                  name: "",
                  address: "",
                  url: "",
                  from: "",
                  to: "",
                  cost: 0,
                  status: "offen",
                  dueDate: "",
                  board: "nichts",
                },
              ],
            })
          }
        />

        <SectionTitle>Essen pro Tag</SectionTitle>
        <Card>
          {/* Manche planen einen Tagessatz, andere rechnen pro Mahlzeit. Beides
              wird getrennt gespeichert: wer umschaltet, verliert seine
              Eingaben nicht und bekommt sie beim Zurueckschalten wieder. */}
          <div
            className="mb-3 grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1 text-sm font-medium"
            role="radiogroup"
            aria-label="Wie plant ihr das Essen?"
          >
            {(
              [
                ["total", "Gesamt pro Tag"],
                ["split", "Nach Mahlzeiten"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={trip.meals.mode === key}
                onClick={() => setMeals({ mode: key })}
                className={`rounded-xl py-2 transition ${
                  trip.meals.mode === key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {trip.meals.mode === "total" ? (
              <Field label="Essen pro Tag (€)">
                <NumberField
                  value={trip.meals.perDay}
                  onChange={(n) => setMeals({ perDay: n })}
                  className={inputClass}
                />
              </Field>
            ) : (
              <>
                <FieldRow>
                  <Field label="Morgens (€)">
                    <NumberField
                      value={trip.meals.breakfast}
                      onChange={(n) => setMeals({ breakfast: n })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Mittags (€)">
                    <NumberField
                      value={trip.meals.lunch}
                      onChange={(n) => setMeals({ lunch: n })}
                      className={inputClass}
                    />
                  </Field>
                </FieldRow>
                <FieldRow>
                  <Field label="Abends (€)">
                    <NumberField
                      value={trip.meals.dinner}
                      onChange={(n) => setMeals({ dinner: n })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Snacks (€)">
                    <NumberField
                      value={trip.meals.snacks}
                      onChange={(n) => setMeals({ snacks: n })}
                      className={inputClass}
                    />
                  </Field>
                </FieldRow>
              </>
            )}
            <Field label="Maximal pro Tag (€)">
              <NumberField
                value={trip.meals.maxPerDay}
                onChange={(n) => setMeals({ maxPerDay: n })}
                className={inputClass}
              />
            </Field>
          </div>
          <p className={`mt-3 text-sm ${overMax ? "text-destructive" : "text-muted-foreground"}`}>
            Geplant: <Money value={perDay} /> pro Tag
            {overMax ? ` – ${eur(perDay - trip.meals.maxPerDay)} über deinem Limit.` : "."}
          </p>
        </Card>

        <SectionTitle>Aktivitäten</SectionTitle>
        {trip.activities.map((a) => (
          <Card key={a.id}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <Field label="Name der Aktivität">
                  <input
                    value={a.name}
                    onChange={(e) => setActivity(a.id, { name: e.target.value })}
                    placeholder="z. B. Bootstour bei Sonnenuntergang"
                    className={inputClass}
                  />
                </Field>
                <div className="mt-3">
                  <PlaceField
                    name={a.name}
                    address={a.address}
                    destination={trip.destination}
                    onChange={(v) => setActivity(a.id, { address: v })}
                  />
                </div>
              </div>
              <div className="pt-5">
                <DeleteButton
                  onClick={() =>
                    update({ activities: trip.activities.filter((x) => x.id !== a.id) })
                  }
                />
              </div>
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
                  className="block truncate text-xs font-medium text-primary underline"
                >
                  Website öffnen
                </a>
              )}
              <FieldRow>
                <Field label="Kosten (€)">
                  <NumberField
                    value={a.cost}
                    onChange={(n) => setActivity(a.id, { cost: n })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Zahlen bis">
                  <input
                    type="date"
                    value={a.dueDate}
                    onChange={(e) => setActivity(a.id, { dueDate: e.target.value })}
                    className={dateInputClass}
                  />
                </Field>
              </FieldRow>
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
                {
                  id: uid(),
                  name: "",
                  address: "",
                  url: "",
                  cost: 0,
                  status: "offen",
                  dueDate: "",
                },
              ],
            })
          }
        />

        <SectionTitle>Gesamtkosten</SectionTitle>
        <Card>
          <CardTitle>Geplant</CardTitle>
          <p className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums">
            <Money value={totals.total} />
          </p>
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            <p>
              Fortbewegung: <Money value={totals.transport} />
            </p>
            <p>
              Unterkünfte: <Money value={totals.stays} />
            </p>
            <p>
              Essen: <Money value={totals.food} /> ({totals.days} Tage)
            </p>
            <p>
              Aktivitäten: <Money value={totals.activities} />
            </p>
            <p className="pt-2 font-medium text-foreground">
              Bereits bezahlt: <Money value={totals.paid} /> · offen: <Money value={totals.open} />
            </p>
          </div>

          {/* Geplant und tatsaechlich bleiben getrennt: `total` ist die
              Schaetzung aus diesem Bildschirm, `actual` kommt ausschliesslich
              aus dem Tagebuch. Zusammengezaehlt wuerde beides wertlos. */}
          {totals.actualDays > 0 && (
            <div className="mt-4 rounded-2xl bg-secondary/40 p-3">
              <div className="flex items-baseline justify-between gap-3">
                <CardTitle>Tatsächlich ausgegeben</CardTitle>
                <span className="text-lg font-bold tabular-nums">
                  <Money value={totals.actual} />
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Aus dem Tagebuch, {totals.actualDays}{" "}
                {totals.actualDays === 1 ? "erfasster Tag" : "erfasste Tage"}. Nicht in den
                geplanten Kosten enthalten.
              </p>
              {totals.days > 0 && totals.actualDays > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Im Schnitt <Money value={totals.actual / totals.actualDays} /> pro erfasstem Tag —
                  bei {totals.days} Reisetagen wären das hochgerechnet{" "}
                  <span className="tabular-nums">
                    <Money value={(totals.actual / totals.actualDays) * totals.days} />
                  </span>
                  . Eine Hochrechnung, keine Abrechnung.
                </p>
              )}
            </div>
          )}

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
                  <NumberField
                    value={trip.savings.saved}
                    onChange={(n) => setSavings({ saved: n })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Kredit (€)">
                  <NumberField
                    value={trip.savings.credit}
                    onChange={(n) => setSavings({ credit: n })}
                    className={inputClass}
                  />
                </Field>
              </div>
              {plan.source === "manual" && (
                <Field label="Monate bis zur Reise">
                  <NumberField
                    value={trip.savings.monthsLeft}
                    onChange={(n) => setSavings({ monthsLeft: n })}
                    className={inputClass}
                  />
                </Field>
              )}

              <div className="rounded-2xl bg-accent/25 p-3">
                <CardTitle>Spar-Empfehlung</CardTitle>

                {plan.perMonth === null ? (
                  <>
                    <p className="mt-1 text-lg font-semibold">Keine Monatsrate mehr</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {plan.months !== null && plan.months < 0
                        ? "Das Reisedatum liegt in der Vergangenheit."
                        : "Die Reise beginnt noch diesen Monat."}{" "}
                      Offen sind <Money value={plan.open} />.
                    </p>
                  </>
                ) : plan.reason === "nothing-open" ? (
                  <>
                    <p className="mt-1 text-lg font-semibold">Alles beisammen</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Gespartes und Kredit decken die geplanten <Money value={plan.total} /> bereits
                      ab.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums">
                      <Money value={plan.perMonth} /> / Monat
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {plan.months} {plan.months === 1 ? "Monat" : "Monate"}{" "}
                      {plan.source === "date" ? "bis zur Abreise" : "nach deiner Angabe"}.
                    </p>
                  </>
                )}

                {/* Fortschritt statt nackter Zahl. Zwischen zwei Reisen ist das
                    der einzige Grund, diese App zu oeffnen — ein Balken, der
                    sich bewegt, traegt zwoelf Monate, eine Monatsrate nicht. */}
                {plan.total > 0 && (
                  <div className="mt-3">
                    <div
                      className="h-2.5 w-full overflow-hidden rounded-full bg-foreground/10"
                      role="progressbar"
                      aria-valuenow={Math.round(plan.progress * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Sparfortschritt"
                    >
                      <div
                        className="acrylic-warm h-full rounded-full transition-[width] duration-500 ease-out"
                        style={{
                          width: `${Math.max(plan.progress * 100, plan.covered > 0 ? 3 : 0)}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground tabular-nums">
                        {Math.round(plan.progress * 100)} %
                      </span>{" "}
                      beisammen — <Money value={plan.covered} /> von <Money value={plan.total} />
                    </p>
                  </div>
                )}

                {/* Herkunft der Zahl — eine Zahl ohne erkennbare Herkunft
                    glaubt niemand zweimal. */}
                <dl className="mt-3 space-y-1 border-t border-foreground/10 pt-2 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Geplante Kosten</dt>
                    <dd className="tabular-nums">
                      <Money value={plan.total} />
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Gespart und Kredit</dt>
                    <dd className="tabular-nums">
                      − <Money value={plan.covered} />
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 font-semibold">
                    <dt>Noch offen</dt>
                    <dd className="tabular-nums">
                      <Money value={plan.open} />
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

/**
 * Der Reiseverlauf.
 *
 * Die Daten dafuer lagen laengst im Modell — Unterkuenfte haben Von/Bis,
 * Transporte jetzt ein Reisedatum. Sie wurden nur nie als Reise dargestellt,
 * sondern als Kostenliste. Was kein Datum hat, wird unten ausgewiesen statt
 * geraten: eine Reise mit unbekannter Reihenfolge soll als solche sichtbar
 * sein.
 */
function Itinerary({ trip }: { trip: Trip }) {
  const { stops, gaps, undated } = tripItinerary(trip);
  const gapAfter = new Map(gaps.map((g) => [g.from, g]));

  if (!stops.length && !undated.length) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">
          Sobald Unterkünfte oder Fahrten ein Datum haben, entsteht hier euer Verlauf — mit
          Reisetagen, Nächten und den Lücken, für die noch nichts gebucht ist.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      {stops.length > 0 && (
        <ol className="space-y-3">
          {stops.map((s) => {
            const gap = s.kind === "stay" && s.endDate ? gapAfter.get(s.endDate) : undefined;
            return (
              <li key={`${s.kind}-${s.id}`}>
                <div className="flex items-baseline gap-3">
                  <span className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground tabular-nums">
                    {s.day ? `Tag ${s.day}` : formatDateLong(s.date).split(" ")[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {[
                        formatDateLong(s.date),
                        s.nights > 0 ? `${s.nights} ${s.nights === 1 ? "Nacht" : "Nächte"}` : "",
                        s.detail,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {s.cost > 0 && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      <Money value={s.cost} />
                    </span>
                  )}
                </div>

                {gap && (
                  <p className="ml-[4.25rem] mt-2 rounded-xl bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
                    {gap.nights} {gap.nights === 1 ? "Nacht" : "Nächte"} ohne Unterkunft
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {undated.length > 0 && (
        <div className={stops.length ? "mt-4 border-t border-foreground/10 pt-3" : ""}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Noch ohne Datum
          </p>
          <ul className="mt-1.5 space-y-1">
            {undated.map((u) => (
              <li key={`${u.kind}-${u.id}`} className="truncate text-sm text-muted-foreground">
                {u.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
