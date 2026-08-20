import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lightbulb, Plus } from "lucide-react";
import { AppShell, Card, CardTitle, DeleteButton, PrimaryButton, inputClass } from "@/components/app/AppShell";
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
