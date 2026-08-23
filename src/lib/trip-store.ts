import { useCallback, useSyncExternalStore } from "react";

export type PayStatus = "offen" | "reserviert" | "bezahlt";

export type LinkItem = { id: string; label: string; url: string };

export type Idea = {
  id: string;
  text: string;
  links: LinkItem[];
};

export type Transport = {
  id: string;
  mode: string;
  label: string;
  cost: number;
  status: PayStatus;
  /** Wann bezahlt sein muss. */
  dueDate: string;
  /** Wann tatsaechlich gereist wird. Ohne das laesst sich ein Flug nicht in
      den Reiseverlauf einordnen — dueDate ist die Zahlung, nicht die Fahrt. */
  date: string;
  note: string;
  url: string;
};

export type Board = "nichts" | "fruehstueck" | "halbpension" | "vollpension" | "wohnung";

export type Stay = {
  id: string;
  name: string;
  /** Freie Ortsangabe fuer die Karten-App. */
  address: string;
  url: string;
  from: string;
  to: string;
  cost: number;
  status: PayStatus;
  dueDate: string;
  board: Board;
};

export type Activity = {
  id: string;
  name: string;
  /** Freie Ortsangabe fuer die Karten-App. */
  address: string;
  url: string;
  cost: number;
  status: PayStatus;
  dueDate: string;
};

export type Meals = {
  /** "total": ein Betrag fuer den ganzen Tag. "split": nach Mahlzeiten. */
  mode: "total" | "split";
  /** Gilt nur im Modus "total". */
  perDay: number;
  breakfast: number;
  lunch: number;
  dinner: number;
  snacks: number;
  maxPerDay: number;
};

export type Savings = {
  enabled: boolean;
  saved: number;
  monthsLeft: number;
  credit: number;
};

export type DiaryEntry = {
  id: string;
  day: number;
  date: string;
  text: string;
  highlight: string;
  notes: string;
  expenses: string;
  spent: number;
  /** Was und wo gegessen wurde — auf Reisen die haltbarste Erinnerung. */
  food: string;
  /** Ein Wort statt Sternen — faerbt spaeter den Rueckblick. */
  mood: string;
};

export type PackItem = {
  id: string;
  text: string;
  qty: string;
  done: boolean;
  who: string;
};

export type PackCategory = {
  id: string;
  name: string;
  items: PackItem[];
};

export type Trip = {
  id: string;
  /** Die uuid in Supabase, sobald die Reise dort liegt. Leer = nur lokal. */
  remoteId?: string;
  /** Einladungscode der geteilten Reise. */
  inviteCode?: string;
  /** Stand der zuletzt geladenen Fassung — entscheidet, wer gewinnt. */
  updatedAt?: string;
  destination: string;
  startDate: string;
  endDate: string;
  companions: string;
  travellers: number;
  kids: boolean;
  pets: boolean;
  sports: string;
  ideas: Idea[];
  transports: Transport[];
  stays: Stay[];
  activities: Activity[];
  meals: Meals;
  savings: Savings;
  diary: DiaryEntry[];
  packing: PackCategory[];
};

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function cat(name: string, items: string[]): PackCategory {
  return {
    id: uid(),
    name,
    items: items.map((text) => ({ id: uid(), text, qty: "", done: false, who: "" })),
  };
}

