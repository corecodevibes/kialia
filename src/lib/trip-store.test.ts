import { describe, expect, test } from "bun:test";
import {
  monthsUntil,
  nextDiaryDay,
  parseLocalDate,
  savingsPlan,
  todayLocalISO,
  tripDays,
  tripTotals,
} from "./trip-store";
import type { Trip } from "./trip-store";

/* Diese Tests halten drei Fehler fest, die am 22.08.2026 im Budget gefunden
   wurden. Sie waren rot, bevor der Fix kam. */

function tripWith(patch: Partial<Trip>): Trip {
  return {
    id: "t",
    destination: "Kreta",
    kind: "Rundreise",
    companions: "",
    people: 2,
    startDate: "",
    endDate: "",
    transports: [],
    stays: [],
    activities: [],
    ideas: [],
    packing: [],
    diary: [],
    meals: { breakfast: 0, lunch: 0, dinner: 0, snacks: 0, maxPerDay: 0 },
    savings: { enabled: true, saved: 0, monthsLeft: 6, credit: 0 },
    ...patch,
  } as Trip;
}

describe("parseLocalDate", () => {
  test("liest ein Datumsfeld als lokalen Tag, nicht als UTC-Mitternacht", () => {
    const d = parseLocalDate("2026-06-14");
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(5);
    expect(d?.getDate()).toBe(14);
    // Der Gegenbeweis: so haette es die naive Variante gemacht. Unter
    // TZ=America/New_York ist UTC-Mitternacht der Vortag, 20:00 Ortszeit.
    expect(new Date("2026-06-14").getDate()).toBe(13);
  });

  test("weist Unfug zurück, statt Invalid Date weiterzureichen", () => {
    expect(parseLocalDate("")).toBeNull();
    expect(parseLocalDate("14.06.2026")).toBeNull();
  });
});

describe("monthsUntil", () => {
  const now = new Date(2026, 1, 20); // 20. Februar 2026

  test("zählt angefangene Monate nur, wenn der Starttag noch bevorsteht", () => {
    expect(monthsUntil("2026-06-25", now)).toBe(4);
    expect(monthsUntil("2026-06-14", now)).toBe(3);
  });

  test("liefert 0 für diesen Monat und negativ für Vergangenes", () => {
    expect(monthsUntil("2026-02-28", now)).toBe(0);
    expect(monthsUntil("2025-12-01", now)).toBe(-3);
  });

  test("ohne Datum kein erfundener Wert", () => {
    expect(monthsUntil("", now)).toBeNull();
  });
});

describe("savingsPlan", () => {
  test("zieht mit, wenn sich das Reisedatum ändert — der eigentliche Fehler", () => {
    const base = tripWith({
      startDate: "2026-06-25",
      endDate: "2026-07-02",
      stays: [
        {
          id: "s",
          name: "",
          url: "",
          from: "",
          to: "",
          cost: 4000,
          status: "offen",
          dueDate: "",
          board: "nichts",
        },
      ],
    });
    const now = new Date(2026, 1, 20);

    const far = savingsPlan(base, tripTotals(base), now);
    expect(far.months).toBe(4);
    expect(far.perMonth).toBe(1000);

    // Reise um zwei Monate vorgezogen: die Rate MUSS steigen.
    const near = { ...base, startDate: "2026-04-25" };
    const soon = savingsPlan(near, tripTotals(near), now);
    expect(soon.months).toBe(2);
    expect(soon.perMonth).toBe(2000);
  });

  test("nennt keine Monatsrate, wenn keine Monate mehr übrig sind", () => {
    const t = tripWith({
      startDate: "2026-02-25",
      stays: [
        {
          id: "s",
          name: "",
          url: "",
          from: "",
          to: "",
          cost: 900,
          status: "offen",
          dueDate: "",
          board: "nichts",
        },
      ],
    });
    const plan = savingsPlan(t, tripTotals(t), new Date(2026, 1, 20));
    expect(plan.months).toBe(0);
    expect(plan.perMonth).toBeNull(); // vorher: 900 € "pro Monat" in 0 Monaten
    expect(plan.reason).toBe("no-months");
  });

  test("zeigt die Posten hinter der Zahl", () => {
    const t = tripWith({
      startDate: "2026-06-25",
      savings: { enabled: true, saved: 500, monthsLeft: 6, credit: 100 },
      stays: [
        {
          id: "s",
          name: "",
          url: "",
          from: "",
          to: "",
          cost: 1000,
          status: "offen",
          dueDate: "",
          board: "nichts",
        },
      ],
    });
    const plan = savingsPlan(t, tripTotals(t), new Date(2026, 1, 20));
    expect(plan.total).toBe(1000);
    expect(plan.covered).toBe(600);
    expect(plan.open).toBe(400);
  });
});

