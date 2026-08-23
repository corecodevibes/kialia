import { expect, test } from "bun:test";
import { filledEntries, type DayFields } from "./day-extract";

const leer: DayFields = {
  text: null,
  highlight: null,
  food: null,
  foodTag: null,
  mood: null,
  spent: null,
};

test("leere Felder werden nicht zum Bestätigen angeboten", () => {
  expect(filledEntries(leer)).toEqual([]);
});

test("nur was tatsächlich erkannt wurde", () => {
  const f: DayFields = { ...leer, text: "Wandern", spent: 40 };
  expect(filledEntries(f)).toEqual([
    ["text", "Was passiert ist"],
    ["spent", "Ausgegeben"],
  ]);
});

test("eine Null bei den Ausgaben ist eine Angabe, kein leeres Feld", () => {
  expect(filledEntries({ ...leer, spent: 0 }).map(([k]) => k)).toEqual(["spent"]);
});

test("Leerzeichen allein zählen nicht als Inhalt", () => {
  expect(filledEntries({ ...leer, food: "   " })).toEqual([]);
});
