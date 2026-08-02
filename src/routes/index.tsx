import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plane, Sparkles, Waves, Building2, Car, Mountain, Palmtree } from "lucide-react";
import { useTrip, styleLabels, type TripStyle } from "@/lib/trip-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reiseplaner – Reisen planen, budgetieren, festhalten" },
      {
        name: "description",
        content:
          "Plane deine nächste Reise gemeinsam: Route, Ideen, Budget und Reisetagebuch in einer App.",
      },
      { property: "og:title", content: "Reiseplaner – Reisen planen, budgetieren, festhalten" },
      {
        property: "og:description",
        content: "Plane deine nächste Reise gemeinsam: Route, Ideen, Budget und Reisetagebuch in einer App.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const styles: { key: TripStyle; icon: typeof Plane }[] = [
  { key: "rundreise", icon: Car },
  { key: "all-inclusive", icon: Palmtree },
  { key: "staedtetrip", icon: Building2 },
  { key: "strand", icon: Waves },
  { key: "roadtrip", icon: Plane },
  { key: "natur", icon: Mountain },
];

function Home() {
  const navigate = useNavigate();
  const { trip, update } = useTrip();
  const [destination, setDestination] = useState("");
  const [style, setStyle] = useState<TripStyle | null>(null);

  const dest = destination || trip.destination;

  function start(chosen: TripStyle) {
    setStyle(chosen);
    update({ destination: dest, style: chosen });
    navigate({ to: "/planen" });
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-sky)" }} />
      <div className="absolute inset-0 -z-10 bg-background/10" />

      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-background/70 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-foreground backdrop-blur">
          <Sparkles className="size-3.5" /> Reiseplaner
        </span>

        <h1 className="text-4xl font-semibold leading-tight text-background drop-shadow-sm sm:text-6xl">
          Wohin geht die
          <br />
          nächste Reise?
        </h1>

        <div className="mt-8 rounded-3xl bg-card p-6 sm:p-8" style={{ boxShadow: "var(--shadow-lift)" }}>
          <label htmlFor="dest" className="text-sm font-medium text-muted-foreground">
            Land oder Region
          </label>
          <input
            id="dest"
            value={dest}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="z. B. Portugal, Vietnam, Norwegen …"
            className="mt-2 w-full rounded-2xl border border-border bg-background px-5 py-4 text-lg outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
          />

          <p className="mt-7 text-sm font-medium text-muted-foreground">
            Was für eine Reise wird es?
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {styles.map(({ key, icon: Icon }) => {
              const active = style === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!dest.trim()}
                  onClick={() => start(key)}
                  className={`group flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/40 hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  <Icon className="size-5 text-primary" />
                  <span className="text-sm font-medium">{styleLabels[key]}</span>
                </button>
              );
            })}
          </div>

          {!dest.trim() && (
            <p className="mt-4 text-xs text-muted-foreground">
              Trage zuerst dein Reiseziel ein, dann wählst du die Art der Reise.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
