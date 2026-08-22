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
} from "@/components/app/AppShell";
import {
  downloadAllTrips,
  downloadTrip,
  readTripFile,
  tripDays,
  tripTotals,
  useTrip,
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
  const { trip, trips, activeId, update, addTrip, removeTrip, selectTrip, importTrip, ready } =
    useTrip();
  const fileInput = useRef<HTMLInputElement>(null);
  const [ioMsg, setIoMsg] = useState<string | null>(null);
  const [newDest, setNewDest] = useState("");
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

  return (
    <AppShell
      title={trip.destination || "Wohin geht's?"}
      subtitle="Was sind eure nächsten Reiseziele?"
    >
      <div className="space-y-4">
        <Card>
          <CardTitle>Eure Reisen</CardTitle>
          <div className="mt-3 space-y-2">
            {trips.map((t) => {
              const active = t.id === activeId;
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
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    <MapPin
                      className={`size-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {t.destination || "Neue Reise"}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {t.startDate ? `${t.startDate} – ${t.endDate || "?"}` : "Noch kein Datum"}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="Reise löschen"
                    onClick={() => removeTrip(t.id)}
                    className="text-muted-foreground transition hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <input
              value={newDest}
              onChange={(e) => setNewDest(e.target.value)}
              placeholder="Nächstes Reiseziel …"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => {
                addTrip(newDest.trim());
                setNewDest("");
              }}
              className="acrylic-warm grid size-11 shrink-0 place-items-center rounded-xl text-background"
              aria-label="Reise hinzufügen"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Ideen, Plan, Packliste und Tagebuch gehören immer zur ausgewählten Reise.
          </p>
        </Card>

        <Card>
          <CardTitle>Eure Reise</CardTitle>
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
                <input
                  type="number"
                  min={1}
                  value={trip.travellers}
                  onChange={(e) => update({ travellers: Number(e.target.value) })}
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
