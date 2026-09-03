import { useMyName } from "@/lib/auth";
import { ExpenseField } from "@/components/app/expense-field";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, Loader2, Mic, Plus, Printer, Square } from "lucide-react";
import {
  AppShell,
  Card,
  DeleteButton,
  Field,
  PrimaryButton,
  CardTitle,
  Stat,
  dateInputClass,
  inputClass,
  Money,
  NoTripYet,
  NumberField,
} from "@/components/app/AppShell";
import {
  formatDateLong,
  missingDiaryDays,
  travellerNames,
  nextDiaryDay,
  todayLocalISO,
  uid,
  useTrip,
  type DiaryEntry,
} from "@/lib/trip-store";
import { useVoiceMemo } from "@/lib/use-voice-memo";
import { transcribe } from "@/lib/transcribe";

export const Route = createFileRoute("/tagebuch")({
  head: () => ({
    meta: [
      { title: "Reisetagebuch mit Sprachmemo – kialia" },
      {
        name: "description",
        content:
          "Sprich deinen Reisetag als Sprachmemo ein, korrigiere den Text, halte Ausgaben fest und drucke das Tagebuch als A5-PDF.",
      },
      { property: "og:title", content: "Reisetagebuch – kialia" },
      {
        property: "og:description",
        content: "Sprachmemo zu Text, Ausgaben festhalten und als A5-PDF drucken.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiaryTab,
});

type Layout = "schlicht" | "klassisch" | "journal" | "postkarte";

/** Ein Wort statt Sternen. Bewusst kurz und alltagsnah — niemand waehlt
    abends aus zwanzig Adjektiven. */
const moods = ["weit", "ruhig", "müde", "überwältigt", "neugierig", "dankbar"] as const;

/** Die Frage darf variieren, aber es bleibt bei einer pro Tag. Fest an die
    Tagesnummer gebunden, damit sie beim Tippen nicht wechselt. */
const questions = [
  "Was hast du heute erlebt?",
  "Was war der Moment, den du behalten willst?",
  "Woran wirst du dich in einem Jahr noch erinnern?",
  "Was hat dich heute überrascht?",
  "Wovon willst du zu Hause erzählen?",
];

function questionFor(day: number): string {
  return questions[Math.abs(day - 1) % questions.length]!;
}

const layoutLabels: Record<Layout, string> = {
  schlicht: "Schlicht – fortlaufend auf A4",
  klassisch: "Klassisch – ruhige Linien",
  journal: "Journal – mit Farbleiste",
  postkarte: "Postkarte – Sunset-Rahmen",
};

type FieldKey = "text" | "food" | "highlight" | "notes" | "expenses";

const fieldLabels: Record<FieldKey, string> = {
  text: "Was hast du heute erlebt?",
  food: "Was habt ihr gegessen — und wo?",
  highlight: "Nochmal machen? Empfehlung oder Merke",
  notes: "Sonst noch etwas",
  expenses: "Ausgaben: Essen, Souvenirs, Shops …",
};

const fieldPlaceholders: Record<FieldKey, string> = {
  text: "Ein Satz reicht.",
  food: "Taverne am Hafen, gegrillter Oktopus …",
  highlight: "Was ihr weiterempfehlen würdet — oder beim nächsten Mal anders macht.",
  notes: "Namen, Adressen, Kleinigkeiten.",
  expenses: "Mittagessen 24, Souvenirs 15, Bootsticket 30 …",
};

/** Ein Blick auf den Tag, ohne ihn aufzuklappen. */
function daySummary(e: DiaryEntry): string {
  const text = (e.text || e.highlight || e.food || "").trim().replace(/\s+/g, " ");
  if (text) return text.length > 48 ? `${text.slice(0, 47)}…` : text;
  return "noch leer";
}

function DiaryTab() {
  const { trip, update, ready, hasTrip } = useTrip();
  const [withBudget, setWithBudget] = useState(true);
  // Schlicht ist die Vorgabe: das ist das Blatt, das man verschickt oder
  // ablegt. Die verzierten Fassungen sind fuer den Ausdruck ins Album.
  const [layout, setLayout] = useState<Layout>("schlicht");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  // Zugeklappt ist der Normalfall. Waehrend der Reise ist der heutige Tag
  // offen — das ist der, den man abends schreiben will.
  const [openDay, setOpenDay] = useState<string | null>(null);
  const voice = useVoiceMemo();
  // Transkription braucht ein konfiguriertes Backend. Ist keines da, zeigen wir
  // den Mikrofon-Button gar nicht erst an, statt die Aufnahme ins Leere laufen
  // zu lassen und den gesprochenen Text zu verlieren.
  const voiceEnabled = import.meta.env.VITE_VOICE_ENABLED === "true";

  const set = (id: string, patch: Partial<DiaryEntry>) =>
    update({ diary: trip.diary.map((e) => (e.id === id ? { ...e, ...patch } : e)) });

  const myName = useMyName();
  const people = travellerNames(trip, myName);
  const missing = missingDiaryDays(trip);
  const today = todayLocalISO();

  /**
   * Waehrend der Reise steht der heutige Tag oben — und entsteht von selbst.
   *
   * Wer abends die App oeffnet, will schreiben, nicht erst einen Tag anlegen
   * und dann durch elf Karten scrollen. Ausserhalb des Reisezeitraums
   * passiert nichts: im Maerz einen Eintrag fuer heute anzulegen waere Unsinn.
   */
  const onTrip = Boolean(
    trip.startDate && trip.endDate && today >= trip.startDate && today <= trip.endDate,
  );
  const hasToday = trip.diary.some((e) => e.date === today);

  useEffect(() => {
    if (!ready || !onTrip || hasToday) return;
    update({
      diary: [
        ...trip.diary,
        {
          id: uid(),
          day: nextDiaryDay(trip),
          date: today,
          text: "",
          highlight: "",
          notes: "",
          expenses: "",
          spent: 0,
          food: "",
          mood: "",
          assignedTo: "",
        },
      ],
    });
    // Bewusst nur an diesen drei Werten haengend: sonst legt jede Aenderung
    // an der Reise einen weiteren Eintrag an.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, onTrip, hasToday]);

  // Chronologisch vorwaerts: Tag 1 oben, Tag 11 unten.
  //
  // Vorher stand der neueste Tag oben. Waehrend der Reise war das plausibel,
  // beim Anlegen aller Tage aber sah man den 6. September zuerst und zaehlte
  // rueckwaerts — ein Tagebuch, das hinten anfaengt. Der heutige Tag wird
  // stattdessen aufgeklappt und hervorgehoben; gefunden wird er darueber,
  // nicht ueber die Reihenfolge.
  const orderedDiary = [...trip.diary].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : a.day - b.day,
  );

  useEffect(() => {
    if (openDay) return;
    const heute = trip.diary.find((e) => e.date === today);
    if (heute) setOpenDay(heute.id);
    // Nur beim ersten Mal: danach entscheidet der Mensch, was offen ist.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.diary.length, today]);

  /** Legt für jeden noch fehlenden Reisetag einen leeren Eintrag an. */
  function fillDays() {
    update({
      diary: [
        ...trip.diary,
        ...missing.map((m) => ({
          id: uid(),
          day: m.day,
          date: m.date,
          text: "",
          highlight: "",
          notes: "",
          expenses: "",
          spent: 0,
          food: "",
          mood: "",
          assignedTo: "",
        })),
      ].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.day - b.day)),
    });
  }

  function addDay() {
    update({
      diary: [
        ...trip.diary,
        {
          id: uid(),
          // Nicht diary.length + 1: nach dem Loeschen eines Tages vergaebe das
          // eine schon benutzte Nummer. Und nicht toISOString(): das ist UTC,
          // wer nach Mitternacht schreibt bekaeme den Vortag gestempelt.
          // Liegt heute in der Reise, ist heute gemeint. Sonst der naechste
          // noch fehlende Reisetag — vor der Abreise einen Eintrag mit dem
          // heutigen Datum anzulegen ergibt keinen Sinn, der Tag gehoert
          // nicht zur Reise.
          day: onTrip ? nextDiaryDay(trip) : (missing[0]?.day ?? nextDiaryDay(trip)),
          date: onTrip ? todayLocalISO() : (missing[0]?.date ?? todayLocalISO()),
          text: "",
          highlight: "",
          notes: "",
          expenses: "",
          spent: 0,
          food: "",
          mood: "",
          assignedTo: "",
        },
      ],
    });
  }

  async function toggleRecording(entry: DiaryEntry, field: FieldKey) {
    const key = `${entry.id}:${field}`;
    if (voice.recording && activeKey === key) {
      setActiveKey(null);
      const audio = await voice.stop();
      if (!audio) return;
      setBusyKey(key);
      try {
        const res = await transcribe(audio, "audio/wav");
        if (res.ok) {
          const prev = entry[field];
          set(entry.id, {
            [field]: prev ? `${prev}\n${res.text}` : res.text,
          } as Partial<DiaryEntry>);
        } else {
          // Nichts verstanden ist kein Fehler des Nutzers — laute Umgebung,
          // Dialekt, fremde Orts- und Speisenamen. Deshalb wird schriftlich
          // nachgefragt statt eine Fehlermeldung hingestellt.
          voice.setError(
            res.askInstead ? `${res.error} Schreib es kurz auf — das Feld ist offen.` : res.error,
          );
        }
      } catch {
        voice.setError("Das Verschriftlichen hat nicht geklappt. Schreib es kurz auf.");
      } finally {
        setBusyKey(null);
      }
      return;
    }
    if (voice.recording) voice.cancel();
    setActiveKey(key);
    voice.setError(null);
    await voice.start();
  }

  function MemoButton({ entry, field }: { entry: DiaryEntry; field: FieldKey }) {
    if (!voiceEnabled) return null;
    const key = `${entry.id}:${field}`;
    const isRec = voice.recording && activeKey === key;
    return (
      <button
        type="button"
        disabled={busyKey === key}
        onClick={() => toggleRecording(entry, field)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
          isRec ? "bg-destructive text-background" : "bg-secondary text-foreground"
        }`}
      >
        {busyKey === key ? (
          <>
            <Loader2 className="size-3.5 animate-spin" /> schreibt …
          </>
        ) : isRec ? (
          <>
            <Square className="size-3.5" /> stoppen
          </>
        ) : (
          <>
            <Mic className="size-3.5" /> Memo
          </>
        )}
      </button>
    );
  }

  const totalSpent = trip.diary.reduce((s, e) => s + (e.spent || 0), 0);

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!hasTrip) return <NoTripYet what="Ein Reisetagebuch" />;

  return (
    <AppShell
      title="Tagebuch"
      subtitle={
        voiceEnabled
          ? "Sprich deinen Tag ein – wir schreiben ihn auf."
          : "Halte jeden Reisetag fest."
      }
    >
      <div className="space-y-4 print:hidden">
        <Card>
          <Stat label="Bisher ausgegeben" value=<Money value={totalSpent} /> />
          <PrimaryButton onClick={addDay} className="mt-3">
            <Plus className="size-4" /> Neuer Tag
          </PrimaryButton>

          {/* Steht der Zeitraum fest, kennt die Reise ihre Tage — niemand soll
              elf Tage von Hand anlegen. Bestehende Eintraege bleiben unberuehrt. */}
          {missing.length > 0 && (
            <button
              type="button"
              onClick={fillDays}
              className="mt-2 w-full rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold transition hover:bg-secondary/70"
            >
              Alle {missing.length} Reisetage anlegen
            </button>
          )}
        </Card>

        {!voiceEnabled && (
          <p className="rounded-2xl bg-muted px-4 py-3 text-xs leading-snug text-muted-foreground">
            Das Diktieren ist gerade abgeschaltet — die Sprachfunktion wird nach dem Umzug auf das
            eigene Backend neu angebunden. Tippen funktioniert wie gewohnt.
          </p>
        )}

        {voice.error && (
          <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {voice.error}
          </p>
        )}

        <div className="space-y-4">
          {/* Ein Stapel Blaetter statt einer Liste Karten: die Tage liegen
              dicht uebereinander, das aufgeschlagene loest sich heraus. */}
          <div className="sheet-stack">
            {orderedDiary.map((e) => (
              <Card key={e.id} className={`sheet ${openDay === e.id ? "sheet-open" : ""}`}>
                {/* Die Breite steuert der Container, nicht eine zweite
                  Breitenklasse am Eingabefeld: dateInputClass bringt `w-full`
                  mit, und zwei Breiten-Utilities entscheiden sich nach
                  CSS-Reihenfolge, nicht nach Klassenreihenfolge. Genau daran
                  lief die Karte rechts aus dem Bild. */}
                {/* Zugeklappt ist die Zeile TEXT, kein Formular.
                  Vorher standen hier Mikrofon, Datumsfeld, Zustaendigkeit und
                  Papierkorb nebeneinander — vier Bedienelemente, die Titel und
                  Kurzfassung komplett aus der Zeile gedraengt haben. Uebrig
                  blieb eine Reihe Eingabefelder: sieht aus wie ein Formular,
                  nicht wie ein Tagebuch.

                  Jetzt kleines Label, darunter das Datum, darunter ein Blick
                  auf den Inhalt, rechts ein Chevron. Bedient wird erst
                  aufgeklappt. */}
                <button
                  type="button"
                  onClick={() => setOpenDay((v) => (v === e.id ? null : e.id))}
                  aria-expanded={openDay === e.id}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {e.day}. Reisetag
                      </span>
                      {e.date === today && (
                        <span className="kicker rounded-full bg-[var(--ok-soft)] px-2 py-0.5 text-[9.5px] text-[var(--primary)]">
                          heute
                        </span>
                      )}
                    </span>
                    <span className="display mt-0.5 block truncate text-[1.1rem] leading-snug">
                      {formatDateLong(e.date) || "Ohne Datum"}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {daySummary(e)}
                    </span>
                  </span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-muted-foreground transition ${
                      openDay === e.id ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openDay === e.id && (
                  <>
                    {/* Nur noch das Datum. "Tag einsprechen" ist raus: die
                      Memo-Knöpfe an den einzelnen Feldern können dasselbe und
                      landen direkt am richtigen Ort. Ein zweiter Weg zum
                      selben Ziel ist keine Hilfe, sondern eine Entscheidung
                      mehr. */}
                    <div className="mt-3 border-t border-border pt-3">
                      <input
                        type="date"
                        value={e.date}
                        onChange={(ev) => set(e.id, { date: ev.target.value })}
                        className={`${dateInputClass} py-1.5`}
                      />
                    </div>
                    {/* Zuständigkeit ist raus: im Tagebuch schreibt, wer will,
                      und abends steht ohnehin fest, wer erzählt. Eine Zuweisung,
                      die niemand durchsetzt, ist nur ein Feld mehr. In der
                      Packliste ergibt sie Sinn — dort bleibt sie. */}
                    <div className="mt-2 flex justify-end">
                      <DeleteButton
                        ariaLabel={`Tag ${e.day} löschen`}
                        onClick={() => update({ diary: trip.diary.filter((x) => x.id !== e.id) })}
                      />
                    </div>

                    {/* Eine Frage, ein Feld. Vier gleich laute Felder sind ein
                  Formular — abends nach einem langen Reisetag fuellt das
                  niemand aus, und genau deshalb bleibt ein Tagebuch leer.
                  Alles Weitere ist erreichbar, draengt sich aber nicht auf. */}
                    <div className="mt-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 text-[1.05rem] italic leading-snug text-primary">
                          {questionFor(e.day)}
                        </p>
                        <MemoButton entry={e} field="text" />
                      </div>
                      <textarea
                        value={e.text}
                        onChange={(ev) => set(e.id, { text: ev.target.value })}
                        rows={5}
                        placeholder="Ein Satz reicht."
                        className={`${inputClass} resize-y`}
                      />
                    </div>

                    {/* Ein Wort statt Sternen — es faerbt spaeter den Rueckblick. */}
                    <div className="mt-3">
                      <span className="text-xs font-medium text-muted-foreground">
                        Wie war der Tag?
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {moods.map((m) => {
                          const active = e.mood === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              aria-pressed={active}
                              onClick={() => set(e.id, { mood: active ? "" : m })}
                              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                                active
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-muted-foreground hover:bg-secondary/70"
                              }`}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">
                      {(["food", "highlight"] as FieldKey[]).map((f) => (
                        <div key={f}>
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              {fieldLabels[f]}
                            </span>
                            <MemoButton entry={e} field={f} />
                          </div>
                          <textarea
                            value={e[f] ?? ""}
                            onChange={(ev) =>
                              set(e.id, { [f]: ev.target.value } as Partial<DiaryEntry>)
                            }
                            rows={3}
                            placeholder={fieldPlaceholders[f]}
                            className={`${inputClass} resize-y`}
                          />

                          {/* Statt eines Fensters nach dem Tippen: drei Chips direkt
                        darunter. Ein Antippen, kein Unterbrechen, jederzeit
                        zurücknehmbar. */}
                          {f === "food" && e.food.trim() && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {(["Empfehlung", "Merke", "War nichts"] as const).map((tag) => {
                                const active = e.foodTag === tag;
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => set(e.id, { foodTag: active ? "" : tag })}
                                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                                      active
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-muted-foreground hover:bg-secondary/70"
                                    }`}
                                  >
                                    {tag}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Ausgaben als Satz statt als Formular. Die Aufstellung
                    entsteht beim Tippen, die Summe wird berechnet — ein
                    eigenes Summenfeld daneben haette zwei Wahrheiten erzeugt. */}
                      <ExpenseField
                        entry={e}
                        onChange={(patch) => set(e.id, patch)}
                        currency={trip.currency || "EUR"}
                        people={people}
                      />

                      <details>
                        <summary className="cursor-pointer list-none text-xs font-semibold text-muted-foreground">
                          + Sonstige Notizen
                        </summary>
                        <div className="mt-2">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              {fieldLabels.notes}
                            </span>
                            <MemoButton entry={e} field="notes" />
                          </div>
                          <textarea
                            value={e.notes}
                            onChange={(ev) => set(e.id, { notes: ev.target.value })}
                            rows={3}
                            placeholder={fieldPlaceholders.notes}
                            className={`${inputClass} resize-y`}
                          />
                        </div>
                      </details>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        </div>

        {trip.diary.length === 0 && (
          <p className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Noch kein Eintrag – starte mit Tag 1.
          </p>
        )}

        {/* Erst anbieten, wenn es etwas zu drucken gibt. Ein Export-Angebot
            direkt unter "Noch kein Eintrag" verspricht ein leeres Blatt. */}
        {trip.diary.length > 0 && (
          <Card>
            <CardTitle>Als PDF speichern</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Schlicht läuft fortlaufend auf A4 – ein Dokument, das man verschickt oder ablegt. Die
              anderen drei sind A5, ein Blatt pro Tag, zum Einkleben.
            </p>

            <div className="mt-3 space-y-2">
              {(Object.keys(layoutLabels) as Layout[]).map((l) => (
                <label
                  key={l}
                  className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm ${
                    layout === l ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="pdf-layout"
                    checked={layout === l}
                    onChange={() => setLayout(l)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  {layoutLabels[l]}
                </label>
              ))}
            </div>

            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={withBudget}
                onChange={(ev) => setWithBudget(ev.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              Mit Budget & Ausgaben drucken
            </label>

            <PrimaryButton onClick={() => window.print()} className="mt-3">
              <Printer className="size-4" /> Als PDF speichern
            </PrimaryButton>
          </Card>
        )}
      </div>

      {/* @page kennt keine Klassen, also wird die Regel zum Layout erzeugt.
          A5 ist schoen fuers Album und verschwenderisch fuer ein Dokument. */}
      <style>{`@page { size: ${layout === "schlicht" ? "A4" : "A5"}; margin: ${
        layout === "schlicht" ? "18mm 16mm" : "12mm"
      }; }`}</style>

      {/* Druck-Layout */}
      <div className="hidden print:block">
        {trip.diary.map((e) => (
          <article key={e.id} className={`print-page print-page--${layout}`}>
            <header className="print-head">
              <span className="print-kicker">kialia · Reisetagebuch</span>
              <h2 className="print-day">{e.day}. Reisetag</h2>
              <span className="print-meta">
                {[trip.destination, formatDateLong(e.date)].filter(Boolean).join(" · ")}
              </span>
            </header>

            {/* Nur drucken, was auch geschrieben wurde. Vorher stand in jedem
                leeren Abschnitt ein "—" unter einer Überschrift — auf einem
                Blatt, das jemand ins Fotoalbum legt, sind das Platzhalter für
                nichts. */}
            {e.text.trim() && (
              <section className="print-block">
                <h3>Was heute passiert ist</h3>
                <p>{e.text}</p>
              </section>
            )}

            {e.highlight.trim() && (
              <section className="print-block">
                <h3>Highlight</h3>
                <p>{e.highlight}</p>
              </section>
            )}

            {e.notes.trim() && (
              <section className="print-block">
                <h3>Merke dir</h3>
                <p>{e.notes}</p>
              </section>
            )}

            {withBudget && (e.expenses.trim() || (e.spent || 0) > 0) && (
              <section className="print-block">
                <h3>Ausgaben</h3>
                {e.expenses.trim() && <p>{e.expenses}</p>}
                <p className="print-total">
                  Summe: <Money value={e.spent || 0} />
                </p>
              </section>
            )}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
