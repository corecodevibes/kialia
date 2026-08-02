import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, Users } from "lucide-react";
import { AppShell, Card, Field, inputClass } from "@/components/app/AppShell";
import { eur, tripDays, tripTotals, useTrip } from "@/lib/trip-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TraveliVibes – Reise planen, Budget & Reisetagebuch" },
      {
        name: "description",
        content:
          "TraveliVibes: Reiseziel, Ideen mit Links, Fortbewegung, Unterkünfte, Budget und Reisetagebuch mit Sprachmemo – alles in einer mobilen App.",
      },
      { property: "og:title", content: "TraveliVibes – Reise planen & festhalten" },
      {
        property: "og:description",
        content: "Ideen sammeln, Kosten planen und jeden Reisetag als Tagebuch festhalten.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeTab,
});

function HomeTab() {
  const { trip, update, ready } = useTrip();
  const [copied, setCopied] = useState(false);
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
    <AppShell title={trip.destination || "Wohin geht's?"} subtitle="Deine nächste Reise beginnt hier.">
      <div className="space-y-4">
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
            <div className="grid grid-cols-2 gap-3">
              <Field label="Von">
                <input
                  type="date"
                  value={trip.startDate}
                  onChange={(e) => update({ startDate: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Bis">
                <input
                  type="date"
                  value={trip.endDate}
                  onChange={(e) => update({ endDate: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
            </div>
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

        <button
          type="button"
          onClick={share}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold text-background"
          style={{ background: "var(--gradient-warm)" }}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Link kopiert" : "Link zum Teilen kopieren"}
        </button>
        <p className="px-2 text-center text-xs text-muted-foreground">
          Teile den Link mit deinem Partner oder deiner Familie – so plant ihr gemeinsam weiter.
        </p>
      </div>
    </AppShell>
  );
}
