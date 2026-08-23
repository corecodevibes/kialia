import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Lightbulb, Plus } from "lucide-react";
import {
  AppShell,
  Card,
  CardTitle,
  DeleteButton,
  PrimaryButton,
  inputClass,
  NoTripYet,
} from "@/components/app/AppShell";
import { LinkList } from "@/components/app/bits";
import { fetchIdeas, IDEA_CATEGORY_LABELS, type Idea as Suggestion } from "@/lib/suggestions";
import { normalizeUrl, uid, useTrip, type Idea, type LinkItem, tripDays } from "@/lib/trip-store";

export const Route = createFileRoute("/ideen")({
  head: () => ({
    meta: [
      { title: "Ideensammlung – kialia" },
      {
        name: "description",
        content:
          "Sammle frei alle Reiseideen und speichere Links zu Touren, Restaurants und Unterkünften direkt unter jeder Idee.",
      },
      { property: "og:title", content: "Ideensammlung – kialia" },
      {
        property: "og:description",
        content: "Ideen notieren und Links zu Touren, Restaurants und Unterkünften speichern.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IdeasTab,
});

function IdeasTab() {
  const { trip, update, ready, hasTrip } = useTrip();
  const [text, setText] = useState("");
  const [moved, setMoved] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sugBusy, setSugBusy] = useState(false);
  const [sugError, setSugError] = useState<string | null>(null);

  function add() {
    if (!text.trim()) return;
    update({ ideas: [{ id: uid(), text: text.trim(), links: [] }, ...trip.ideas] });
    setText("");
  }

  const setLinks = (id: string, links: LinkItem[]) =>
    update({ ideas: trip.ideas.map((i) => (i.id === id ? { ...i, links } : i)) });

  /**
   * Idee in den Plan uebernehmen.
   *
   * Die Sammlung hatte bisher keinen Ausgang — kein einziger Verweis auf Plan,
   * Aktivitaeten oder Unterkuenfte. Eine Sammelstelle ohne Ausgang fuellt sich
   * einmal und wird nie wieder geoeffnet.
   *
   * Die Idee wird bewusst verschoben, nicht kopiert: sonst steht dieselbe Sache
   * an zwei Orten und niemand weiss, welche gilt.
   */
  function toPlan(idea: Idea) {
    update({
      ideas: trip.ideas.filter((i) => i.id !== idea.id),
      activities: [
        ...trip.activities,
        {
          id: uid(),
          name: idea.text.trim().slice(0, 120),
          address: "",
          url: normalizeUrl(idea.links[0]?.url ?? ""),
          cost: 0,
          status: "offen",
          dueDate: "",
        },
      ],
    });
    setMoved(idea.text.trim().slice(0, 60));
  }

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!hasTrip) return <NoTripYet what="Eine Ideensammlung" />;

  return (
    <AppShell title="Ideen" subtitle="Alles, was ihr sehen, essen und erleben wollt.">
      <div className="space-y-4">
        {moved && (
          <p role="status" className="rounded-2xl bg-secondary px-4 py-3 text-sm">
            „{moved}“ steht jetzt unter <span className="font-semibold">Plan → Aktivitäten</span>.
          </p>
        )}

        <Card>
          <CardTitle>Neue Idee</CardTitle>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Was wäre eine Idee? Ganz frei reinschreiben …"
            className={`${inputClass} mt-3 resize-y`}
          />
          <PrimaryButton onClick={add} className="mt-2">
            <Plus className="size-4" /> Idee sammeln
          </PrimaryButton>
        </Card>

        {/* Vorschläge fürs Ziel. Bewusst als Angebot beschriftet: ein
            Sprachmodell kennt die heutige Qualität eines Ortes nicht. Was es
            kann, ist bekannte Orte nennen — und genau das hilft, wenn die
            Sammlung leer ist. */}
        <Card>
          <CardTitle>Vorschläge für {trip.destination}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Ungeprüfte Anregungen, keine Empfehlungen. Was passt, übernimmst du in eure Sammlung.
          </p>

          <button
            type="button"
            onClick={async () => {
              setSugBusy(true);
              setSugError(null);
              const res = await fetchIdeas(
                trip.destination,
                undefined,
                tripDays(trip) || undefined,
              );
              setSugBusy(false);
              if (res.ok) setSuggestions(res.data.ideas);
              else setSugError(res.error);
            }}
            disabled={sugBusy || !trip.destination.trim()}
            className="mt-3 w-full rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold transition hover:bg-secondary/70 disabled:opacity-60"
          >
            {sugBusy
              ? "Wird geholt …"
              : suggestions.length
                ? "Neue Vorschläge"
                : "Vorschläge holen"}
          </button>

          {sugError && <p className="mt-2 text-xs text-destructive">{sugError}</p>}

          {suggestions.length > 0 && (
            <ul className="mt-3 space-y-2">
              {suggestions.map((sug, i) => (
                <li key={`${sug.title}-${i}`} className="rounded-2xl bg-secondary/50 p-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold">
                      {IDEA_CATEGORY_LABELS[sug.category] ?? sug.category}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{sug.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{sug.why}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      update({
                        ideas: [
                          ...trip.ideas,
                          { id: uid(), text: `${sug.title} — ${sug.why}`, links: [] },
                        ],
                      });
                      setSuggestions((prev) => prev.filter((_, j) => j !== i));
                    }}
                    className="mt-2 w-full rounded-xl bg-card py-2 text-xs font-semibold"
                  >
                    In die Sammlung
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {trip.ideas.map((idea) => (
          <Card key={idea.id}>
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm font-medium leading-snug">
                {idea.text}
              </p>
              <DeleteButton
                ariaLabel="Idee löschen"
                onClick={() => update({ ideas: trip.ideas.filter((i) => i.id !== idea.id) })}
              />
            </div>
            <div className="mt-3">
              <LinkList links={idea.links} onChange={(l) => setLinks(idea.id, l)} />
            </div>
            <button
              type="button"
              onClick={() => toPlan(idea)}
              disabled={!idea.text.trim()}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-secondary py-2.5 text-xs font-semibold transition hover:bg-secondary/70 disabled:opacity-50"
            >
              <ArrowRight className="size-3.5" /> In den Plan übernehmen
            </button>
          </Card>
        ))}

        {trip.ideas.length === 0 && (
          <p className="flex items-center gap-2 rounded-3xl border border-dashed border-border p-8 text-sm text-muted-foreground">
            <Lightbulb className="size-4" /> Noch keine Ideen – schreib einfach los.
          </p>
        )}
      </div>
    </AppShell>
  );
}
