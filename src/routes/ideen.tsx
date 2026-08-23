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
import { normalizeUrl, uid, useTrip, type Idea, type LinkItem } from "@/lib/trip-store";

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
    <AppShell title="Ideensammlung" subtitle="Alles, was ihr sehen, essen und erleben wollt.">
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
