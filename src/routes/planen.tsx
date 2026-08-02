import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Link2, Map, Lightbulb, Wallet, BookOpen } from "lucide-react";
import { useTrip, styleLabels } from "@/lib/trip-store";
import { RouteBoard } from "@/components/planner/RouteBoard";
import { IdeasBoard } from "@/components/planner/IdeasBoard";
import { BudgetBoard } from "@/components/planner/BudgetBoard";
import { DiaryBoard } from "@/components/planner/DiaryBoard";

export const Route = createFileRoute("/planen")({
  head: () => ({
    meta: [
      { title: "Reise planen – Route, Ideen, Budget & Tagebuch" },
      {
        name: "description",
        content:
          "Plane Etappen, sammle Ideen, kalkuliere dein Budget und halte jeden Reisetag im Tagebuch fest.",
      },
      { property: "og:title", content: "Reise planen – Route, Budget & Tagebuch" },
      {
        property: "og:description",
        content: "Etappen, Ideen, Ausgabenplan und Reisetagebuch an einem Ort.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Planner,
});

const tabs = [
  { key: "route", label: "Route", icon: Map },
  { key: "ideen", label: "Ideen", icon: Lightbulb },
  { key: "budget", label: "Budget", icon: Wallet },
  { key: "tagebuch", label: "Tagebuch", icon: BookOpen },
] as const;

function Planner() {
  const { trip, update, ready } = useTrip();
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("route");
  const [copied, setCopied] = useState(false);

  if (!ready) return <div className="min-h-screen bg-background" />;

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="relative overflow-hidden px-6 pb-24 pt-8 print:hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-sky)" }} />
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-sm font-medium backdrop-blur"
          >
            <ArrowLeft className="size-4" /> Ziel ändern
          </Link>
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-sm font-medium backdrop-blur"
          >
            <Link2 className="size-4" /> {copied ? "Link kopiert" : "Mit Partner teilen"}
          </button>
        </div>
        <div className="mx-auto mt-8 max-w-6xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-background/90">
            {trip.style ? styleLabels[trip.style] : "Reise"}
          </p>
          <h1 className="mt-1 text-4xl font-semibold text-background sm:text-5xl">
            {trip.destination || "Deine Reise"}
          </h1>
        </div>
      </header>

      <div className="mx-auto -mt-16 max-w-6xl px-6 pb-20">
        <nav
          className="mb-6 flex flex-wrap gap-2 rounded-3xl bg-card p-2 print:hidden"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                tab === key ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
              }`}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </nav>

        {tab === "route" && <RouteBoard trip={trip} update={update} />}
        {tab === "ideen" && <IdeasBoard trip={trip} update={update} />}
        {tab === "budget" && <BudgetBoard trip={trip} update={update} />}
        {tab === "tagebuch" && <DiaryBoard trip={trip} update={update} />}
      </div>
    </main>
  );
}
