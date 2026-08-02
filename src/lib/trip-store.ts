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


export type Trip = {
  destination: string;
  startDate: string;
  endDate: string;
  companions: string;
  travellers: number;
  ideas: Idea[];
  transports: Transport[];
  stays: Stay[];
  activities: Activity[];
  meals: Meals;
  savings: Savings;
  diary: DiaryEntry[];
};

export const emptyTrip: Trip = {
  destination: "",
  startDate: "",
  endDate: "",
  companions: "",
  travellers: 2,
  ideas: [],
  transports: [],
  stays: [],
  activities: [],
  meals: { breakfast: 0, lunch: 0, dinner: 0, snacks: 0, maxPerDay: 100 },
  savings: { enabled: false, saved: 0, monthsLeft: 6, credit: 0 },
  diary: [],
};

const KEY = "travelivibes.trip.v2";

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function loadTrip(): Trip {
  if (typeof window === "undefined") return emptyTrip;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyTrip;
    const parsed = JSON.parse(raw) as Partial<Trip>;
    return { ...emptyTrip, ...parsed, meals: { ...emptyTrip.meals, ...parsed.meals }, savings: { ...emptyTrip.savings, ...parsed.savings } };
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
        /* Speicher voll oder blockiert */
      }
      return next;
    });
  }, []);

  return { trip, update, ready };
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
