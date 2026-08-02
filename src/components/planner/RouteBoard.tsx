import { useState } from "react";
import { MapPin, Plus, Sparkles, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { draftRoute, uid, type Trip, type Stop } from "@/lib/trip-store";

type Props = { trip: Trip; update: (p: Partial<Trip>) => void };

export function RouteBoard({ trip, update }: Props) {
  const [name, setName] = useState("");

  const setStops = (stops: Stop[]) => update({ stops });

  function add() {
    if (!name.trim()) return;
    setStops([...trip.stops, { id: uid(), name: name.trim(), nights: 2, note: "" }]);
    setName("");
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...trip.stops];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setStops(next);
  }

  const totalNights = trip.stops.reduce((s, x) => s + (x.nights || 0), 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <section className="rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Reisetage
            </label>
            <input
              type="number"
              min={1}
              value={trip.days}
              onChange={(e) => update({ days: Number(e.target.value) })}
              className="mt-1 w-24 rounded-xl border border-border bg-background px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Startdatum
            </label>
            <input
              type="date"
              value={trip.startDate}
              onChange={(e) => update({ startDate: e.target.value })}
              className="mt-1 rounded-xl border border-border bg-background px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Personen
            </label>
            <input
              type="number"
              min={1}
              value={trip.travellers}
              onChange={(e) => update({ travellers: Number(e.target.value) })}
              className="mt-1 w-20 rounded-xl border border-border bg-background px-3 py-2"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => update({ stops: draftRoute(trip.destination, trip.days, trip.style) })}
          className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          style={{ background: "var(--gradient-warm)" }}
        >
          <Sparkles className="size-4" /> Groben Plan vorschlagen
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          Verteilt deine {trip.days} Tage automatisch auf sinnvolle Etappen – danach frei anpassbar.
        </p>

        <div className="mt-6 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Eigenen Stopp hinzufügen …"
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={add}
            className="rounded-xl bg-primary px-4 text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <ol className="mt-6 space-y-3">
          {trip.stops.map((s, i) => (
            <li key={s.id} className="rounded-2xl border border-border bg-secondary/30 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <input
                    value={s.name}
                    onChange={(e) =>
                      setStops(trip.stops.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))
                    }
                    className="w-full bg-transparent font-medium outline-none"
                  />
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="number"
                      min={0}
                      value={s.nights}
                      onChange={(e) =>
                        setStops(
                          trip.stops.map((x) =>
                            x.id === s.id ? { ...x, nights: Number(e.target.value) } : x,
                          ),
                        )
                      }
                      className="w-16 rounded-lg border border-border bg-background px-2 py-1"
                    />
                    Nächte
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-muted-foreground">
                  <button type="button" onClick={() => move(i, -1)} aria-label="Nach oben">
                    <ArrowUp className="size-4 hover:text-foreground" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} aria-label="Nach unten">
                    <ArrowDown className="size-4 hover:text-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStops(trip.stops.filter((x) => x.id !== s.id))}
                    aria-label="Stopp löschen"
                  >
                    <Trash2 className="size-4 hover:text-destructive" />
                  </button>
                </div>
              </div>
            </li>
          ))}
          {trip.stops.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Noch keine Etappen. Lass dir einen groben Plan vorschlagen oder setze eigene Punkte.
            </li>
          )}
        </ol>
      </section>

      <section
        className="relative min-h-[420px] overflow-hidden rounded-3xl p-6"
        style={{ background: "var(--gradient-sky)", boxShadow: "var(--shadow-soft)" }}
      >
        <div className="rounded-2xl bg-background/80 px-4 py-3 backdrop-blur">
          <p className="text-sm font-semibold">{trip.destination || "Dein Reiseziel"}</p>
          <p className="text-xs text-muted-foreground">
            {trip.stops.length} Etappen · {totalNights} Nächte geplant
          </p>
        </div>

        <svg viewBox="0 0 300 320" className="mt-4 h-[320px] w-full">
          <path
            d={trip.stops
              .map((_, i) => {
                const x = 50 + ((i * 79) % 190);
                const y = 40 + i * (250 / Math.max(1, trip.stops.length));
                return `${i === 0 ? "M" : "L"}${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="var(--background)"
            strokeWidth="2.5"
            strokeDasharray="7 7"
            opacity="0.85"
          />
          {trip.stops.map((s, i) => {
            const x = 50 + ((i * 79) % 190);
            const y = 40 + i * (250 / Math.max(1, trip.stops.length));
            return (
              <g key={s.id}>
                <circle cx={x} cy={y} r="9" fill="var(--background)" />
                <text x={x} y={y + 3.5} textAnchor="middle" fontSize="9" fill="var(--foreground)">
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>

        {trip.stops.length === 0 && (
          <p className="absolute inset-x-6 bottom-6 flex items-center gap-2 rounded-2xl bg-background/80 p-4 text-xs text-muted-foreground backdrop-blur">
            <MapPin className="size-4" /> Deine Route erscheint hier, sobald du Stopps hinzufügst.
          </p>
        )}
      </section>
    </div>
  );
}
