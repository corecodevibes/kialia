import { expect, test } from "bun:test";
import { itemsWithPayers, paidTotals, prunePayers } from "./payers";

test("der Zahler bleibt am Posten, auch wenn vorne etwas dazukommt", () => {
  const alt = "Taverne 45, Taxi 8";
  const [a, b] = itemsWithPayers(alt, {});
  const payers = { [a!.key]: "Steffen", [b!.key]: "Annalina" };

  // Vorne einen Posten einfügen — über die Position wäre jetzt alles verrutscht.
  const neu = "Kaffee 4, Taverne 45, Taxi 8";
  const r = itemsWithPayers(neu, payers);
  expect(r.map((x) => x.paidBy)).toEqual(["", "Steffen", "Annalina"]);
});

test("gleiche Posten bekommen der Reihe nach ihre Zahler", () => {
  const text = "Kaffee 4, Kaffee 4";
  const [a, b] = itemsWithPayers(text, {});
  const payers = { [a!.key]: "Steffen", [b!.key]: "Annalina" };
  expect(itemsWithPayers(text, payers).map((x) => x.paidBy)).toEqual(["Steffen", "Annalina"]);
});

test("zählt zusammen, wer wie viel ausgelegt hat", () => {
  const text = "Taverne 45, Taxi 8, Eis 6";
  const e = itemsWithPayers(text, {});
  const payers = { [e[0]!.key]: "Steffen", [e[1]!.key]: "Annalina", [e[2]!.key]: "Steffen" };
  const r = paidTotals(itemsWithPayers(text, payers));
  expect(r).toEqual([
    { name: "Steffen", amount: 51 },
    { name: "Annalina", amount: 8 },
  ]);
});

test("Posten ohne Zahler zählen nirgends mit", () => {
  const e = itemsWithPayers("Taverne 45", {});
  expect(paidTotals(e)).toEqual([]);
});

test("Zahler zu gelöschten Posten verschwinden", () => {
  const alt = "Taverne 45, Taxi 8";
  const e = itemsWithPayers(alt, {});
  const payers = { [e[0]!.key]: "Steffen", [e[1]!.key]: "Annalina" };
  const nurNoch = prunePayers("Taverne 45", payers);
  expect(Object.values(nurNoch)).toEqual(["Steffen"]);
});
