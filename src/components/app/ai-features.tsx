import { useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";

/**
 * Was die App mit KI kann — und was bewusst nicht.
 *
 * Der zweite Teil ist der wichtigere. Wer weiss, wo die Grenze verlaeuft,
 * vertraut dem Rest; wer es nicht weiss, misstraut allem. Deshalb steht hier
 * ausdruecklich, dass Vorschlaege ungeprueft sind und Kosten Schaetzungen.
 */
const FEATURES: { title: string; where: string; note: string }[] = [
  {
    title: "Reisetag einsprechen",
    where: "Tagebuch · pro Feld",
    note: "Sprich statt zu tippen — der Text landet im jeweiligen Feld und bleibt änderbar.",
  },
  {
    title: "Beleg auslesen",
    where: "Plan · bei Flug, Unterkunft, Aktivität",
    note: "Screenshot anhängen, Felder werden vorgeschlagen. Übernommen wird nur, was du abhakst.",
  },
  {
    title: "Vorschläge fürs Ziel",
    where: "Ideen",
    note: "Richten sich nach eurem Reiseprofil aus den Einstellungen. Ungeprüfte Anregungen, keine Empfehlungen.",
  },
  {
    title: "Inventar für den Schadensfall",
    where: "Packliste",
    note: "Fotos pro Gegenstand, exportierbar als eine Datei, die ohne App und ohne Netz lesbar bleibt. Kein KI-Einsatz — reines Festhalten.",
  },
  {
    title: "Kosten schätzen",
    where: "Plan · Essen pro Tag",
    note: "Größenordnung als Spanne, nie als exakter Betrag.",
  },
];

const LIMITS = [
  "Nichts wird automatisch übernommen — du bestätigst jedes Feld.",
  "Was nicht erkannt wird, bleibt leer statt geraten zu werden.",
  "Alles läuft über unseren Server; der Schlüssel liegt nie auf deinem Gerät.",
  "Ohne Netz bleibt alles andere nutzbar — nur diese vier brauchen Verbindung.",
];

export function AiFeatures() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-3xl bg-card p-4" style={{ boxShadow: "var(--shadow-soft)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <Sparkles className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 text-[0.95rem] font-semibold leading-snug">
          Was kialia für dich übernimmt
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-3">
          <ul className="space-y-2.5">
            {FEATURES.map((f) => (
              <li key={f.title} className="rounded-2xl bg-secondary/40 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold">{f.title}</span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {f.where}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{f.note}</p>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs font-semibold">Wo die Grenze verläuft</p>
          <ul className="mt-1 space-y-1">
            {LIMITS.map((l) => (
              <li key={l} className="flex gap-1.5 text-xs leading-snug text-muted-foreground">
                <span aria-hidden>·</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
