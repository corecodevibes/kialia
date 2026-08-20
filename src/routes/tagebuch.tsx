import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Mic, Plus, Printer, Square } from "lucide-react";
import {
  AppShell,
  Card,
  DeleteButton,
  Field,
  PrimaryButton,
  dateInputClass,
  inputClass,
} from "@/components/app/AppShell";
import { eur, uid, useTrip, type DiaryEntry } from "@/lib/trip-store";
import { useVoiceMemo } from "@/lib/use-voice-memo";
import { transcribeMemo } from "@/lib/transcribe.functions";

export const Route = createFileRoute("/tagebuch")({
  head: () => ({
    meta: [
      { title: "Reisetagebuch mit Sprachmemo – TraveliVibes" },
      {
        name: "description",
        content:
          "Sprich deinen Reisetag als Sprachmemo ein, korrigiere den Text, halte Ausgaben fest und drucke das Tagebuch als A5-PDF.",
      },
      { property: "og:title", content: "Reisetagebuch – TraveliVibes" },
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

const layoutLabels: Record<Layout, string> = {
  klassisch: "Klassisch – ruhige Linien",
  journal: "Journal – mit Farbleiste",
  postkarte: "Postkarte – Sunset-Rahmen",
};

type FieldKey = "text" | "highlight" | "notes" | "expenses";

const fieldLabels: Record<FieldKey, string> = {
  text: "Was ist heute alles passiert?",
  highlight: "Mein Highlight",
  notes: "Merke dir (Restaurants, Tipps, meiden …)",
  expenses: "Ausgaben heute",
};

const fieldPlaceholders: Record<FieldKey, string> = {
  text: "Sprich einfach los – der Text landet hier.",
  highlight: "Der schönste Moment des Tages …",
  notes: "Restaurant Da Vinci top, Hafenstraße abends meiden …",
  expenses: "Mittagessen 24 €, Museum 12 € …",
};

function DiaryTab() {
  const { trip, update, ready } = useTrip();
  const [withBudget, setWithBudget] = useState(true);
  const [layout, setLayout] = useState<Layout>("journal");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const voice = useVoiceMemo();

  const set = (id: string, patch: Partial<DiaryEntry>) =>
    update({ diary: trip.diary.map((e) => (e.id === id ? { ...e, ...patch } : e)) });

  function addDay() {
    update({
      diary: [
        ...trip.diary,
        {
          id: uid(),
          day: trip.diary.length + 1,
          date: new Date().toISOString().slice(0, 10),
          text: "",
          highlight: "",
          notes: "",
          expenses: "",
          spent: 0,
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

  return (
    <AppShell title="Reisetagebuch" subtitle="Sprich deinen Tag ein – wir schreiben ihn auf.">
      <div className="space-y-4 print:hidden">
        <Card>
          <div>
            <p className="text-xs text-muted-foreground">Bisher ausgegeben</p>
            <p className="text-2xl font-semibold">{eur(totalSpent)}</p>
          </div>
          <PrimaryButton onClick={addDay} className="mt-3">
            <Plus className="size-4" /> Neuer Tag
          </PrimaryButton>
        </Card>

        {voice.error && (
          <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {voice.error}
          </p>
        )}

        <div className="space-y-4">
          {trip.diary.map((e) => (
            <Card key={e.id}>
              <div className="flex items-center gap-2">
                <h2 className="min-w-0 flex-1 truncate text-lg font-semibold">{e.day}. Reisetag</h2>
                <input
                  type="date"
                  value={e.date}
                  onChange={(ev) => set(e.id, { date: ev.target.value })}
                  className={`${dateInputClass} w-[9.5rem] shrink-0 py-1.5`}
                />
                <DeleteButton
                  ariaLabel="Tag löschen"
                  onClick={() => update({ diary: trip.diary.filter((x) => x.id !== e.id) })}
                />
              </div>

              <div className="mt-3 space-y-4">
                {(["text", "highlight", "notes"] as FieldKey[]).map((f) => (
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
                      rows={f === "text" ? 5 : 3}
                      placeholder={fieldPlaceholders[f]}
                      className={`${inputClass} resize-y`}
                    />
                  </div>
                ))}

                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {fieldLabels.expenses}
                    </span>
                    <MemoButton entry={e} field="expenses" />
                  </div>
                  <textarea
                    value={e.expenses}
                    onChange={(ev) => set(e.id, { expenses: ev.target.value })}
                    rows={3}
                    placeholder={fieldPlaceholders.expenses}
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <Field label="Summe heute (€)">
                  <input
                    type="number"
                    min={0}
                    value={e.spent}
                    onChange={(ev) => set(e.id, { spent: Number(ev.target.value) })}
                    className={inputClass}
                  />
                </Field>
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
          <p className="text-sm font-semibold">Als PDF speichern</p>
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
              <span className="print-kicker">TraveliVibes · Reisetagebuch</span>
              <h2 className="print-day">{e.day}. Reisetag</h2>
              <span className="print-meta">
                {[trip.destination, e.date].filter(Boolean).join(" · ")}
              </span>
            </header>

            <section className="print-block">
              <h3>Was heute passiert ist</h3>
              <p>{e.text || "—"}</p>
            </section>

            <section className="print-block">
              <h3>Highlight</h3>
              <p>{e.highlight || "—"}</p>
            </section>

            <section className="print-block">
              <h3>Merke dir</h3>
              <p>{e.notes || "—"}</p>
            </section>

            {withBudget && (
              <section className="print-block">
                <h3>Ausgaben</h3>
                <p>{e.expenses || "—"}</p>
                <p className="print-total">Summe: {eur(e.spent || 0)}</p>
              </section>
            )}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