export function defaultPacking(): PackCategory[] {
  return [
    cat("Hygieneartikel", [
      "Zahnbürste & Zahnpasta",
      "Duschgel & Shampoo",
      "Deo",
      "Sonnencreme",
      "Rasierer",
    ]),
    cat("Medikamente / Notfall", [
      "Persönliche Medikamente",
      "Schmerztabletten",
      "Pflaster & Verband",
      "Reiseübelkeit",
      "Elektrolyte",
    ]),
    cat("Kleidung – Jacken & Mäntel", ["Regenjacke", "Übergangsjacke"]),
    cat("Kleidung – Oberteile", ["T-Shirts", "Pullover", "Hemd / Bluse"]),
    cat("Kleidung – Unterteile", ["Hosen", "Shorts", "Rock / Kleid"]),
    cat("Unterwäsche & Socken", ["Unterwäsche", "Socken", "Badesachen"]),
    cat("Schuhe", ["Sneaker", "Sandalen", "Wanderschuhe"]),
    cat("Sportkleidung", ["Sport-Shirt", "Sporthose", "Sportschuhe"]),
    cat("Dokumente & Technik", [
      "Ausweis / Reisepass",
      "Ladekabel",
      "Powerbank",
      "Adapter",
      "Versicherungskarte",
    ]),
    cat("Spielutensilien", ["Kartenspiel", "Buch", "Kopfhörer"]),
  ];
}

export function kidsPacking(): PackCategory {
  return cat("Kinder", [
    "Windeln / Feuchttücher",
    "Lieblingskuscheltier",
    "Snacks",
    "Kindermedikamente",
    "Wechselkleidung",
  ]);
}

export function petsPacking(): PackCategory {
  return cat("Haustiere", [
    "Futter & Napf",
    "Leine & Geschirr",
    "Impfpass",
    "Transportbox",
    "Spielzeug",
  ]);
}

export function newTrip(destination = ""): Trip {
  return {
    id: uid(),
    destination,
    startDate: "",
    endDate: "",
    companions: "",
    travellers: 2,
    kids: false,
    pets: false,
    sports: "",
    ideas: [],
    transports: [],
    stays: [],
    activities: [],
    meals: {
      mode: "split",
      perDay: 0,
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snacks: 0,
      maxPerDay: 100,
    },
    savings: { enabled: false, saved: 0, monthsLeft: 6, credit: 0 },
    diary: [],
    packing: defaultPacking(),
  };
}

export const emptyTrip: Trip = newTrip();

type Store = { trips: Trip[]; activeId: string };

const KEY = "travelivibes.trips.v3";
const LEGACY_KEY = "travelivibes.trip.v2";

function normalize(t: Partial<Trip>): Trip {
  const base = newTrip();
  return {
    ...base,
    ...t,
    id: t.id || base.id,
    meals: {
      ...base.meals,
      ...t.meals,
      mode: t.meals?.mode ?? "split",
      perDay: t.meals?.perDay ?? 0,
    },
    savings: { ...base.savings, ...t.savings },
    packing: t.packing && t.packing.length ? t.packing : base.packing,
    // Gespeicherte Reisen kennen spaeter ergaenzte Felder nicht. Ohne diese
    // Auffuellung waeren sie `undefined` und jede Stelle, die darauf zugreift,
    // muesste das einzeln abfangen.
    transports: (t.transports ?? []).map((x) => ({
      ...x,
      date: x.date ?? "",
      note: x.note ?? "",
      url: x.url ?? "",
    })),
    stays: (t.stays ?? []).map((x) => ({ ...x, address: x.address ?? "" })),
    activities: (t.activities ?? []).map((x) => ({ ...x, address: x.address ?? "" })),
    diary: (t.diary ?? []).map((x) => ({ ...x, mood: x.mood ?? "", food: x.food ?? "" })),
  };
}

export function loadStore(): Store {
  if (typeof window === "undefined") return { trips: [], activeId: "" };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Store>;
      const trips = (parsed.trips ?? []).map(normalize);
      if (trips.length) {
        const activeId = trips.some((t) => t.id === parsed.activeId)
          ? parsed.activeId!
          : trips[0]!.id;
        return { trips, activeId };
      }
    }
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const t = normalize(JSON.parse(legacy) as Partial<Trip>);
      return { trips: [t], activeId: t.id };
    }
  } catch {
    /* ignore */
  }
  // Bewusst LEER statt einer Platzhalter-Reise. Vorher gab es nie den Zustand
  // "noch keine Reise" — deshalb begruesste die App jeden neuen Nutzer mit
  // einer namenlosen Reise ohne Datum, die wie ein Fehler aussieht.
  return { trips: [], activeId: "" };
}

