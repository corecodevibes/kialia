/**
 * Erraet, ob eine frei geschriebene Idee ein Restaurant, eine Aktivitaet oder
 * etwas anderes ist.
 *
 * Bewusst ohne KI. Eine Idee ist freier Text, und freier Text an ein Modell zu
 * schicken oeffnet genau die Luecke, die wir sonst ueberall geschlossen haben.
 * Der Gewinn waere klein — die Unterscheidung "Essen oder Erlebnis" haengt an
 * einer Handvoll Woerter, nicht an Sprachverstaendnis. Dafuer laeuft es offline,
 * ohne Wartezeit, und niemand muss ihm vertrauen.
 *
 * Das Ergebnis ist ein Vorschlag, keine Entscheidung: die Oberflaeche fragt
 * nach. Ein falsch einsortierter Eintrag, den man nicht korrigieren kann,
 * aergert mehr als gar keine Sortierung.
 */
export type IdeaKind = "restaurant" | "aktivitaet" | "sonstiges";

export const IDEA_KIND_LABELS: Record<IdeaKind, string> = {
  restaurant: "Essen & Trinken",
  aktivitaet: "Aktivität",
  sonstiges: "Sonstiges",
};

const FOOD = [
  "restaurant",
  "taverne",
  "taverna",
  "essen",
  "abendessen",
  "mittagessen",
  "frühstück",
  "fruehstueck",
  "brunch",
  "bar",
  "cafe",
  "café",
  "kaffee",
  "bistro",
  "trattoria",
  "osteria",
  "pizzeria",
  "pizza",
  "sushi",
  "burger",
  "grill",
  "bäckerei",
  "baeckerei",
  "eisdiele",
  "gelateria",
  "eis essen",
  "wein",
  "weingut",
  "cocktail",
  "streetfood",
  "street food",
  "food market",
  "markt essen",
  "souvlaki",
  "gyros",
  "meze",
  "tapas",
  "dinner",
  "lunch",
  "kulinarisch",
  "schlemmen",
];

const ACTIVITY = [
  "wandern",
  "wanderung",
  "hike",
  "trail",
  "schlucht",
  "strand",
  "beach",
  "bucht",
  "schnorcheln",
  "tauchen",
  "boot",
  "bootstour",
  "segeln",
  "kajak",
  "tour",
  "ausflug",
  "besichtigen",
  "besichtigung",
  "museum",
  "kloster",
  "kirche",
  "palast",
  "ruine",
  "ausgrabung",
  "burg",
  "festung",
  "altstadt",
  "markt",
  "aussicht",
  "sonnenuntergang",
  "wasserfall",
  "höhle",
  "hoehle",
  "quad",
  "roller",
  "mieten",
  "workshop",
  "kurs",
  "konzert",
  "festival",
  "schwimmen",
  "baden",
  "spaziergang",
  "radtour",
  "klettern",
  "reiten",
  "park",
  "zoo",
  "therme",
  "spa",
];

/** Domains, die fuer sich schon verraten, worum es geht. */
const HOST_HINTS: { needle: string; kind: IdeaKind }[] = [
  { needle: "getyourguide", kind: "aktivitaet" },
  { needle: "viator", kind: "aktivitaet" },
  { needle: "tripadvisor", kind: "aktivitaet" },
  { needle: "komoot", kind: "aktivitaet" },
  { needle: "alltrails", kind: "aktivitaet" },
  { needle: "opentable", kind: "restaurant" },
  { needle: "thefork", kind: "restaurant" },
  { needle: "quandoo", kind: "restaurant" },
];

export type KindGuess = { kind: IdeaKind; sure: boolean };

/**
 * `sure` sagt, ob die Oberflaeche den Vorschlag stillschweigend setzen darf
 * oder besser nachfragt. Bei Gleichstand oder ganz ohne Treffer ist die
 * ehrliche Antwort "weiss nicht" — dann fragen wir.
 */
export function guessIdeaKind(text: string, urls: string[] = []): KindGuess {
  const hay = ` ${(text ?? "").toLowerCase()} `;

  const hits = (words: string[]) => words.filter((w) => hay.includes(w)).length;
  const food = hits(FOOD);
  const act = hits(ACTIVITY);

  // Steht auf beiden Seiten etwas, ist die Idee vermutlich beides
  // ("Taverne am Strand, danach schwimmen"). Dann entscheidet die App nicht
  // still, sondern fragt — ausser eine Seite ueberwiegt deutlich.
  if (food > 0 && act > 0) {
    const kind: IdeaKind = food >= act ? "restaurant" : "aktivitaet";
    return { kind, sure: Math.abs(food - act) >= 2 };
  }
  if (food > 0) return { kind: "restaurant", sure: true };
  if (act > 0) return { kind: "aktivitaet", sure: true };

  // Kein einziges Wort getroffen — die Links duerfen entscheiden.
  const host = urls.join(" ").toLowerCase();
  for (const h of HOST_HINTS) {
    if (host.includes(h.needle)) return { kind: h.kind, sure: true };
  }

  return { kind: "sonstiges", sure: false };
}
