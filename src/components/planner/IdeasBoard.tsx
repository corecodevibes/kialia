import { useState } from "react";
import { Lightbulb, Plus, Trash2 } from "lucide-react";
import { uid, type Trip } from "@/lib/trip-store";

const categories = ["Sehenswürdigkeit", "Essen", "Aktivität", "Unterkunft", "Geheimtipp"] as const;

export function IdeasBoard({ trip, update }: { trip: Trip; update: (p: Partial<Trip>) => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Sehenswürdigkeit");


  function add() {
    if (!title.trim()) return;
    update({ ideas: [{ id: uid(), title: title.trim(), category, note: "" }, ...trip.ideas] });
    setTitle("");
  }

  return (
    <div className="rounded-3xl bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
      <div className="flex flex-wrap gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Idee, Link oder Geheimtipp …"
          className="min-w-[220px] flex-1 rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2.5"
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="size-4" /> Sammeln
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {trip.ideas.map((idea) => (
          <article key={idea.id} className="rounded-2xl border border-border bg-secondary/30 p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="rounded-full bg-accent/30 px-2.5 py-0.5 text-[11px] font-medium">
                {idea.category}
              </span>
              <button
                type="button"
                onClick={() => update({ ideas: trip.ideas.filter((i) => i.id !== idea.id) })}
                aria-label="Idee löschen"
              >
                <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
            <p className="mt-2 font-medium leading-snug">{idea.title}</p>
            <textarea
              value={idea.note}
              onChange={(e) =>
                update({
                  ideas: trip.ideas.map((i) => (i.id === idea.id ? { ...i, note: e.target.value } : i)),
                })
              }
              placeholder="Notiz …"
              rows={2}
              className="mt-2 w-full resize-none rounded-lg border border-transparent bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </article>
        ))}
        {trip.ideas.length === 0 && (
          <p className="col-span-full flex items-center gap-2 rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground">
            <Lightbulb className="size-4" /> Sammle hier alles, was ihr sehen und erleben wollt.
          </p>
        )}
      </div>
    </div>
  );
}
