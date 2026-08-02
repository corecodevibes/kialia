import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lightbulb, Plus, Trash2 } from "lucide-react";
import { AppShell, Card, inputClass } from "@/components/app/AppShell";
import { LinkList } from "@/components/app/bits";
import { uid, useTrip, type LinkItem } from "@/lib/trip-store";

export const Route = createFileRoute("/ideen")({
  head: () => ({
    meta: [
      { title: "Ideensammlung – TraveliVibes" },
      {
        name: "description",
        content:
          "Sammle frei alle Reiseideen und speichere Links zu Touren, Restaurants und Unterkünften direkt unter jeder Idee.",
      },
      { property: "og:title", content: "Ideensammlung – TraveliVibes" },
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
  const { trip, update, ready } = useTrip();
  const [text, setText] = useState("");

  function add() {
    if (!text.trim()) return;
    update({ ideas: [{ id: uid(), text: text.trim(), links: [] }, ...trip.ideas] });
    setText("");
  }

  const setLinks = (id: string, links: LinkItem[]) =>
    update({ ideas: trip.ideas.map((i) => (i.id === id ? { ...i, links } : i)) });

  if (!ready) return <div className="min-h-screen bg-background" />;

  return (
    <AppShell title="Ideensammlung" subtitle="Alles, was ihr sehen, essen und erleben wollt.">
      <div className="space-y-4">
        <Card>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Was wäre eine Idee? Ganz frei reinschreiben …"
            className={`${inputClass} resize-y`}
          />
          <button
            type="button"
            onClick={add}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="size-4" /> Idee sammeln
          </button>
        </Card>

        {trip.ideas.map((idea) => (
          <Card key={idea.id}>
            <div className="flex items-start justify-between gap-3">
              <p className="whitespace-pre-wrap text-sm font-medium leading-snug">{idea.text}</p>
              <button
                type="button"
                aria-label="Idee löschen"
                onClick={() => update({ ideas: trip.ideas.filter((i) => i.id !== idea.id) })}
              >
                <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
            <div className="mt-3">
              <LinkList links={idea.links} onChange={(l) => setLinks(idea.id, l)} />
            </div>
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
