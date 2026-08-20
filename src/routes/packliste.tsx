import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { AppShell, Card, Field, inputClass } from "@/components/app/AppShell";
import {
  kidsPacking,
  petsPacking,
  uid,
  useTrip,
  type PackCategory,
} from "@/lib/trip-store";

export const Route = createFileRoute("/packliste")({
  head: () => ({
    meta: [
      { title: "Packliste – TraveliVibes" },
      {
        name: "description",
        content:
          "Gemeinsame Packliste für eure Reise: Hygiene, Medikamente, Kleidung, Schuhe, Sport, Kinder und Haustiere – individuell erweiterbar.",
      },
      { property: "og:title", content: "Packliste – TraveliVibes" },
      {
        property: "og:description",
        content: "Packliste gemeinsam mit Partner oder Familie füllen und abhaken.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PackingTab,
});

function PackingTab() {
  const { trip, update, ready } = useTrip();
  const [newCat, setNewCat] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const categories = trip.packing;
  const total = categories.reduce((s, c) => s + c.items.length, 0);
  const done = categories.reduce((s, c) => s + c.items.filter((i) => i.done).length, 0);

  function setCats(fn: (cats: PackCategory[]) => PackCategory[]) {
    update((t) => ({ packing: fn(t.packing) }));
  }

  function toggleExtra(kind: "kids" | "pets") {
    const on = !trip[kind];
    const name = kind === "kids" ? "Kinder" : "Haustiere";
    update((t) => ({
      [kind]: on,
      packing: on
        ? t.packing.some((c) => c.name === name)
          ? t.packing
          : [...t.packing, kind === "kids" ? kidsPacking() : petsPacking()]
        : t.packing.filter((c) => c.name !== name),
    }));
  }

  if (!ready) return <div className="min-h-screen bg-background" />;

  return (
    <AppShell
      title="Packliste"
      subtitle={`${done} von ${total} Sachen eingepackt – alle mit dem Link können ergänzen.`}
    >
      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Fortschritt</p>
              <p className="text-xs text-muted-foreground">{done} / {total} erledigt</p>
            </div>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
              <div
                className="acrylic-warm h-full rounded-full transition-all"
                style={{ width: `${total ? (done / total) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => toggleExtra("kids")}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                trip.kids ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              Kinder dabei
            </button>
            <button
              type="button"
              onClick={() => toggleExtra("pets")}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                trip.pets ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              Haustiere dabei
            </button>
          </div>
          <div className="mt-3">
            <Field label="Welche Sportart? (für die Sportkleidung)">
              <input
                value={trip.sports}
                onChange={(e) => update({ sports: e.target.value })}
                placeholder="z. B. Wandern, Surfen, Yoga …"
                className={inputClass}
              />
            </Field>
          </div>
        </Card>

        {categories.map((c) => {
          const isOpen = open[c.id] ?? true;
          const catDone = c.items.filter((i) => i.done).length;
          return (
            <Card key={c.id}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpen((o) => ({ ...o, [c.id]: !isOpen }))}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  <span className="text-sm font-semibold">{c.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {catDone}/{c.items.length}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`${c.name} löschen`}
                  onClick={() => setCats((cats) => cats.filter((x) => x.id !== c.id))}
                  className="text-muted-foreground transition hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {isOpen && (
                <div className="mt-3 space-y-2">
                  {c.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={item.done ? "Als offen markieren" : "Als gepackt markieren"}
                        onClick={() =>
                          setCats((cats) =>
                            cats.map((x) =>
                              x.id === c.id
                                ? {
                                    ...x,
                                    items: x.items.map((i) =>
                                      i.id === item.id ? { ...i, done: !i.done } : i,
                                    ),
                                  }
                                : x,
                            ),
                          )
                        }
                        className={`flex size-6 shrink-0 items-center justify-center rounded-lg border transition ${
                          item.done ? "border-primary bg-primary text-primary-foreground" : "border-border"
                        }`}
                      >
                        {item.done && <Check className="size-3.5" />}
                      </button>
                      <input
                        value={item.text}
                        onChange={(e) =>
                          setCats((cats) =>
                            cats.map((x) =>
                              x.id === c.id
                                ? {
                                    ...x,
                                    items: x.items.map((i) =>
                                      i.id === item.id ? { ...i, text: e.target.value } : i,
                                    ),
                                  }
                                : x,
                            ),
                          )
                        }
                        className={`${inputClass} flex-1 ${item.done ? "text-muted-foreground line-through" : ""}`}
                      />
                      <input
                        value={item.who}
                        onChange={(e) =>
                          setCats((cats) =>
                            cats.map((x) =>
                              x.id === c.id
                                ? {
                                    ...x,
                                    items: x.items.map((i) =>
                                      i.id === item.id ? { ...i, who: e.target.value } : i,
                                    ),
                                  }
                                : x,
                            ),
                          )
                        }
                        placeholder="Wer?"
                        className={`${inputClass} w-20 shrink-0 px-2`}
                      />
                      <button
                        type="button"
                        aria-label="Eintrag löschen"
                        onClick={() =>
                          setCats((cats) =>
                            cats.map((x) =>
                              x.id === c.id
                                ? { ...x, items: x.items.filter((i) => i.id !== item.id) }
                                : x,
                            ),
                          )
                        }
                        className="text-muted-foreground transition hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setCats((cats) =>
                        cats.map((x) =>
                          x.id === c.id
                            ? {
                                ...x,
                                items: [
                                  ...x.items,
                                  { id: uid(), text: "", qty: "", done: false, who: "" },
                                ],
                              }
                            : x,
                        ),
                      )
                    }
                    className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-medium text-primary"
                  >
                    <Plus className="size-4" /> Eintrag hinzufügen
                  </button>
                </div>
              )}
            </Card>
          );
        })}

        <Card>
          <Field label="Eigene Kategorie">
            <div className="flex gap-2">
              <input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="z. B. Strand, Camping, Technik …"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => {
                  const name = newCat.trim();
                  if (!name) return;
                  setCats((cats) => [...cats, { id: uid(), name, items: [] }]);
                  setNewCat("");
                }}
                className="acrylic-warm shrink-0 rounded-xl px-4 text-sm font-semibold text-background"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </Field>
        </Card>
      </div>
    </AppShell>
  );
}
