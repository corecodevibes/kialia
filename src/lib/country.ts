/**
 * Zielort → Land → Flagge.
 *
 * Bewusst eine Tabelle statt eines Dienstes: die App muss im Flugmodus
 * funktionieren, und eine Flagge, die auf das Netz wartet, ist keine Flagge.
 *
 * Die Emoji-Flagge entsteht aus zwei Regional-Indicator-Zeichen des
 * ISO-Ländercodes — kein Bild, keine Lizenz, skaliert verlustfrei und wird
 * auf iOS als echte Flagge gezeichnet.
 *
 * Wenn wir das Land nicht erkennen, geben wir NICHTS zurück statt zu raten.
 * Eine falsche Flagge ist schlimmer als keine.
 */

/** ISO-3166-1-alpha-2 → deutsche und gebräuchliche Schreibweisen. */
const COUNTRIES: Record<string, string[]> = {
  GR: ["griechenland", "greece", "kreta", "crete", "rhodos", "korfu", "santorini", "athen"],
  IT: ["italien", "italy", "sizilien", "sardinien", "toskana", "rom", "mailand", "venedig"],
  ES: ["spanien", "spain", "mallorca", "ibiza", "kanaren", "teneriffa", "barcelona", "madrid"],
  PT: ["portugal", "madeira", "azoren", "lissabon", "porto", "algarve"],
  FR: ["frankreich", "france", "korsika", "paris", "provence", "nizza"],
  HR: ["kroatien", "croatia", "istrien", "dalmatien", "split", "dubrovnik"],
  AT: ["österreich", "oesterreich", "austria", "tirol", "wien", "salzburg"],
  CH: ["schweiz", "switzerland", "suisse", "wallis", "graubünden", "zürich", "zurich"],
  DE: ["deutschland", "germany", "bayern", "berlin", "hamburg", "münchen", "muenchen"],
  NL: ["niederlande", "netherlands", "holland", "amsterdam"],
  BE: ["belgien", "belgium", "brüssel"],
  DK: ["dänemark", "daenemark", "denmark", "kopenhagen"],
  SE: ["schweden", "sweden", "stockholm", "lappland"],
  NO: ["norwegen", "norway", "lofoten", "oslo", "tromsø", "tromso"],
  FI: ["finnland", "finland", "helsinki"],
  IS: ["island", "iceland", "reykjavik", "reykjavík"],
  IE: ["irland", "ireland", "dublin"],
  GB: [
    "england",
    "schottland",
    "scotland",
    "wales",
    "grossbritannien",
    "großbritannien",
    "uk",
    "london",
    "united kingdom",
  ],
  PL: ["polen", "poland", "krakau", "warschau"],
  CZ: ["tschechien", "czechia", "prag", "prague"],
  HU: ["ungarn", "hungary", "budapest"],
  SI: ["slowenien", "slovenia", "ljubljana"],
  TR: ["türkei", "tuerkei", "turkey", "istanbul", "antalya", "kappadokien"],
  MA: ["marokko", "morocco", "marrakesch", "marrakech"],
  EG: ["ägypten", "aegypten", "egypt", "kairo", "hurghada"],
  ZA: ["südafrika", "suedafrika", "south africa", "kapstadt", "cape town"],
  TZ: ["tansania", "tanzania", "sansibar", "zanzibar", "kilimandscharo"],
  KE: ["kenia", "kenya", "nairobi"],
  NA: ["namibia", "windhoek"],
  US: [
    "usa",
    "vereinigte staaten",
    "united states",
    "amerika",
    "kalifornien",
    "california",
    "new york",
    "florida",
    "hawaii",
  ],
  CA: ["kanada", "canada", "vancouver", "toronto"],
  MX: ["mexiko", "mexico", "yucatan", "yucatán"],
  CR: ["costa rica"],
  BR: ["brasilien", "brazil", "rio"],
  AR: ["argentinien", "argentina", "patagonien", "buenos aires"],
  CL: ["chile", "santiago"],
  PE: ["peru", "cusco", "machu picchu", "lima"],
  CO: ["kolumbien", "colombia", "bogota", "bogotá"],
  TH: ["thailand", "bangkok", "phuket", "koh samui", "chiang mai"],
  VN: ["vietnam", "hanoi", "saigon", "ho chi minh"],
  ID: ["indonesien", "indonesia", "bali", "java", "lombok"],
  JP: ["japan", "tokio", "tokyo", "kyoto", "osaka"],
  KR: ["südkorea", "suedkorea", "south korea", "seoul"],
  CN: ["china", "peking", "beijing", "shanghai"],
  IN: ["indien", "india", "goa", "kerala", "delhi", "rajasthan"],
  LK: ["sri lanka", "colombo"],
  NP: ["nepal", "kathmandu", "himalaya"],
  PH: ["philippinen", "philippines", "palawan"],
  MY: ["malaysia", "borneo", "kuala lumpur"],
  SG: ["singapur", "singapore"],
  AE: ["dubai", "vae", "emirate", "abu dhabi", "united arab emirates"],
  AU: ["australien", "australia", "sydney", "melbourne", "queensland"],
  NZ: ["neuseeland", "new zealand", "auckland"],
  MV: ["malediven", "maldives"],
  MU: ["mauritius"],
  CU: ["kuba", "cuba", "havanna"],
  DO: ["dominikanische republik", "dominican republic", "punta cana"],
  JM: ["jamaika", "jamaica"],
  GE: ["georgien", "georgia", "tiflis"],
  AL: ["albanien", "albania"],
  ME: ["montenegro", "kotor"],
  CY: ["zypern", "cyprus"],
  MT: ["malta"],
};

/** Diakritika entfernen und normalisieren, damit "Türkei" und "Tuerkei" treffen. */
function fold(v: string): string {
  return v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").trim();
}

const LOOKUP: Map<string, string> = new Map();
for (const [code, names] of Object.entries(COUNTRIES)) {
  for (const n of names) LOOKUP.set(fold(n), code);
}

/**
 * Erkennt den Ländercode aus einer freien Zielangabe.
 *
 * Sucht wortweise, damit "Rundreise Kreta & Athen" ebenso trifft wie "Kreta".
 * Mehrwortnamen ("costa rica", "sri lanka") werden zuerst geprüft.
 */
export function countryCodeFor(destination: string): string | null {
  const text = fold(destination ?? "");
  if (!text) return null;

  for (const [name, code] of LOOKUP) {
    if (name.includes(" ") && text.includes(name)) return code;
  }
  for (const word of text.split(/[^a-z]+/).filter(Boolean)) {
    const hit = LOOKUP.get(word);
    if (hit) return hit;
  }
  return null;
}

/** Emoji-Flagge aus dem Ländercode, oder "" wenn wir das Land nicht kennen. */
export function flagFor(destination: string): string {
  const code = countryCodeFor(destination);
  if (!code) return "";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