export function saveStore(store: Store) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* Speicher voll oder blockiert */
  }
}

const fallback: Store = { trips: [], activeId: "" };

/* ---------------------------------------------------------------------------
 * Ein geteilter Speicher fuer alle Komponenten
 *
 * Vorher hielt useTrip() den Zustand in useState — jeder Aufruf bekam also
 * seine EIGENE Kopie. Die Kopfzeile und der Bildschirminhalt rufen beide
 * useTrip() auf und wussten nichts voneinander: was man im Formular tippte,
 * erreichte die Kopfzeile nie. Sichtbar wurde das an einer Flagge, die zu
 * einem Ziel gehoerte, das gar nicht mehr eingetragen war.
 * ------------------------------------------------------------------------ */

let current: Store = fallback;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

/** Fuer den Abgleich: auf Aenderungen am Speicher hoeren. */
export function subscribeStore(listener: () => void) {
  return subscribe(listener);
}

/** Der aktuelle Stand, ohne React. */
export function currentStore(): Store {
  ensureLoaded();
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  current = loadStore();
}

export function useTrip() {
  // Beim Rendern auf dem Server bleibt es beim leeren Fallback; im Browser wird
  // einmalig geladen, bevor der erste Snapshot gezogen wird.
  ensureLoaded();
  const store = useSyncExternalStore(
    subscribe,
    () => current,
    () => fallback,
  );
  const ready = loaded;

  const mutate = useCallback((fn: (s: Store) => Store) => {
    current = fn(current);
    saveStore(current);
    emit();
  }, []);

  const update = useCallback(
    (patch: Partial<Trip> | ((t: Trip) => Partial<Trip>)) => {
      mutate((s) => ({
        ...s,
        trips: s.trips.map((t) =>
          t.id === s.activeId ? { ...t, ...(typeof patch === "function" ? patch(t) : patch) } : t,
        ),
      }));
    },
    [mutate],
  );

  const addTrip = useCallback(
    (destination = "") => {
      const t = newTrip(destination);
      mutate((s) => ({ trips: [...s.trips, t], activeId: t.id }));
      return t.id;
    },
    [mutate],
  );

  const removeTrip = useCallback(
    (id: string) => {
      mutate((s) => {
        const trips = s.trips.filter((t) => t.id !== id);
        // Bewusst KEINE Ersatzreise anlegen. Wer die letzte Reise loescht, will
        // zurueck auf Null — nicht eine namenlose neue vorgesetzt bekommen.
        // Dieselbe Falle steckte frueher in loadStore().
        if (!trips.length) return { trips: [], activeId: "" };
        return { trips, activeId: s.activeId === id ? trips[0]!.id : s.activeId };
      });
    },
    [mutate],
  );

  const selectTrip = useCallback((id: string) => mutate((s) => ({ ...s, activeId: id })), [mutate]);

  // Importierte Reise bekommt immer eine neue id, damit ein Import die
  // gleichnamige eigene Reise nicht ueberschreibt.
  const importTrip = useCallback(
    (incoming: Partial<Trip>) => {
      const t = { ...normalize(incoming), id: uid() };
      mutate((s) => ({ trips: [...s.trips, t], activeId: t.id }));
      return t.id;
    },
    [mutate],
  );

  const trip = store.trips.find((t) => t.id === store.activeId) ?? store.trips[0] ?? emptyTrip;
  // Die Bildschirme brauchen immer ein Trip-Objekt, um nicht ueberall auf
  // undefined pruefen zu muessen — aber sie muessen wissen, ob es echt ist.
  const hasTrip = store.trips.length > 0;

  return {
    trip,
    hasTrip,
    trips: store.trips,
    activeId: store.activeId,
    update,
    addTrip,
    removeTrip,
    selectTrip,
    importTrip,
    ready,
  };
}

export function tripDays(trip: Trip) {
  if (!trip.startDate || !trip.endDate) return 0;
  const a = new Date(trip.startDate).getTime();
  const b = new Date(trip.endDate).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  return Math.round((b - a) / 86400000) + 1;
}

