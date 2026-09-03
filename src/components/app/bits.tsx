import { useState } from "react";
import { ExternalLink, Link2, Plus, Trash2 } from "lucide-react";
import {
  normalizeUrl,
  statusLabels,
  uid,
  type LinkItem,
  type PayStatus,
  safeHref,
} from "@/lib/trip-store";
import { inputClass } from "./AppShell";

export function LinkList({
  links,
  onChange,
  placeholder = "Link einfügen",
}: {
  links: LinkItem[];
  onChange: (links: LinkItem[]) => void;
  placeholder?: string;
}) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  function add() {
    const clean = normalizeUrl(url);
    if (!clean) return;
    onChange([
      ...links,
      { id: uid(), label: label.trim() || clean.replace(/^https?:\/\//, ""), url: clean },
    ]);
    setUrl("");
    setLabel("");
  }

  return (
    <div className="space-y-2">
      {links.map((l) => (
        <div key={l.id} className="flex items-center gap-2 rounded-xl bg-secondary/50 px-3 py-2">
          <Link2 className="size-4 shrink-0 text-primary" />
          <a
            href={safeHref(l.url)}
            target="_blank"
            rel="noreferrer noopener"
            className="min-w-0 flex-1 truncate text-sm font-medium underline-offset-2 hover:underline"
          >
            {l.label}
          </a>
          <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
          <button
            type="button"
            aria-label="Link entfernen"
            onClick={() => onChange(links.filter((x) => x.id !== l.id))}
          >
            <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}
      {/* Erst der Link, dann der Name.
          Vorher stand das Namensfeld mit dem grossen Plus OBEN und die
          eigentliche Adresse darunter — es sah aus, als fuege das Plus einen
          Namen hinzu. Man hat aber den Link in der Zwischenablage, nicht den
          Namen; der ist optional und wird sonst aus der Adresse abgeleitet. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={placeholder}
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          className={`${inputClass} col-span-2`}
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Name (optional)"
          className={inputClass}
        />
        <button
          type="button"
          onClick={add}
          disabled={!url.trim()}
          aria-label="Link hinzufügen"
          // Kupfer statt Violett: das hier TUT etwas (Link anlegen). Violett ist in
          // dieser App der ausgewaehlte Zustand — Chips, Radios, aktive Tabs.
          // Ein Knopf, der handelt, gehoert auf die Handlungsfarbe.
          className="btn-warm grid size-11 shrink-0 place-items-center rounded-xl disabled:opacity-40"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function StatusPicker({
  value,
  onChange,
}: {
  value: PayStatus;
  onChange: (v: PayStatus) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {(Object.keys(statusLabels) as PayStatus[]).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`min-w-0 truncate rounded-full border px-2 py-2 text-xs font-medium transition ${
            value === s
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground"
          }`}
        >
          {statusLabels[s]}
        </button>
      ))}
    </div>
  );
}

/**
 * Der Schriftzug. Stand bisher an fuenf Stellen als eigener Absatz mit
 * jeweils eigener Groesse und Schriftstaerke — jede Aenderung musste fuenfmal
 * gemacht werden, und zwei der fuenf waren bereits auseinandergelaufen.
 *
 * Er steht in der Serif des Designsystems, weil der Name das Persoenliche der
 * App ist und nicht ihre Bedienung. Das Trennzeichen traegt die Handlungsfarbe
 * — ein einzelner warmer Punkt, der den lateinischen vom griechischen Teil
 * loest, ohne eine zweite Schrift zu brauchen.
 */
export function Wordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const scale = { sm: "text-xl", md: "text-[1.7rem]", lg: "text-[2.1rem]" }[size];
  return (
    <span className={`display ${scale}`}>
      kialia <span className="text-[var(--clay)]">·</span> κιάλια
    </span>
  );
}

/* ---------------------------------------------------------------------------
   Die Landesflagge, selbst gezeichnet.

   Emoji-Flaggen sind praktisch, aber sie sind der eine Fremdkoerper im
   Design: knallige Systemfarben in einem Bild, das sonst durchgehend auf die
   gedaempfte Palette abgestimmt ist — und auf Android sehen sie anders aus
   als auf iOS.

   Hier entsteht die Flagge als kleine Zeichnung: vereinfachte Geometrie
   (Streifen, Kreuz, Punkt), Farben auf die Palette uebersetzt. Eine Flagge
   muss nicht amtlich sein, um erkannt zu werden — Griechenland liest man am
   Blau-Weiss, Japan am roten Punkt. Erkennung kommt von Anordnung und
   Farbklang, nicht von der Normfarbe.
   --------------------------------------------------------------------------- */

const FLAG_INK: Record<string, string> = {
  r: "#B96A55", // Rot → warmes Ziegelrot
  w: "#F7F1E5", // Weiss → Papier
  b: "#7C89C4", // Blau → Perlblau, vertieft
  d: "#5D6A9E", // Dunkelblau
  g: "#5F8268", // Gruen → Salbei, vertieft
  y: "#DFC17E", // Gelb/Gold → Sand
  o: "#D99A62", // Orange
  k: "#4A443C", // Schwarz → warme Tinte
};

type FlagSpec = {
  /** Streifenrichtung; die meisten Flaggen sind drei Bahnen. */
  dir?: "h" | "v";
  stripes: string[];
  /** Ein Zeichen darueber: Punkt, Kreuz, Nordisches Kreuz, Halbmond, Kanton. */
  emblem?: "dot" | "cross" | "nordic" | "crescent" | "canton";
  emblemColor?: string;
};

const FLAGS: Record<string, FlagSpec> = {
  GR: { stripes: ["b", "w", "b", "w", "b"], emblem: "canton", emblemColor: "b" },
  IT: { dir: "v", stripes: ["g", "w", "r"] },
  ES: { stripes: ["r", "y", "r"] },
  PT: { dir: "v", stripes: ["g", "r", "r"], emblem: "dot", emblemColor: "y" },
  FR: { dir: "v", stripes: ["b", "w", "r"] },
  HR: { stripes: ["r", "w", "b"] },
  AT: { stripes: ["r", "w", "r"] },
  CH: { stripes: ["r"], emblem: "cross", emblemColor: "w" },
  DE: { stripes: ["k", "r", "y"] },
  NL: { stripes: ["r", "w", "b"] },
  BE: { dir: "v", stripes: ["k", "y", "r"] },
  DK: { stripes: ["r"], emblem: "nordic", emblemColor: "w" },
  SE: { stripes: ["b"], emblem: "nordic", emblemColor: "y" },
  NO: { stripes: ["r"], emblem: "nordic", emblemColor: "w" },
  FI: { stripes: ["w"], emblem: "nordic", emblemColor: "d" },
  IS: { stripes: ["d"], emblem: "nordic", emblemColor: "r" },
  IE: { dir: "v", stripes: ["g", "w", "o"] },
  GB: { stripes: ["d"], emblem: "cross", emblemColor: "r" },
  PL: { stripes: ["w", "r"] },
  CZ: { stripes: ["w", "r"], emblem: "dot", emblemColor: "d" },
  HU: { stripes: ["r", "w", "g"] },
  SI: { stripes: ["w", "b", "r"] },
  TR: { stripes: ["r"], emblem: "crescent", emblemColor: "w" },
  MA: { stripes: ["r"], emblem: "dot", emblemColor: "g" },
  EG: { stripes: ["r", "w", "k"], emblem: "dot", emblemColor: "y" },
  ZA: { stripes: ["r", "g", "d"] },
  TZ: { stripes: ["g", "k", "b"] },
  KE: { stripes: ["k", "r", "g"] },
  NA: { stripes: ["d", "r", "g"] },
  US: { stripes: ["r", "w", "r", "w", "r"], emblem: "canton", emblemColor: "d" },
  CA: { dir: "v", stripes: ["r", "w", "r"], emblem: "dot", emblemColor: "r" },
  MX: { dir: "v", stripes: ["g", "w", "r"], emblem: "dot", emblemColor: "o" },
  CR: { stripes: ["b", "w", "r", "w", "b"] },
  BR: { stripes: ["g"], emblem: "dot", emblemColor: "y" },
  AR: { stripes: ["b", "w", "b"], emblem: "dot", emblemColor: "y" },
  CL: { stripes: ["w", "r"], emblem: "canton", emblemColor: "d" },
  PE: { dir: "v", stripes: ["r", "w", "r"] },
  CO: { stripes: ["y", "d", "r"] },
  TH: { stripes: ["r", "w", "d", "w", "r"] },
  VN: { stripes: ["r"], emblem: "dot", emblemColor: "y" },
  ID: { stripes: ["r", "w"] },
  JP: { stripes: ["w"], emblem: "dot", emblemColor: "r" },
  KR: { stripes: ["w"], emblem: "dot", emblemColor: "r" },
  CN: { stripes: ["r"], emblem: "dot", emblemColor: "y" },
  IN: { stripes: ["o", "w", "g"], emblem: "dot", emblemColor: "d" },
  LK: { stripes: ["o", "r"], emblem: "canton", emblemColor: "g" },
  NP: { stripes: ["r"], emblem: "dot", emblemColor: "w" },
  PH: { stripes: ["d", "r"], emblem: "dot", emblemColor: "y" },
  MY: { stripes: ["r", "w", "r", "w"], emblem: "canton", emblemColor: "d" },
  SG: { stripes: ["r", "w"], emblem: "dot", emblemColor: "w" },
  AE: { dir: "v", stripes: ["r", "g", "w"] },
  AU: { stripes: ["d"], emblem: "canton", emblemColor: "d" },
  NZ: { stripes: ["d"], emblem: "dot", emblemColor: "r" },
  MV: { stripes: ["r"], emblem: "crescent", emblemColor: "w" },
  MU: { stripes: ["r", "d", "y", "g"] },
  CU: { stripes: ["d", "w", "d"], emblem: "dot", emblemColor: "r" },
  DO: { stripes: ["d", "w", "r"], emblem: "cross", emblemColor: "w" },
  JM: { stripes: ["g", "y", "k"] },
  GE: { stripes: ["w"], emblem: "cross", emblemColor: "r" },
  AL: { stripes: ["r"], emblem: "dot", emblemColor: "k" },
  ME: { stripes: ["r"], emblem: "dot", emblemColor: "y" },
  CY: { stripes: ["w"], emblem: "dot", emblemColor: "o" },
  MT: { dir: "v", stripes: ["w", "r"] },
};

export function FlagMark({ code, className = "" }: { code: string; className?: string }) {
  const spec = FLAGS[code];
  if (!spec) return null;
  const W = 24;
  const H = 17;
  const c = (k: string) => FLAG_INK[k] ?? "#F7F1E5";
  const n = spec.stripes.length;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`inline-block h-[1em] w-auto shrink-0 rounded-[3px] ${className}`}
      style={{ boxShadow: "inset 0 0 0 1px rgba(58,52,44,0.18)" }}
      aria-hidden
    >
      {spec.stripes.map((k, i) =>
        spec.dir === "v" ? (
          <rect key={i} x={(W / n) * i} y={0} width={W / n + 0.5} height={H} fill={c(k)} />
        ) : (
          <rect key={i} x={0} y={(H / n) * i} width={W} height={H / n + 0.5} fill={c(k)} />
        ),
      )}
      {spec.emblem === "dot" && (
        <circle cx={W / 2} cy={H / 2} r={3.4} fill={c(spec.emblemColor ?? "w")} />
      )}
      {spec.emblem === "cross" && (
        <path
          d={`M${W / 2 - 1.4} 3 h2.8 v${H / 2 - 2.4} h${W / 2 - 4} v2.8 h-${W / 2 - 4} v${H / 2 - 2.4} h-2.8 v-${H / 2 - 2.4} h-${W / 2 - 4} v-2.8 h${W / 2 - 4} z`}
          fill={c(spec.emblemColor ?? "w")}
        />
      )}
      {spec.emblem === "nordic" && (
        <>
          <rect x={7} y={0} width={3.2} height={H} fill={c(spec.emblemColor ?? "w")} />
          <rect x={0} y={H / 2 - 1.6} width={W} height={3.2} fill={c(spec.emblemColor ?? "w")} />
        </>
      )}
      {spec.emblem === "crescent" && (
        <>
          <circle cx={W / 2 - 1} cy={H / 2} r={3.6} fill={c(spec.emblemColor ?? "w")} />
          <circle cx={W / 2 + 0.6} cy={H / 2} r={3} fill={c(spec.stripes[0] ?? "r")} />
        </>
      )}
      {spec.emblem === "canton" && (
        <>
          <rect x={0} y={0} width={W * 0.42} height={H * 0.55} fill={c(spec.emblemColor ?? "d")} />
          {/* Griechenland traegt das Kreuz im Feld — ohne es liest sich das
              gestreifte Blau-Weiss als Kuba. */}
          {code === "GR" && (
            <path
              d="M3.6 1.2 h2 v2.5 h2.5 v2 h-2.5 v2.5 h-2 v-2.5 h-2.5 v-2 h2.5 z"
              fill="#F7F1E5"
            />
          )}
        </>
      )}
    </svg>
  );
}
