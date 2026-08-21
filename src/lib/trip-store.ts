import { useCallback, useEffect, useState } from "react";

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
  dueDate: string;
  note: string;
  url: string;
};

export type Board = "nichts" | "fruehstueck" | "halbpension" | "vollpension" | "wohnung";

export type Stay = {
  id: string;
  name: string;
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
  url: string;
  cost: number;
  status: PayStatus;
  dueDate: string;
};

export type Meals = {
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
    meals: { breakfast: 0, lunch: 0, dinner: 0, snacks: 0, maxPerDay: 100 },
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
    meals: { ...base.meals, ...t.meals },
    savings: { ...base.savings, ...t.savings },
    packing: t.packing && t.packing.length ? t.packing : base.packing,
  };
}

export function loadStore(): Store {
  if (typeof window === "undefined") {
    const t = newTrip();
    return { trips: [t], activeId: t.id };
  }
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
  const t = newTrip();
  return { trips: [t], activeId: t.id };
}

function save(store: Store) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* Speicher voll oder blockiert */
  }
}

const fallback: Store = { trips: [emptyTrip], activeId: emptyTrip.id };

export function useTrip() {
  const [store, setStore] = useState<Store>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStore(loadStore());
    setReady(true);
  }, []);

  const mutate = useCallback((fn: (s: Store) => Store) => {
    setStore((prev) => {
      const next = fn(prev);
      save(next);
      return next;
    });
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
        if (!trips.length) {
          const t = newTrip();
          return { trips: [t], activeId: t.id };
        }
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

  return {
    trip,
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
  return m.breakfast + m.lunch + m.dinner + m.snacks;
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
  return { days, transport, stays, activities, food, total, paid, open: Math.max(0, total - paid) };
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
