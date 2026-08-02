import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Mic, Plus, Printer, Square, Trash2 } from "lucide-react";
import { AppShell, Card, Field, inputClass } from "@/components/app/AppShell";
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

function DiaryTab() {
  const { trip, update, ready } = useTrip();
  const [withBudget, setWithBudget] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
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
          expenses: "",
          spent: 0,
        },
      ],
    });
  }

  async function toggleRecording(entry: DiaryEntry) {
    if (voice.recording && activeId === entry.id) {
      setActiveId(null);
      const audio = await voice.stop();
      if (!audio) return;
      setBusyId(entry.id);
      try {
        const res = await transcribeMemo({ data: { audio, mimeType: "audio/wav" } });
        const text = res.text.trim();
        if (text) set(entry.id, { text: entry.text ? `${entry.text}\n${text}` : text });
        else voice.setError("Es wurde nichts erkannt – bitte nochmal sprechen.");
      } catch (err) {
        voice.setError(err instanceof Error ? err.message : "Transkription fehlgeschlagen.");
      } finally {
        setBusyId(null);
      }
      return;
    }
    setActiveId(entry.id);
    voice.setError(null);
    await voice.start();
  }

  const totalSpent = trip.diary.reduce((s, e) => s + (e.spent || 0), 0);

  if (!ready) return <div className="min-h-screen bg-background" />;

  return (
    <AppShell title="Reisetagebuch" subtitle="Sprich deinen Tag ein – wir schreiben ihn auf.">
      <div className="space-y-4">
        <Card className="print:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Bisher ausgegeben</p>
              <p className="text-2xl font-semibold">{eur(totalSpent)}</p>
            </div>
            <button
              type="button"
              onClick={addDay}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              <Plus className="size-4" /> Neuer Tag
            </button>
          </div>
        </Card>

        {voice.error && (
          <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive print:hidden">
            {voice.error}
          </p>
        )}

        <div className="space-y-4 print:space-y-2">
          {trip.diary.map((e) => (
            <Card key={e.id} className="print:rounded-none print:shadow-none">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{e.day}. Tag</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={e.date}
                    onChange={(ev) => set(e.id, { date: ev.target.value })}
                    className="rounded-xl border border-border bg-background px-2 py-1 text-xs print:border-0"
                  />
                  <button
                    type="button"
                    aria-label="Tag löschen"
                    className="print:hidden"
                    onClick={() => update({ diary: trip.diary.filter((x) => x.id !== e.id) })}
                  >
                    <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>

              <div className="mt-3 print:hidden">
                <button
                  type="button"
                  disabled={busyId === e.id}
                  onClick={() => toggleRecording(e)}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    voice.recording && activeId === e.id
                      ? "bg-destructive text-background"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {busyId === e.id ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Wird geschrieben …
                    </>
                  ) : voice.recording && activeId === e.id ? (
                    <>
                      <Square className="size-4" /> Aufnahme beenden
                    </>
                  ) : (
                    <>
                      <Mic className="size-4" /> Sprachmemo aufnehmen
                    </>
                  )}
                </button>
                <p className="mt-1 text-center text-[11px] text-muted-foreground">
                  Der Text erscheint unten und lässt sich korrigieren. Die Aufnahme wird danach gelöscht.
                </p>
              </div>

              <div className="mt-3 space-y-3">
                <Field label="Wie war dein Tag heute?">
                  <textarea
                    value={e.text}
                    onChange={(ev) => set(e.id, { text: ev.target.value })}
                    rows={5}
                    className={`${inputClass} resize-y print:border-0`}
                  />
                </Field>
                <Field label="Highlight">
                  <input
                    value={e.highlight}
                    onChange={(ev) => set(e.id, { highlight: ev.target.value })}
                    className={`${inputClass} print:border-0`}
                  />
                </Field>
                <div className={withBudget ? "space-y-3" : "space-y-3 print:hidden"}>
                  <Field label="Ausgaben heute (frei aufschreiben)">
                    <textarea
                      value={e.expenses}
                      onChange={(ev) => set(e.id, { expenses: ev.target.value })}
                      rows={2}
                      placeholder="Mittagessen 24 €, Museum 12 € …"
                      className={`${inputClass} resize-y print:border-0`}
                    />
                  </Field>
                  <Field label="Summe heute (€)">
                    <input
                      type="number"
                      min={0}
                      value={e.spent}
                      onChange={(ev) => set(e.id, { spent: Number(ev.target.value) })}
                      className={`${inputClass} print:border-0`}
                    />
                  </Field>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {trip.diary.length === 0 && (
          <p className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Noch kein Eintrag – starte mit Tag 1.
          </p>
        )}

        <Card className="print:hidden">
          <p className="text-sm font-semibold">Als PDF speichern</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Kleines A5-Tagebuch zum Ausdrucken – wahlweise mit oder ohne Budget.
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={withBudget}
              onChange={(ev) => setWithBudget(ev.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            Mit Budget & Ausgaben drucken
          </label>
          <button
            type="button"
            onClick={() => window.print()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-background"
            style={{ background: "var(--gradient-warm)" }}
          >
            <Printer className="size-4" /> Als A5-PDF speichern
          </button>
        </Card>
      </div>
    </AppShell>
  );
}
