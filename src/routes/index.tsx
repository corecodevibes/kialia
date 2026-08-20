import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, Plus, Trash2, Users, MapPin } from "lucide-react";
import {
  AppShell,
  Card,
  Field,
  FieldRow,
  PrimaryButton,
  dateInputClass,
  inputClass,
} from "@/components/app/AppShell";
import { eur, tripDays, tripTotals, useTrip } from "@/lib/trip-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TraveliVibes – Reisen planen, Budget & Reisetagebuch" },
      {
        name: "description",
        content:
          "TraveliVibes: mehrere Reisen planen, Ideen mit Links sammeln, Budget kalkulieren, Packliste teilen und ein Reisetagebuch mit Sprachmemo führen.",
      },
      { property: "og:title", content: "TraveliVibes – Reisen planen & festhalten" },
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
  const { trip, trips, activeId, update, addTrip, removeTrip, selectTrip, ready } = useTrip();
  const [copied, setCopied] = useState(false);
  const [newDest, setNewDest] = useState("");
  const days = tripDays(trip);
  const totals = tripTotals(trip);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
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
          <p className="text-sm font-semibold">Eure Reisen</p>
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
                    <MapPin className={`size-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
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
          <div className="space-y-3">
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
            </div>
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

        <Card className="text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Reisedauer</p>
          <p className="mt-1 text-3xl font-semibold">{days > 0 ? `${days} Tage` : "–"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <Users className="mr-1 inline size-4" />
            {trip.travellers} Personen · bisher geplant {eur(totals.total)}
          </p>
        </Card>

        <PrimaryButton onClick={share}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Link kopiert" : "Link zum Teilen kopieren"}
        </PrimaryButton>
        <p className="px-2 text-center text-xs text-muted-foreground">
          Teile den Link mit deinem Partner oder deiner Familie – so plant ihr gemeinsam weiter.
        </p>
      </div>
    </AppShell>
  );
}
