import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Mic, Plus, Printer, Square } from "lucide-react";
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
  nextDiaryDay,
  todayLocalISO,
  uid,
  useTrip,
  type DiaryEntry,
} from "@/lib/trip-store";
import { useVoiceMemo } from "@/lib/use-voice-memo";
import { transcribeMemo } from "@/lib/transcribe.functions";

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

type Layout = "klassisch" | "journal" | "postkarte";

/** Ein Wort statt Sternen. Bewusst kurz und alltagsnah — niemand waehlt
    abends aus zwanzig Adjektiven. */
const moods = ["weit", "ruhig", "müde", "überwältigt", "neugierig", "dankbar"] as const;

/** Die Frage darf variieren, aber es bleibt bei einer pro Tag. Fest an die
    Tagesnummer gebunden, damit sie beim Tippen nicht wechselt. */
const questions = [
  "Was bleibt von heute?",
  "Was war der Moment, den du behalten willst?",
  "Woran wirst du dich in einem Jahr noch erinnern?",
  "Was hat dich heute überrascht?",
  "Wovon willst du zu Hause erzählen?",
];

function questionFor(day: number): string {
  return questions[Math.abs(day - 1) % questions.length]!;
}

const layoutLabels: Record<Layout, string> = {
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

function DiaryTab() {
  const { trip, update, ready, hasTrip } = useTrip();
  const [withBudget, setWithBudget] = useState(true);
  const [layout, setLayout] = useState<Layout>("journal");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const voice = useVoiceMemo();
  // Transkription braucht ein konfiguriertes Backend. Ist keines da, zeigen wir
  // den Mikrofon-Button gar nicht erst an, statt die Aufnahme ins Leere laufen
  // zu lassen und den gesprochenen Text zu verlieren.
  const voiceEnabled = import.meta.env.VITE_VOICE_ENABLED === "true";

  const set = (id: string, patch: Partial<DiaryEntry>) =>
    update({ diary: trip.diary.map((e) => (e.id === id ? { ...e, ...patch } : e)) });

  const missing = missingDiaryDays(trip);

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
          day: nextDiaryDay(trip),
          date: todayLocalISO(),
          text: "",
          highlight: "",
          notes: "",
          expenses: "",
          spent: 0,
          food: "",
          mood: "",
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
        const res = await transcribeMemo({ data: { audio, mimeType: "audio/wav" } });
        const text = res.text.trim();
        if (text) {
          const prev = entry[field];
          set(entry.id, { [field]: prev ? `${prev}\n${text}` : text } as Partial<DiaryEntry>);
        } else {
          voice.setError("Es wurde nichts erkannt – bitte nochmal sprechen.");
        }
      } catch (err) {
        voice.setError(err instanceof Error ? err.message : "Transkription fehlgeschlagen.");
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
          {trip.diary.map((e) => (
            <Card key={e.id}>
              {/* Die Breite steuert der Container, nicht eine zweite
                  Breitenklasse am Eingabefeld: dateInputClass bringt `w-full`
                  mit, und zwei Breiten-Utilities entscheiden sich nach
                  CSS-Reihenfolge, nicht nach Klassenreihenfolge. Genau daran
                  lief die Karte rechts aus dem Bild. */}
              <div className="flex items-center gap-2">
                <h2 className="min-w-0 flex-1 truncate text-base font-semibold">
                  {e.day}. Reisetag
                </h2>
                <div className="w-[7.75rem] shrink-0">
                  <input
                    type="date"
                    value={e.date}
                    onChange={(ev) => set(e.id, { date: ev.target.value })}
                    className={`${dateInputClass} py-1.5`}
                  />
                </div>
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
                <span className="text-xs font-medium text-muted-foreground">Wie war der Tag?</span>
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
                {(["food", "highlight", "expenses"] as FieldKey[]).map((f) => (
                  <div key={f}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {fieldLabels[f]}
                      </span>
                      <MemoButton entry={e} field={f} />
                    </div>
                    <textarea
                      value={e[f] ?? ""}
                      onChange={(ev) => set(e.id, { [f]: ev.target.value } as Partial<DiaryEntry>)}
                      rows={3}
                      placeholder={fieldPlaceholders[f]}
                      className={`${inputClass} resize-y`}
                    />
                  </div>
                ))}

                <Field label="Summe heute (€)">
                  <NumberField
                    value={e.spent}
                    onChange={(n) => set(e.id, { spent: n })}
                    className={inputClass}
                  />
                </Field>

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
            </Card>
          ))}
        </div>

        {trip.diary.length === 0 && (
          <p className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Noch kein Eintrag – starte mit Tag 1.
          </p>
        )}

        <Card>
          <CardTitle>Als PDF speichern</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Fertiges A5-Layout – zum Ausdrucken oder als PDF in Canva & Co. weiterverwenden.
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
            <Printer className="size-4" /> Als A5-PDF speichern
          </PrimaryButton>
        </Card>
      </div>

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
