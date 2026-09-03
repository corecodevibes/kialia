/**
 * Ausgaben aus einem Satz lesen.
 *
 * Der schnellste Weg, abends Ausgaben zu erfassen, ist kein Formular, sondern
 * ein Satz: "Taverne 45, Taxi 8, Souvenirs 15". So erinnert man einen Tag, und
 * so tippt man ihn auch. Ein Zahlenfeld pro Posten bedeutet Antippen, Tippen,
 * Bestaetigen — dreimal so viele Handgriffe.
 *
 * BEWUSST OHNE KI: Betraege sind Zahlen, Kategorien sind Woerter. Beides
 * erkennt ein Regelwerk zuverlaessig, sofort und offline. Ein Sprachmodell
 * waere hier langsamer, kostete Geld und waere im Funkloch tot — genau dann,
 * wenn man unterwegs etwas eintraegt.
 *
 * WAS NICHT ERKANNT WIRD, WIRD NICHT GERATEN: ohne Betrag entsteht kein
 * Posten, ohne passendes Wort bleibt die Kategorie "Sonstiges". Der Nutzer
 * sieht jede Zeile und kann sie antippen.
 */

export type ExpenseCategory =
  "essen" | "transport" | "unterkunft" | "aktivitaet" | "einkauf" | "sonstiges";

export type ParsedExpense = {
  label: string;
  amount: number;
  category: ExpenseCategory;
};

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  essen: "Essen",
  transport: "Transport",
  unterkunft: "Unterkunft",
  aktivitaet: "Aktivität",
  einkauf: "Einkauf",
  sonstiges: "Sonstiges",
};

/**
 * Farben der Ausgabenarten — dieselbe gedaempfte Familie wie die
 * Personenfarben, damit eine Aufstellung nicht zur Ampel wird.
 *
 * Vorher standen hier gesaettigte Toene. Sie waren gut unterscheidbar, aber
 * die lautesten Flaechen des Bildschirms markierten damit die
 * nebensaechlichste Angabe. Alle sechs tragen die Tinte mit ueber 6:1.
 */
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  essen: "#E3B392",
  transport: "#AEB6D8",
  unterkunft: "#CDB3C2",
  aktivitaet: "#DCCFA0",
  einkauf: "#E0C79A",
  sonstiges: "#C9C3B6",
};

const KEYWORDS: Record<Exclude<ExpenseCategory, "sonstiges">, string[]> = {
  essen: [
    "taverne",
    "restaurant",
    "cafe",
    "café",
    "bar",
    "essen",
    "mittag",
    "abend",
    "frühstück",
    "fruehstueck",
    "snack",
    "eis",
    "bäcker",
    "baecker",
    "pizza",
    "souvlaki",
    "gyros",
    "wein",
    "bier",
    "kaffee",
    "brunch",
    "imbiss",
    "kiosk",
    "trinken",
    "cocktail",
    "dinner",
    "lunch",
  ],
  transport: [
    "taxi",
    "bus",
    "bahn",
    "zug",
    "fähre",
    "faehre",
    "metro",
    "uber",
    "bolt",
    "benzin",
    "tanken",
    "parken",
    "parkplatz",
    "mietwagen",
    "roller",
    "scooter",
    "flug",
    "transfer",
    "ticket bus",
    "maut",
    "vignette",
  ],
  unterkunft: [
    "hotel",
    "hostel",
    "airbnb",
    "zimmer",
    "camping",
    "pension",
    "apartment",
    "unterkunft",
  ],
  aktivitaet: [
    "tour",
    "eintritt",
    "museum",
    "tauchen",
    "wandern",
    "boot",
    "ausflug",
    "guide",
    "kurs",
    "massage",
    "spa",
    "konzert",
    "eintrittskarte",
    "safari",
    "schnorcheln",
  ],
  einkauf: [
    "souvenir",
    "shop",
    "laden",
    "markt",
    "supermarkt",
    "apotheke",
    "kleidung",
    "einkauf",
    "mitbringsel",
  ],
};

function fold(v: string): string {
  return v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Ordnet einen Text einer Kategorie zu — oder "sonstiges", wenn nichts passt. */
export function categorize(label: string): ExpenseCategory {
  const text = fold(label);
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => text.includes(fold(w)))) return cat as ExpenseCategory;
  }
  return "sonstiges";
}

/**
 * Liest Posten aus freiem Text.
 *
 * Getrennt wird an Komma, Semikolon, Zeilenumbruch und " und " — Menschen
 * schreiben alle vier. Der Betrag ist die LETZTE Zahl im Abschnitt: bei
 * "2 Bier 12" sind die 12 gemeint, nicht die 2.
 */
export function parseExpenses(text: string): ParsedExpense[] {
  // Das Komma ist im Deutschen BEIDES: Trennzeichen zwischen Posten und
  // Dezimaltrenner im Betrag. "Kaffee 4,50" waere sonst "Kaffee 4" und "50".
  // Ein Komma direkt zwischen Ziffern ist immer ein Dezimaltrenner — dort wird
  // es vorher zum Punkt, danach kann gefahrlos getrennt werden.
  const guarded = (text ?? "").replace(/(\d),(\d{1,2})(?!\d)/g, "$1.$2");

  const parts = guarded
    .split(/[,;\n]|\s+und\s+/gi)
    .map((p) => p.trim())
    .filter(Boolean);

  const out: ParsedExpense[] = [];
  for (const part of parts) {
    const numbers = [...part.matchAll(/(\d+(?:[.,]\d{1,2})?)/g)];
    if (!numbers.length) continue;

    const last = numbers[numbers.length - 1]!;
    const amount = Number(last[1]!.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const label = (part.slice(0, last.index) + part.slice(last.index! + last[0].length))
      // Waehrungen als GANZE Woerter entfernen, nicht als Zeichenklasse.
      //
      // Vorher stand hier /[€$£chf]/gi — eine Zeichenklasse. Die loescht jedes
      // einzelne c, h und f aus dem Text. Aus "Fruehstueck Chania" wurde
      // "ruestueck ania", aus "Saft" wurde "Sat". Steffen ist es auf Kreta
      // aufgefallen; er hatte sogar den richtigen Verdacht.
      //
      // Symbole duerfen weiterhin ueberall stehen, Buchstabenkuerzel nur als
      // eigenstaendiges Wort.
      .replace(/[€$£¥]/g, "")
      .replace(/\b(chf|eur|usd|gbp|euro|franken|dollar|pfund)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    out.push({ label: label || "Ausgabe", amount, category: categorize(label) });
  }
  return out;
}

/** Summe der erkannten Posten. */
export function expensesTotal(items: ParsedExpense[]): number {
  return items.reduce((s, i) => s + i.amount, 0);
}