describe("tripTotals — geplant und tatsächlich getrennt", () => {
  test("Tagebuch-Ausgaben werden getrennt geführt, nicht in den Plan gemischt", () => {
    const t = tripWith({
      stays: [
        {
          id: "s",
          name: "",
          url: "",
          from: "",
          to: "",
          cost: 1000,
          status: "offen",
          dueDate: "",
          board: "nichts",
        },
      ],
      diary: [
        {
          id: "d1",
          day: 1,
          date: "",
          text: "",
          highlight: "",
          notes: "",
          expenses: "",
          spent: 120,
        },
        { id: "d2", day: 2, date: "", text: "", highlight: "", notes: "", expenses: "", spent: 80 },
      ],
    });
    const totals = tripTotals(t);
    expect(totals.total).toBe(1000); // Plan bleibt Plan
    expect(totals.actual).toBe(200); // aus dem Tagebuch, eine Quelle
    expect(totals.actualDays).toBe(2);
  });
});

describe("tripDays", () => {
  test("zählt beide Randtage mit", () => {
    expect(tripDays(tripWith({ startDate: "2026-06-01", endDate: "2026-06-07" }))).toBe(7);
  });
});

describe("Tagebuch — Datum und Tagesnummer", () => {
  test("stempelt den lokalen Tag, nicht UTC — der Fehler nach Mitternacht", () => {
    // Die Zusage lautet: der Kalendertag des Geraets, nicht der von UTC.
    // Bewusst ohne Vergleich gegen toISOString() — dessen Ergebnis haengt von
    // der Zone des Testlaufs ab, und ein Test, der je nach Umgebung
    // durchfaellt, belegt nichts.
    const kurzNachMitternacht = new Date(2026, 7, 22, 1, 33);
    expect(todayLocalISO(kurzNachMitternacht)).toBe("2026-08-22");
    const spaetAbends = new Date(2026, 11, 31, 23, 59);
    expect(todayLocalISO(spaetAbends)).toBe("2026-12-31");
  });

  test("vergibt nach dem Löschen eines Tages keine doppelte Nummer", () => {
    const t = tripWith({
      diary: [
        { id: "a", day: 1, date: "", text: "", highlight: "", notes: "", expenses: "", spent: 0 },
        { id: "c", day: 3, date: "", text: "", highlight: "", notes: "", expenses: "", spent: 0 },
      ],
    });
    // diary.length + 1 hätte 3 ergeben — die Nummer gibt es schon.
    expect(nextDiaryDay(t)).toBe(4);
  });

  test("zählt mit Reisedatum den echten Reisetag", () => {
    const t = tripWith({ startDate: "2026-06-14" });
    expect(nextDiaryDay(t, new Date(2026, 5, 14))).toBe(1);
    expect(nextDiaryDay(t, new Date(2026, 5, 16))).toBe(3);
  });

  test("vor Reisebeginn fällt es auf die Zählung zurück, statt 0 oder negativ zu werden", () => {
    const t = tripWith({ startDate: "2026-06-14" });
    expect(nextDiaryDay(t, new Date(2026, 5, 1))).toBe(1);
  });
});
