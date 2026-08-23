import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type ChangeEvent } from "react";
import { Download, Upload, Plus, Trash2, Users, MapPin, ShieldAlert } from "lucide-react";
import {
  AppShell,
  Card,
  CardTitle,
  Stat,
  Field,
  FieldRow,
  PrimaryButton,
  dateInputClass,
  inputClass,
  Money,
  NumberField,
} from "@/components/app/AppShell";
import { flagFor } from "@/lib/country";
import {
  downloadAllTrips,
  downloadTrip,
  readTripFile,
  tripDays,
  tripTotals,
  useTrip,
  formatDateLong,
  type Trip,
} from "@/lib/trip-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "kialia – Reisen planen, Budget & Reisetagebuch" },
      {
        name: "description",
        content:
          "kialia: mehrere Reisen planen, Ideen mit Links sammeln, Budget kalkulieren, Packliste teilen und ein Reisetagebuch mit Sprachmemo führen.",
      },
      { property: "og:title", content: "kialia – Reisen planen & festhalten" },
      {
        property: "og:description",
        content: "Mehrere Reiseziele planen, Kosten im Blick behalten und jeden Tag festhalten.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeTab,
});

function HomeTab() {
  const {
    trip,
    trips,
    hasTrip,
    activeId,
    update,
    addTrip,
    removeTrip,
    selectTrip,
    importTrip,
    ready,
  } = useTrip();
  const fileInput = useRef<HTMLInputElement>(null);
  const [ioMsg, setIoMsg] = useState<string | null>(null);
  const [newDest, setNewDest] = useState("");
  const [draft, setDraft] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    companions: "",
    people: 2,
  });

  /**
   * Legt die erste Reise mit allem an, was schon bekannt ist.
   *
   * Bewusst erst beim Absenden: eine Reise entsteht, wenn jemand sie anlegt —
   * nicht schon, weil die App gestartet wurde.
   */
  function createTrip(e: React.FormEvent) {
    e.preventDefault();
    const dest = draft.destination.trim();
    if (!dest) return;
    addTrip(dest);
    update({
      startDate: draft.startDate,
      endDate: draft.endDate,
      companions: draft.companions.trim(),
      travellers: draft.people || 1,
    });
    setDraft({ destination: "", startDate: "", endDate: "", companions: "", people: 2 });
  }
  const days = tripDays(trip);
  const totals = tripTotals(trip);

  function handleExportTrip() {
    downloadTrip(trip);
    setIoMsg(`„${trip.destination || "Reise"}“ als Datei gespeichert.`);
  }

  function handleBackup() {
    downloadAllTrips(trips);
    setIoMsg(
      `Sicherung mit ${trips.length} ${trips.length === 1 ? "Reise" : "Reisen"} gespeichert.`,
    );
  }

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const incoming = await readTripFile(file);
      incoming.forEach((t) => importTrip(t));
      setIoMsg(`${incoming.length} ${incoming.length === 1 ? "Reise" : "Reisen"} importiert.`);
    } catch (err) {
      setIoMsg(err instanceof Error ? err.message : "Import fehlgeschlagen.");
    }
  }

  if (!ready) return <div className="min-h-screen bg-background" />;

  // Noch keine Reise: eine Einladung und ein vollstaendiges Formular. Vorher
  // stand hier eine namenlose Platzhalter-Reise "ohne Datum" — das Erste, was
  // ein neuer Nutzer sah, sah aus wie ein Fehler.
  if (!hasTrip) {
    return (
      <AppShell title="" subtitle="">
        <div className="pt-2">
          <h2 className="text-[1.75rem] font-extrabold leading-[1.15] tracking-[-0.02em]">
            Let&rsquo;s start a new adventure
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sag uns, wohin es geht. Plan, Budget, Packliste und Tagebuch gehören danach zu genau
            dieser Reise.
          </p>

          <form onSubmit={createTrip} className="mt-6 space-y-4">
            <Card>
              <Field label="Wohin geht die Reise?">
                <input
                  value={draft.destination}
                  onChange={(e) => setDraft({ ...draft, destination: e.target.value })}
                  placeholder="z. B. Griechenland, Vietnam, Norwegen …"
                  autoFocus
                  className={inputClass}
                />
              </Field>

              <div className="mt-3">
                <FieldRow>
                  <Field label="Von">
                    <input
                      type="date"
                      value={draft.startDate}
                      onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                      className={dateInputClass}
                    />
                  </Field>
                  <Field label="Bis">
                    <input
                      type="date"
                      value={draft.endDate}
                      min={draft.startDate || undefined}
                      onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                      className={dateInputClass}
                    />
                  </Field>
                </FieldRow>
              </div>

              <div className="mt-3">
                <FieldRow>
                  <Field label="Mit wem?">
                    <input
                      value={draft.companions}
                      onChange={(e) => setDraft({ ...draft, companions: e.target.value })}
                      placeholder="Partner, Familie …"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Personen">
                    <NumberField
                      value={draft.people}
                      onChange={(n) => setDraft({ ...draft, people: n })}
                      className={inputClass}
                    />
                  </Field>
                </FieldRow>
              </div>
            </Card>

            <PrimaryButton type="submit" disabled={!draft.destination.trim()}>
              <Plus className="size-4" /> Reise anlegen
            </PrimaryButton>
            <p className="text-center text-xs text-muted-foreground">
              Nur das Ziel ist nötig. Alles andere kannst du später ergänzen.
            </p>
          </form>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Übersicht" subtitle={tripSubtitle(trip, days)}>
      <div className="space-y-4">
        {/* Der Reisewechsel lebt nur hier. In allen anderen Tabs gilt genau
            diese eine Reise — sonst weiss niemand, worauf sich ein Budget
            oder ein Tagebucheintrag bezieht. */}
        <Card>
          <CardTitle>{trips.length === 1 ? "Eure Reise" : "Eure Reisen"}</CardTitle>
          <div className="mt-3 space-y-2">
            {trips.map((t) => {
              const active = t.id === activeId;
              const f = flagFor(t.destination);
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition ${
                    active ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectTrip(t.id)}
                    className="flex flex-1 items-center gap-2.5 text-left"
                  >
                    {f ? (
                      <span className="text-xl leading-none" aria-hidden>
                        {f}
                      </span>
                    ) : (
                      <MapPin
                        className={`size-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
                      />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{t.destination}</span>
                      <span className="block text-xs text-muted-foreground">
                        {t.startDate
                          ? `${formatDateLong(t.startDate)}${t.endDate ? ` – ${formatDateLong(t.endDate)}` : ""}`
                          : "Zeitraum offen"}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Reise ${t.destination} löschen`}
                    onClick={() => removeTrip(t.id)}
                    className="text-muted-foreground transition hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <details className="mt-3">
            <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 rounded-2xl border border-dashed border-foreground/25 bg-card/70 py-3 text-sm font-semibold text-foreground transition hover:bg-card">
              <Plus className="size-4" /> Weitere Reise
            </summary>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const v = newDest.trim();
                if (!v) return;
                addTrip(v);
                setNewDest("");
              }}
              className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2"
            >
              <input
                value={newDest}
                onChange={(e) => setNewDest(e.target.value)}
                placeholder="Nächstes Reiseziel …"
                className={inputClass}
              />
              <button
                type="submit"
                className="acrylic-warm grid size-11 shrink-0 place-items-center rounded-xl text-background"
                aria-label="Reise hinzufügen"
              >
                <Plus className="size-4" />
              </button>
            </form>
          </details>
        </Card>

        <Card>
          <CardTitle>Eckdaten</CardTitle>
          <div className="mt-3 space-y-3">
            <Field label="Wohin geht die Reise?">
              <input
                value={trip.destination}
                onChange={(e) => update({ destination: e.target.value })}
                placeholder="z. B. Portugal, Vietnam, Norwegen …"
                className={inputClass}
              />
            </Field>
            <FieldRow>
              <Field label="Von">
                <input
                  type="date"
                  value={trip.startDate}
                  onChange={(e) => update({ startDate: e.target.value })}
                  className={dateInputClass}
                />
              </Field>
              <Field label="Bis">
                <input
                  type="date"
                  value={trip.endDate}
                  onChange={(e) => update({ endDate: e.target.value })}
                  className={dateInputClass}
                />
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="Mit wem?">
                <input
                  value={trip.companions}
                  onChange={(e) => update({ companions: e.target.value })}
                  placeholder="Partner, Familie …"
                  className={inputClass}
                />
              </Field>
              <Field label="Personen">
                <NumberField
                  value={trip.travellers}
                  onChange={(n) => update({ travellers: n })}
                  className={inputClass}
                />
              </Field>
            </FieldRow>
          </div>
        </Card>

        <Card>
          <Stat
            label="Reisedauer"
            value={days > 0 ? `${days} Tage` : "–"}
            hint={
              <>
                <Users className="mr-1 inline size-4" />
                {trip.travellers} Personen · bisher geplant <Money value={totals.total} />
              </>
            }
          />
        </Card>

        <Card>
          <CardTitle>Sichern & weitergeben</CardTitle>
          <p className="mt-1 flex items-start gap-2 text-xs leading-snug text-muted-foreground">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              Deine Reisen liegen aktuell nur in diesem Browser. Wer den Verlauf löscht, verliert
              sie. Lege regelmäßig eine Sicherung an.
            </span>
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <PrimaryButton onClick={handleExportTrip}>
              <Download className="size-4" /> Diese Reise exportieren
            </PrimaryButton>
            <PrimaryButton onClick={() => fileInput.current?.click()}>
              <Upload className="size-4" /> Reise importieren
            </PrimaryButton>
          </div>
          <button
            type="button"
            onClick={handleBackup}
            className="mt-2 w-full rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground underline-offset-2 transition hover:underline"
          >
            Alle {trips.length} {trips.length === 1 ? "Reise" : "Reisen"} sichern
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            className="hidden"
          />
          {ioMsg && <p className="mt-2 text-center text-xs font-medium">{ioMsg}</p>}
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Gemeinsames Planen in Echtzeit ist noch nicht gebaut. Bis dahin kannst du die Reisedatei
            weitergeben — dein Partner importiert sie und plant seine Kopie.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}

/** Kopfzeile der Reise: Zeitraum und Dauer, sobald bekannt. */
function tripSubtitle(trip: Trip, days: number): string {
  if (!trip.startDate) return "Zeitraum noch offen";
  const range = `${formatDateLong(trip.startDate)}${trip.endDate ? ` – ${formatDateLong(trip.endDate)}` : ""}`;
  return days > 0 ? `${range} · ${days} ${days === 1 ? "Tag" : "Tage"}` : range;
}
