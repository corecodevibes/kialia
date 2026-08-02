import { useCallback, useEffect, useState } from "react";

export type TripStyle =
  | "rundreise"
  | "all-inclusive"
  | "staedtetrip"
  | "strand"
  | "roadtrip"
  | "natur";

export type Stop = {
  id: string;
  name: string;
  nights: number;
  note: string;
};

export type Idea = {
  id: string;
  title: string;
  category: string;
  note: string;
};

export type Budget = {
  transportMode: string;
  transport: number;
  accommodation: number;
  foodPerDay: number;
  activities: number;
  extras: number;
  saved: number;
  monthsLeft: number;
};

export type DiaryEntry = {
  id: string;
  day: number;
  date: string;
  text: string;
  highlight: string;
  spent: number;
};

export type Trip = {
  destination: string;
  country: string;
  style: TripStyle | null;
  travellers: number;
  days: number;
  startDate: string;
  stops: Stop[];
  ideas: Idea[];
  budget: Budget;
  diary: DiaryEntry[];
};

export const emptyTrip: Trip = {
  destination: "",
  country: "",
  style: null,
  travellers: 2,
  days: 10,
  startDate: "",
  stops: [],
  ideas: [],
  budget: {
    transportMode: "Flugzeug",
    transport: 0,
    accommodation: 0,
    foodPerDay: 0,
    activities: 0,
    extras: 0,
    saved: 0,
    monthsLeft: 6,
  },
  diary: [],
};

const KEY = "reiseplaner.trip.v1";

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function loadTrip(): Trip {
  if (typeof window === "undefined") return emptyTrip;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyTrip;
    return { ...emptyTrip, ...JSON.parse(raw) } as Trip;
  } catch {
    return emptyTrip;
  }
}

export function useTrip() {
  const [trip, setTrip] = useState<Trip>(emptyTrip);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTrip(loadTrip());
    setReady(true);
  }, []);

  const update = useCallback((patch: Partial<Trip> | ((t: Trip) => Partial<Trip>)) => {
    setTrip((prev) => {
      const next = { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage voll oder blockiert */
      }
      return next;
    });
  }, []);

  return { trip, update, ready };
}

export function totalBudget(b: Budget, days: number) {
  return b.transport + b.accommodation + b.foodPerDay * days + b.activities + b.extras;
}

export function eur(n: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

export const styleLabels: Record<TripStyle, string> = {
  rundreise: "Rundreise",
  "all-inclusive": "All Inclusive",
  staedtetrip: "Städtetrip",
  strand: "Strand & Erholung",
  roadtrip: "Roadtrip",
  natur: "Natur & Wandern",
};

/** Grober Routen-Entwurf ohne Server: verteilt die Tage sinnvoll auf die Stopps. */
export function draftRoute(destination: string, days: number, style: TripStyle | null): Stop[] {
  const count = Math.max(2, Math.min(6, Math.round(days / 3)));
  const labels =
    style === "strand" || style === "all-inclusive"
      ? ["Ankunft & Hotel", "Strandtag", "Ausflug ins Umland", "Bootstour", "Markt & Altstadt", "Abreise"]
      : style === "staedtetrip"
        ? ["Altstadt", "Museumsviertel", "Aussichtspunkt", "Foodtour", "Tagesausflug", "Abreise"]
        : ["Ankunft", "Küste", "Berge", "Nationalpark", "Kleinstadt", "Rückreise"];
  const base = Math.floor(days / count);
  const rest = days - base * count;
  return Array.from({ length: count }, (_, i) => ({
    id: uid(),
    name: `${destination || "Stopp"} · ${labels[i] ?? `Etappe ${i + 1}`}`,
    nights: base + (i < rest ? 1 : 0),
    note: "",
  }));
}
