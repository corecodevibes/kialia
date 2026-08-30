import { useMyName } from "@/lib/auth";
import { Attachments } from "@/components/app/attachments";
import { countByOwners, requestPersistence } from "@/lib/attachments";
import { downloadInventory, formatBytes } from "@/lib/inventory";
import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import {
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  ShieldCheck,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import {
  AppShell,
  Card,
  CardTitle,
  PrimaryButton,
  Field,
  chipClass,
  inputClass,
  NoTripYet,
} from "@/components/app/AppShell";
import {
  kidsPacking,
  petsPacking,
  uid,
  useTrip,
  type PackCategory,
  travellerNames,
  personColor,
  type PackItem,
} from "@/lib/trip-store";

export const Route = createFileRoute("/packliste")({
  head: () => ({
    meta: [
      { title: "Packliste – kialia" },
      {
        name: "description",
        content:
          "Gemeinsame Packliste für eure Reise: Hygiene, Medikamente, Kleidung, Schuhe, Sport, Kinder und Haustiere – individuell erweiterbar.",
      },
      { property: "og:title", content: "Packliste – kialia" },
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

const rowInput =
  "rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary";

function PackingTab() {
  const { trip, update, ready, hasTrip } = useTrip();
  const [newCat, setNewCat] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const myName = useMyName();
  const people = travellerNames(trip, myName);

  /**
   * Wessen Liste gerade zu sehen ist.
   *
   * Das Modell hatte das Noetige laengst: jedes Teil traegt ein `who`. Was
   * fehlte, war die Sicht darauf — zu zweit packt man nicht aus einer Liste.
   * Deshalb ein Filter, keine zweite Datenstruktur: wer ein Teil jemandem
   * zuordnet, verschiebt es damit automatisch in dessen Liste, und alle sehen
   * weiterhin alles, wenn sie wollen.
   *
   * "" heisst gemeinsam — Zahnpasta gehoert niemandem allein.
   */
  const [wessen, setWessen] = useState<string>("alle");

  const passt = (i: PackItem) =>
    wessen === "alle" ||
    (wessen === "gemeinsam" ? !i.who.trim() : i.who.trim().toLowerCase() === wessen.toLowerCase());

  const categories = trip.packing
    .map((c) => ({ ...c, items: c.items.filter(passt) }))
    // Kategorien, in denen fuer diese Person nichts liegt, wuerden als leere
    // Kaesten dastehen. In der Gesamtsicht bleiben sie, damit man dort etwas
    // anlegen kann.
    .filter((c) => wessen === "alle" || c.items.length > 0);

  const total = categories.reduce((s, c) => s + c.items.length, 0);

  /** Wie viel in welcher Liste liegt — als Zahl am Reiter. */
  const zaehle = (wer: string) =>
    trip.packing.reduce(
      (n, c) =>
        n +
        c.items.filter((i) =>
          wer === "gemeinsam" ? !i.who.trim() : i.who.trim().toLowerCase() === wer.toLowerCase(),
        ).length,
      0,
    );

  /**
   * Zuletzt Geloeschtes, je Kategorie eines.
   *
   * Die Position wird mitgesichert, damit der Eintrag genau dorthin
   * zurueckkommt, wo er stand — sonst landet er unten und man sucht ihn.
   */
  const [openPhotos, setOpenPhotos] = useState<string | null>(null);
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [undoItem, setUndoItem] = useState<
    Record<string, { item: PackItem; index: number } | undefined>
  >({});
  const [undoCat, setUndoCat] = useState<{ cat: PackCategory; index: number } | null>(null);
  const done = categories.reduce((s, c) => s + c.items.filter((i) => i.done).length, 0);

  const allItemIds = trip.packing.flatMap((c) => c.items.map((i) => i.id)).join(",");

  // Einmal alles zaehlen statt pro Eintrag zu fragen — die Liste hat schnell
  // sechzig Zeilen.
  useEffect(() => {
    let cancelled = false;
    const ids = allItemIds ? allItemIds.split(",") : [];
    countByOwners(ids)
      .then((c) => !cancelled && setPhotoCounts(c))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [allItemIds]);

  async function exportInventory() {
    setExporting(true);
    setExportMsg(null);
    try {
      // Erst jetzt fragen, nicht beim Start: die Bitte ergibt nur Sinn, wenn
      // gerade etwas entsteht, das bleiben soll.
      const persistent = await requestPersistence();
      const r = await downloadInventory(trip);
      setExportMsg(
        r.items === 0
          ? "Noch kein Foto hinterlegt — tippe das Kamerasymbol neben einem Eintrag."
          : `${r.items} Gegenstände mit ${r.photos} Fotos, ${formatBytes(r.bytes)}.` +
              (persistent
                ? ""
                : " Hinweis: Der Browser sichert den lokalen Speicher nicht dauerhaft zu — bewahre die Datei auf."),
      );
    } catch {
      setExportMsg("Der Export hat nicht geklappt.");
    } finally {
      setExporting(false);
    }
  }

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
  if (!hasTrip) return <NoTripYet what="Eine Packliste" />;

  return (
    <AppShell title="Packliste" subtitle={`${done} von ${total} Sachen eingepackt.`}>
      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Fortschritt</CardTitle>
              <p className="text-xs text-muted-foreground">
                {done} / {total} erledigt
              </p>
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
              className={`${chipClass(trip.kids)} py-2.5`}
            >
              Kinder dabei
            </button>
            <button
              type="button"
              onClick={() => toggleExtra("pets")}
              className={`${chipClass(trip.pets)} py-2.5`}
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

        {undoCat && (
          <button
            type="button"
            onClick={() => {
              const saved = undoCat;
              setCats((cats) => [
                ...cats.slice(0, saved.index),
                saved.cat,
                ...cats.slice(saved.index),
              ]);
              setUndoCat(null);
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold transition hover:bg-secondary/70"
          >
            <Undo2 className="size-4" />„{undoCat.cat.name}“ mit {undoCat.cat.items.length}{" "}
            Einträgen zurückholen
          </button>
        )}

        {/* Wessen Liste. Zuordnen verschiebt automatisch hierher — es ist
            derselbe Datenbestand, nur anders geschnitten. */}
        {people.length > 1 && (
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {[
              { key: "alle", label: "Alle" },
              { key: "gemeinsam", label: "Gemeinsam" },
              ...people.map((n) => ({ key: n, label: n === myName ? "Meine" : n })),
            ].map((r) => {
              const aktiv = wessen === r.key;
              const n =
                r.key === "alle"
                  ? trip.packing.reduce((a, c) => a + c.items.length, 0)
                  : zaehle(r.key);
              return (
                <button
                  key={r.key}
                  type="button"
                  aria-pressed={aktiv}
                  onClick={() => setWessen(r.key)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    aktiv ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                  }`}
                >
                  {r.label} <span className="tabular-nums opacity-70">{n}</span>
                </button>
              );
            })}
          </div>
        )}

        {categories.length === 0 && wessen !== "alle" && (
          <p className="px-1 text-sm text-muted-foreground">
            Hier liegt noch nichts. Ordne in „Alle" ein Teil jemandem zu — dann rutscht es hierher.
          </p>
        )}

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
                  {isOpen ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                  <span className="text-[0.95rem] font-semibold leading-snug tracking-[-0.01em]">
                    {c.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {catDone}/{c.items.length}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`${c.name} löschen`}
                  onClick={() => {
                    setUndoCat({ cat: c, index: categories.findIndex((x) => x.id === c.id) });
                    setCats((cats) => cats.filter((x) => x.id !== c.id));
                  }}
                  className="text-muted-foreground transition hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {isOpen && (
                <div className="mt-3 space-y-2">
                  {/* Erledigtes wandert nach unten wie auf einer
                      Einkaufsliste — was noch fehlt, steht oben und im Blick.
                      Die Reihenfolge innerhalb der Gruppen bleibt erhalten. */}
                  {[...c.items.filter((i) => !i.done), ...c.items.filter((i) => i.done)].map(
                    (item) => (
                      <Fragment key={item.id}>
                        <div
                          className={`flex items-center gap-2 rounded-xl px-1.5 py-0.5 transition ${
                            item.done ? "bg-primary/8" : ""
                          }`}
                        >
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
                              item.done
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border"
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
                            // Der Name ist die Information, alles andere ist
                            // Beiwerk. Vorher teilten sich fuenf Bedienelemente
                            // die Zeile gleichberechtigt und "Zahnbuerste &
                            // Zahnpasta" wurde zu "Zahnbuerste & Za".
                            className={`${rowInput} min-w-0 grow basis-0 text-foreground/90 ${
                              item.done ? "text-muted-foreground" : ""
                            }`}
                          />
                          {/* Auswahl statt Freitext: die Mitreisenden stehen im
                          Feld "Mit wem?" der Reise, niemand soll sie hier
                          erneut tippen. */}
                          <select
                            value={item.who}
                            aria-label="Wer packt das ein?"
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
                            className={`${rowInput} w-[3.6rem] shrink-0 appearance-none px-1 text-center text-[11px] font-semibold text-[#2F2A3E]`}
                            style={
                              item.who ? { background: personColor(trip, item.who) } : undefined
                            }
                          >
                            <option value="">Alle</option>
                            {people.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                          {/* Foto-Knopf, nicht Foto-Streifen: 60 Eintraege mit
                            offenen Bildleisten waeren unbenutzbar. Die Zahl
                            am Symbol sagt, ob etwas dahinterliegt. */}
                          <button
                            type="button"
                            aria-label={
                              photoCounts[item.id]
                                ? `${photoCounts[item.id]} Fotos – öffnen`
                                : "Foto hinzufügen"
                            }
                            aria-expanded={openPhotos === item.id}
                            onClick={() => setOpenPhotos((v) => (v === item.id ? null : item.id))}
                            className={`flex shrink-0 items-center gap-0.5 transition ${
                              photoCounts[item.id] ? "text-primary" : "text-muted-foreground"
                            } hover:text-primary`}
                          >
                            <Camera className="size-4" />
                            {photoCounts[item.id] ? (
                              <span className="text-[10px] font-bold tabular-nums">
                                {photoCounts[item.id]}
                              </span>
                            ) : null}
                          </button>
                          <button
                            type="button"
                            aria-label="Eintrag löschen"
                            onClick={() => {
                              const idx = c.items.findIndex((i) => i.id === item.id);
                              setUndoItem((u) => ({ ...u, [c.id]: { item, index: idx } }));
                              setCats((cats) =>
                                cats.map((x) =>
                                  x.id === c.id
                                    ? { ...x, items: x.items.filter((i) => i.id !== item.id) }
                                    : x,
                                ),
                              );
                            }}
                            className="text-muted-foreground transition hover:text-destructive"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                        {openPhotos === item.id && (
                          <div className="mt-1 pl-8">
                            <Attachments
                              ownerId={item.id}
                              label="Fotos für den Schadensfall"
                              variant="gallery"
                              onCountChange={(n) =>
                                setPhotoCounts((c) =>
                                  c[item.id] === n ? c : { ...c, [item.id]: n },
                                )
                              }
                            />
                          </div>
                        )}
                      </Fragment>
                    ),
                  )}

                  {undoItem[c.id] && (
                    <button
                      type="button"
                      onClick={() => {
                        const saved = undoItem[c.id]!;
                        setCats((cats) =>
                          cats.map((x) =>
                            x.id === c.id
                              ? {
                                  ...x,
                                  items: [
                                    ...x.items.slice(0, saved.index),
                                    saved.item,
                                    ...x.items.slice(saved.index),
                                  ],
                                }
                              : x,
                          ),
                        );
                        setUndoItem((u) => ({ ...u, [c.id]: undefined }));
                      }}
                      className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                    >
                      <Undo2 className="size-3.5" />„{undoItem[c.id]!.item.text || "Eintrag"}“
                      zurückholen
                    </button>
                  )}

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
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
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
                aria-label="Kategorie hinzufügen"
                className="acrylic-warm grid size-11 shrink-0 place-items-center rounded-xl text-background"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </Field>
        </Card>

        {/* Der Export ist der eigentliche Zweck der Fotos. Ohne ihn laegen sie
            genau auf dem Geraet, dessen Verlust der Grund fuer die Meldung
            waere — ein Beweis, der mit dem Beweisstueck verschwindet. */}
        <Card>
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <CardTitle>Inventar sichern</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Eine Datei mit allen Fotos und Bezeichnungen — lesbar ohne App und ohne Netz.
                Speichere sie irgendwo, wo sie den Verlust des Handys übersteht.
              </p>
            </div>
          </div>
          <PrimaryButton onClick={exportInventory} disabled={exporting} className="mt-3">
            {exporting ? "Wird erstellt …" : "Inventar herunterladen"}
          </PrimaryButton>
          {exportMsg && (
            <p role="status" className="mt-2 text-xs text-muted-foreground">
              {exportMsg}
            </p>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