export function mealsPerDay(m: Meals) {
  // Nur EINE der beiden Quellen zaehlt. Wer aufteilt und spaeter auf
  // Gesamtbetrag umschaltet, soll nicht ploetzlich beides summiert bekommen —
  // die jeweils andere Eingabe bleibt aber erhalten und ist beim
  // Zurueckschalten wieder da.
  if (m.mode === "total") return m.perDay || 0;
  return (m.breakfast || 0) + (m.lunch || 0) + (m.dinner || 0) + (m.snacks || 0);
}

export function tripTotals(trip: Trip) {
  const days = tripDays(trip);
  const transport = trip.transports.reduce((s, t) => s + (t.cost || 0), 0);
  const stays = trip.stays.reduce((s, t) => s + (t.cost || 0), 0);
  const activities = trip.activities.reduce((s, t) => s + (t.cost || 0), 0);
  const food = mealsPerDay(trip.meals) * days;
  const total = transport + stays + activities + food;
  const paid = [...trip.transports, ...trip.stays, ...trip.activities]
    .filter((i) => i.status === "bezahlt")
    .reduce((s, i) => s + (i.cost || 0), 0);

  // Tatsaechlich ausgegeben kommt AUSSCHLIESSLICH aus dem Tagebuch — eine
  // Quelle, eine Richtung. Es wird bewusst nicht in `total` gemischt: `total`
  // ist der Plan, `actual` ist die Wirklichkeit, und der Vergleich der beiden
  // ist der Grund, warum es diese App gibt.
  const actual = trip.diary.reduce((s, e) => s + (e.spent || 0), 0);
  const actualDays = trip.diary.filter((e) => (e.spent || 0) > 0).length;

  return {
    days,
    transport,
    stays,
    activities,
    food,
    total,
    paid,
    open: Math.max(0, total - paid),
    actual,
    actualDays,
  };
}

