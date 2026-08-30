import { expect, test } from "bun:test";
import { mergeTrips } from "./trip-merge";
import { newTrip, type Trip } from "./trip-store";

const tag = (id: string, text: string) => ({
  id,
  day: 1,
  date: "2026-08-27",
  text,
  highlight: "",
  notes: "",
  expenses: "",
  spent: 0,
  food: "",
  mood: "",
  assignedTo: "",
});

const basis = (over: Partial<Trip>): Trip => ({ ...newTrip("Kreta"), ...over });

test("was nur einer hat, bleibt erhalten — beide Richtungen", () => {
  // Genau der Fall von Kreta: er schreibt Tag 1, sie Tag 2.
  const meins = basis({ diary: [tag("a", "Schlucht")] });
  const ihres = basis({ diary: [tag("b", "Strand")] });

  const r1 = mergeTrips(meins, ihres, true);
  const r2 = mergeTrips(meins, ihres, false);
  expect(r1.diary.map((d) => d.id).sort()).toEqual(["a", "b"]);
  expect(r2.diary.map((d) => d.id).sort()).toEqual(["a", "b"]);
});

test("bei demselben Eintrag gewinnt die jüngere Fassung", () => {
  const alt = basis({ diary: [tag("a", "alt")] });
  const neu = basis({ diary: [tag("a", "neu")] });
  expect(mergeTrips(neu, alt, true).diary[0]?.text).toBe("neu");
  expect(mergeTrips(alt, neu, false).diary[0]?.text).toBe("neu");
});

test("Einzelwerte kommen geschlossen von der jüngeren Fassung", () => {
  const alt = basis({ destination: "Kreta", budget: 1000 });
  const neu = basis({ destination: "Kreta, Griechenland", budget: 2000 });
  const r = mergeTrips(alt, neu, false);
  expect(r.destination).toBe("Kreta, Griechenland");
  expect(r.budget).toBe(2000);
});

test("die Server-Kennung geht nie verloren", () => {
  const lokal = basis({ remoteId: "abc", inviteCode: "R5G5YTDV" });
  const fern = basis({});
  expect(mergeTrips(lokal, fern, false).remoteId).toBe("abc");
  expect(mergeTrips(lokal, fern, false).inviteCode).toBe("R5G5YTDV");
});

test("Haken in derselben Packlisten-Kategorie gehen nicht verloren", () => {
  const kat = (items: { id: string; done: boolean }[]) => [
    {
      id: "k1",
      name: "Kleidung",
      items: items.map((i) => ({ id: i.id, text: i.id, qty: "", done: i.done, who: "" })),
    },
  ];
  const meins = basis({ packing: kat([{ id: "x", done: true }]) });
  const ihres = basis({ packing: kat([{ id: "y", done: true }]) });
  const r = mergeTrips(meins, ihres, true);
  expect(r.packing[0]?.items.map((i) => i.id).sort()).toEqual(["x", "y"]);
});

test("leere oder fehlende Listen stürzen nicht ab", () => {
  const a = basis({ diary: undefined as never });
  const b = basis({ diary: [tag("a", "x")] });
  expect(mergeTrips(a, b, false).diary.map((d) => d.id)).toEqual(["a"]);
});
