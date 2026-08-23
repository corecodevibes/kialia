import { describe, expect, test } from "bun:test";
import { categorize, expensesTotal, parseExpenses } from "./expenses";

describe("parseExpenses", () => {
  test("liest den Satz, den man abends wirklich tippt", () => {
    const items = parseExpenses("Taverne 45, Taxi 8, Souvenirs 15");
    expect(items).toHaveLength(3);
    expect(items[0]).toEqual({ label: "Taverne", amount: 45, category: "essen" });
    expect(items[1]!.category).toBe("transport");
    expect(items[2]!.category).toBe("einkauf");
    expect(expensesTotal(items)).toBe(68);
  });

  test("trennt auch an 'und', Semikolon und Zeilenumbruch", () => {
    expect(parseExpenses("Eis 6 und Kaffee 4")).toHaveLength(2);
    expect(parseExpenses("Bus 3; Museum 12")).toHaveLength(2);
    expect(parseExpenses("Hotel 90\nAbendessen 30")).toHaveLength(2);
  });

  test("nimmt die LETZTE Zahl — '2 Bier 12' kostet 12, nicht 2", () => {
    const [item] = parseExpenses("2 Bier 12");
    expect(item!.amount).toBe(12);
    expect(item!.label).toBe("2 Bier");
  });

  test("versteht Komma und Punkt als Dezimaltrenner", () => {
    expect(parseExpenses("Kaffee 4,50")[0]!.amount).toBe(4.5);
    expect(parseExpenses("Kaffee 4.50")[0]!.amount).toBe(4.5);
  });

  test("ignoriert Währungszeichen im Namen", () => {
    expect(parseExpenses("Taverne 45€")[0]!.label).toBe("Taverne");
  });

  test("ohne Betrag entsteht kein Posten — es wird nichts geraten", () => {
    expect(parseExpenses("war schön am Strand")).toHaveLength(0);
    expect(parseExpenses("")).toHaveLength(0);
    expect(parseExpenses("Taverne 0")).toHaveLength(0);
  });

  test("ein Posten ohne Namen bekommt einen, statt leer zu bleiben", () => {
    expect(parseExpenses("45")[0]!.label).toBe("Ausgabe");
  });
});

describe("categorize", () => {
  test("erkennt die gängigen Fälle einer Reise", () => {
    expect(categorize("Taverne am Hafen")).toBe("essen");
    expect(categorize("Fähre nach Santorin")).toBe("transport");
    expect(categorize("Hotel Elena")).toBe("unterkunft");
    expect(categorize("Bootstour")).toBe("aktivitaet");
    expect(categorize("Souvenirs")).toBe("einkauf");
  });

  test("verkraftet Umlaute und Großschreibung", () => {
    expect(categorize("FRÜHSTÜCK")).toBe("essen");
    expect(categorize("Fruehstueck")).toBe("essen");
  });

  test("was nicht passt, bleibt Sonstiges statt falsch einsortiert", () => {
    expect(categorize("Trinkgeld")).toBe("sonstiges");
    expect(categorize("")).toBe("sonstiges");
  });
});

describe("Komma als Dezimaltrenner UND Trennzeichen", () => {
  test("beides im selben Satz wird richtig auseinandergehalten", () => {
    const items = parseExpenses("Kaffee 4,50, Taxi 12, Eis 3,20");
    expect(items).toHaveLength(3);
    expect(items[0]!.amount).toBe(4.5);
    expect(items[1]!.amount).toBe(12);
    expect(items[2]!.amount).toBe(3.2);
    expect(expensesTotal(items)).toBeCloseTo(19.7, 5);
  });
});