export function eur(n: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

export const boardLabels: Record<Board, string> = {
  nichts: "Ohne Verpflegung",
  fruehstueck: "Frühstück",
  halbpension: "Halbpension",
  vollpension: "Vollpension",
  wohnung: "Wohnung / Selbstversorgung",
};

export const statusLabels: Record<PayStatus, string> = {
  offen: "Offen",
  reserviert: "Reserviert",
  bezahlt: "Bezahlt",
};

export function normalizeUrl(url: string) {
  const u = url.trim();
  if (!u) return "";
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

/* ---------------------------------------------------------------------------
 * Sicherung & Weitergabe
 *
 * Solange die Reisedaten ausschliesslich im localStorage liegen, sind sie genau
 * einen geleerten Browser-Cache von der Loeschung entfernt. Export/Import ist
 * die Ueberbrueckung, bis die Daten in Supabase liegen — und gleichzeitig der
 * einzige heute ehrliche Weg, eine Reise an jemanden weiterzugeben.
 * ------------------------------------------------------------------------ */

export const TRIP_FILE_VERSION = 1;

export type TripFile = {
  kind: "kialia.trip";
  version: number;
  exportedAt: string;
  trip: Trip;
};

function safeFileName(name: string) {
  const base = name
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return (base || "reise").toLowerCase().slice(0, 40);
}

export function tripToFile(trip: Trip): TripFile {
  return {
    kind: "kialia.trip",
    version: TRIP_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    trip,
  };
}

/** Loest den Download einer einzelnen Reise als .json aus. */
export function downloadTrip(trip: Trip) {
  const blob = new Blob([JSON.stringify(tripToFile(trip), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kialia-${safeFileName(trip.destination)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Erst nach dem Klick freigeben, sonst bricht der Download in Safari ab.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Sicherung aller Reisen — fuer den Fall, dass der Browser-Speicher wegfaellt. */
export function downloadAllTrips(trips: Trip[]) {
  const payload = {
    kind: "kialia.backup" as const,
    version: TRIP_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    trips,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = new Date().toISOString().slice(0, 10);
  a.download = `kialia-sicherung-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Liest eine exportierte Datei ein. Akzeptiert Einzelreise und Sicherung.
 * Wirft mit einer Meldung, die direkt anzeigbar ist.
 */
export async function readTripFile(file: File): Promise<Partial<Trip>[]> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("Das ist keine gueltige kialia-Datei.");
  }
  const obj = parsed as { kind?: string; trip?: Partial<Trip>; trips?: Partial<Trip>[] };
  if (obj?.kind === "kialia.trip" && obj.trip) return [obj.trip];
  if (obj?.kind === "kialia.backup" && Array.isArray(obj.trips)) return obj.trips;
  throw new Error("Die Datei stammt nicht aus kialia.");
}

/* ---------------------------------------------------------------------------
 * Datum und Sparrate
 * ------------------------------------------------------------------------ */

/**
 * Liest ein `YYYY-MM-DD` aus einem Datumsfeld als LOKALEN Tag.
 *
 * `new Date("2026-06-14")` waere UTC-Mitternacht — westlich von Greenwich also
 * der 13. Fuer eine Reise-App ist ein um einen Tag verschobenes Abreisedatum
 * kein Schoenheitsfehler.
 */
export function parseLocalDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso ?? "").trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * Volle Kalendermonate bis zum Reisebeginn. Negativ, wenn die Reise vorbei ist,
 * `null` ohne verwertbares Datum. Ein angefangener Monat zaehlt nur, wenn der
 * Starttag im Zielmonat noch bevorsteht.
 */
export function monthsUntil(iso: string, now: Date = new Date()): number | null {
  const start = parseLocalDate(iso);
  if (!start) return null;
  const months =
    (start.getFullYear() - now.getFullYear()) * 12 + (start.getMonth() - now.getMonth());
  return start.getDate() >= now.getDate() ? months : months - 1;
}

export type SavingsPlan = {
  total: number;
  covered: number;
  open: number;
  /** Anteil der gedeckten Kosten, 0..1. Der Fortschritt ist der eigentliche
      Grund, die App zu oeffnen, wenn gerade keine Reise laeuft — zwischen zwei
      Reisen hat sonst nichts in dieser App einen Rueckkehrgrund. */
  progress: number;
  months: number | null;
  perMonth: number | null;
  /** Woher die Monatszahl stammt — im UI sichtbar zu machen. */
  source: "date" | "manual";
  reason?: "no-months" | "nothing-open";
};

/**
 * Die Sparrate wird bei jedem Aufruf BERECHNET, nie gespeichert.
 *
 * Vorher stand die Monatszahl als handgetippter Wert im Store: wer das
 * Reisedatum verschob, bekam weiter die alte Rate angezeigt. Eine Zahl, nach
 * der jemand sein Geld einteilt, darf nicht veralten koennen.
 */
export function savingsPlan(
  trip: Trip,
  totals: ReturnType<typeof tripTotals>,
  now: Date = new Date(),
): SavingsPlan {
  const total = totals.total;
  const covered = (trip.savings.saved || 0) + (trip.savings.credit || 0);
  const open = Math.max(0, total - covered);

  const fromDate = monthsUntil(trip.startDate, now);
  const months = fromDate ?? (trip.savings.monthsLeft || 0);
  const source: SavingsPlan["source"] = fromDate === null ? "manual" : "date";

  // Ohne geplante Kosten gibt es keinen sinnvollen Anteil — 0 statt Division
  // durch null, damit der Balken bei einer leeren Reise nicht voll erscheint.
  const progress = total > 0 ? Math.min(1, covered / total) : 0;

  if (open <= 0)
    return { total, covered, open, progress, months, perMonth: 0, source, reason: "nothing-open" };
  if (months <= 0)
    return { total, covered, open, progress, months, perMonth: null, source, reason: "no-months" };
  return { total, covered, open, progress, months, perMonth: open / months, source };
}

/**
 * Heutiges Datum als `YYYY-MM-DD` in der Zone des Geraets.
 *
 * `new Date().toISOString().slice(0,10)` waere UTC. Wer abends nach
 * Mitternacht ueber seinen Tag schreibt, bekaeme damit den Vortag gestempelt —
 * und in Asien betrifft das den halben Vormittag. In einem Tagebuch, das
 * spaeter als Buch gedruckt wird, ist ein falsches Datum nicht korrigierbar.
 */
export function todayLocalISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Die Nummer des naechsten Reisetags.
 *
 * Vorher war das `diary.length + 1`. Nach dem Loeschen eines Tages vergibt das
 * eine bereits benutzte Nummer — zwei Eintraege heissen dann gleich. Und es
 * sagt nichts darueber aus, der wievielte Reisetag heute wirklich ist.
 *
 * Mit Reisedatum wird aus dem Abstand zum Reisebeginn gerechnet, sonst aus der
 * hoechsten vergebenen Nummer.
 */
export function nextDiaryDay(trip: Trip, now: Date = new Date()): number {
  const start = parseLocalDate(trip.startDate);
  if (start) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.round((today.getTime() - start.getTime()) / 86400000) + 1;
    if (diff >= 1) return diff;
  }
  const highest = trip.diary.reduce((max, e) => Math.max(max, e.day || 0), 0);
  return highest + 1;
}

/**
 * Datum ausgeschrieben, wie man es in ein Buch druckt: "22. August 2026".
 *
 * Das Tagebuch wird als PDF zum Andenken — dort gehoert kein `2026-08-22` hin.
 * Bewusst ueber parseLocalDate, damit der Tag nicht ueber die UTC-Grenze
 * rutscht; leere oder unlesbare Werte geben "" zurueck statt "Invalid Date".
 */
export function formatDateLong(iso: string): string {
  const d = parseLocalDate(iso);
  if (!d) return "";
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/* ---------------------------------------------------------------------------
 * Reiseverlauf
 * ------------------------------------------------------------------------ */

export type ItineraryStop = {
  kind: "stay" | "transport";
  id: string;
  title: string;
  detail: string;
  /** Startdatum, immer gesetzt — undatiertes wird gar nicht erst einsortiert. */
  date: string;
  endDate: string;
  nights: number;
  /** Der wievielte Reisetag, wenn die Reise ein Startdatum hat. */
  day: number | null;
  cost: number;
};

export type ItineraryGap = {
  from: string;
  to: string;
  nights: number;
};

export type Itinerary = {
  stops: ItineraryStop[];
  /** Naechte zwischen zwei Unterkuenften, fuer die keine gebucht ist. */
  gaps: ItineraryGap[];
  /** Posten ohne Datum — bewusst sichtbar, statt sie stillschweigend zu schlucken. */
  undated: { kind: "stay" | "transport"; id: string; title: string }[];
};

function nightsBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

/**
 * Baut aus Unterkuenften und Transporten einen datierten Verlauf.
 *
 * Die Daten dafuer lagen laengst im Modell — sie wurden nur als Kostenzeilen
 * gerendert. Was kein Datum hat, wird nicht geraten, sondern getrennt
 * ausgewiesen: eine Reise mit unbekannter Reihenfolge soll als solche sichtbar
 * sein, nicht als vollstaendiger Plan erscheinen.
 *
 * Luecken zwischen zwei Unterkuenften werden gemeldet, weil eine Nacht ohne
 * Bett das teuerste ist, was man beim Planen uebersieht.
 */
export function tripItinerary(trip: Trip): Itinerary {
  const start = parseLocalDate(trip.startDate);
  const dayOf = (iso: string): number | null => {
    const d = parseLocalDate(iso);
    if (!d || !start) return null;
    return nightsBetween(start, d) + 1;
  };

  const stops: ItineraryStop[] = [];
  const undated: Itinerary["undated"] = [];

  for (const s of trip.stays) {
    const from = parseLocalDate(s.from);
    const to = parseLocalDate(s.to);
    if (!from) {
      undated.push({ kind: "stay", id: s.id, title: s.name || "Unterkunft" });
      continue;
    }
    stops.push({
      kind: "stay",
      id: s.id,
      title: s.name || "Unterkunft",
      detail: boardLabels[s.board] ?? "",
      date: s.from,
      endDate: s.to,
      nights: to ? nightsBetween(from, to) : 0,
      day: dayOf(s.from),
      cost: s.cost || 0,
    });
  }

  for (const t of trip.transports) {
    if (!parseLocalDate(t.date)) {
      undated.push({ kind: "transport", id: t.id, title: t.label || t.mode });
      continue;
    }
    stops.push({
      kind: "transport",
      id: t.id,
      title: t.label || t.mode,
      detail: t.mode,
      date: t.date,
      endDate: "",
      nights: 0,
      day: dayOf(t.date),
      cost: t.cost || 0,
    });
  }

  stops.sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : a.kind === "transport" ? -1 : 1,
  );

  // Luecken nur zwischen Unterkuenften — ein Transport dazwischen ist kein Bett.
  const gaps: ItineraryGap[] = [];
  const beds = stops.filter((s) => s.kind === "stay" && s.endDate);
  for (let i = 0; i < beds.length - 1; i++) {
    const end = parseLocalDate(beds[i]!.endDate);
    const next = parseLocalDate(beds[i + 1]!.date);
    if (!end || !next) continue;
    const n = nightsBetween(end, next);
    if (n > 0) gaps.push({ from: beds[i]!.endDate, to: beds[i + 1]!.date, nights: n });
  }

  return { stops, gaps, undated };
}

/**
 * Alle Reisetage, die noch keinen Tagebucheintrag haben.
 *
 * Steht der Zeitraum fest, muss niemand Tage von Hand anlegen — die Reise
 * kennt ihre Tage. Wichtig ist nur, nichts zu ueberschreiben: Tage mit
 * Eintrag bleiben unberuehrt.
 */
export function missingDiaryDays(trip: Trip): { day: number; date: string }[] {
  const start = parseLocalDate(trip.startDate);
  const days = tripDays(trip);
  if (!start || days <= 0) return [];

  const taken = new Set(trip.diary.map((e) => e.date).filter(Boolean));
  const out: { day: number; date: string }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const iso = todayLocalISO(d);
    if (!taken.has(iso)) out.push({ day: i + 1, date: iso });
  }
  return out;
}

/**
 * Wer auf dieser Reise dabei ist.
 *
 * Aus dem Feld "Mit wem?" gelesen — es steht dort ohnehin schon, nur als
 * freier Text. Getrennt wird an Komma, Schraegstrich, "und" und "&", weil
 * Menschen genau so schreiben ("Annalina und Steffen").
 *
 * "Ich" steht immer vorn: die eigene Person ist der haeufigste Fall und soll
 * nicht erst getippt werden muessen.
 */
export function travellerNames(trip: Trip): string[] {
  const raw = (trip.companions ?? "")
    .split(/,|\/|&|\bund\b/gi)
    .map((v) => v.trim())
    .filter(Boolean)
    .filter((v) => v.toLowerCase() !== "ich");
  return ["Ich", ...Array.from(new Set(raw))];
}

/**
 * Eine Adresse, die gefahrlos in ein href darf.
 *
 * `normalizeUrl` greift beim Verlassen des Feldes — waehrend des Tippens steht
 * dort der Rohwert, und ueber den Abgleich kommen Werte anderer Mitglieder
 * ganz ohne diese Pruefung an. Ein `javascript:`-Link wuerde beim Anklicken
 * ausgefuehrt.
 *
 * Deshalb wird hier beim ANZEIGEN geprueft, nicht beim Speichern: nur http und
 * https kommen durch, alles andere ergibt `undefined` — dann fehlt das href
 * und der Link ist tot statt gefaehrlich.
 */
export function safeHref(url: string): string | undefined {
  const raw = (url ?? "").trim();
  if (!raw) return undefined;
  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return parsed.href;
  } catch {
    return undefined;
  }
}
