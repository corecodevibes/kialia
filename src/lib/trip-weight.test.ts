import { expect, test } from "bun:test";
import { needsTypedConfirm, tripWeight } from "./trip-weight";
import { newTrip } from "./trip-store";

const leer = newTrip("Kreta");

test("das blosse Gerüst wiegt nichts", () => {
  expect(tripWeight(leer)).toBe(0);
  expect(needsTypedConfirm(leer)).toBe(false);
});

test("Vorschläge in der Packliste zählen erst, wenn jemand sie anfasst", () => {
  const mitVorschlaegen = {
    ...leer,
    packing: [
      {
        id: "c",
        name: "Kleidung",
        items: [
          { id: "1", text: "Zahnbürste", qty: "", done: false, who: "" },
          { id: "2", text: "Handtuch", qty: "", done: false, who: "" },
        ],
      },
    ],
  };
  expect(tripWeight(mitVorschlaegen)).toBe(0);

  const abgehakt = {
    ...mitVorschlaegen,
    packing: [
      {
        ...mitVorschlaegen.packing[0]!,
        items: [
          { id: "1", text: "Zahnbürste", qty: "", done: true, who: "" },
          { id: "2", text: "Handtuch", qty: "", done: false, who: "Anna" },
        ],
      },
    ],
  };
  expect(tripWeight(abgehakt)).toBe(2);
});

test("echte Planung verlangt die Tippbestätigung", () => {
  const geplant = {
    ...leer,
    transports: [
      {
        id: "t",
        mode: "Flug" as const,
        from: "Zürich",
        to: "Chania",
        date: "",
        time: "",
        cost: 0,
        status: "offen" as const,
        address: "",
        url: "",
      },
    ],
    stays: [
      {
        id: "s",
        name: "Casa",
        address: "",
        checkIn: "",
        checkOut: "",
        cost: 0,
        status: "offen" as const,
        url: "",
      },
    ],
    ideas: [{ id: "i", text: "Balos", links: [] }],
  };
  expect(tripWeight(geplant)).toBe(3);
  expect(needsTypedConfirm(geplant)).toBe(true);
});

test("eine Reise ohne Listen stürzt nicht ab", () => {
  // Ein alter gespeicherter Stand kann Felder noch nicht kennen.
  expect(tripWeight({ ...leer, diary: undefined as never })).toBe(0);
});

test("leere Tagebuchtage zählen nicht", () => {
  const mitLeerenTagen = {
    ...leer,
    diary: [
      {
        id: "d",
        day: 1,
        date: "2026-08-27",
        text: "  ",
        highlight: "",
        notes: "",
        expenses: "",
        spent: 0,
        food: "",
        mood: "",
      },
    ],
  };
  expect(tripWeight(mitLeerenTagen)).toBe(0);
});
