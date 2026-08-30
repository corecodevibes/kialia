import { expect, test } from "bun:test";
import { FALLBACK, normalizeCurrency } from "./home-currency";

test("bekannte Kürzel kommen durch", () => {
  expect(normalizeCurrency("CHF")).toBe("CHF");
  expect(normalizeCurrency("chf")).toBe("CHF");
  expect(normalizeCurrency(" EUR ")).toBe("EUR");
});

test("Unfug fällt auf den Rückfall zurück", () => {
  // Stünde später eine Währung im Speicher, die es nicht gibt, ließe sie sich
  // nicht umrechnen — und die Anzeige zeigte eine Einheit, die niemand kennt.
  expect(normalizeCurrency("XYZ")).toBe(FALLBACK);
  expect(normalizeCurrency("")).toBe(FALLBACK);
  expect(normalizeCurrency(null)).toBe(FALLBACK);
  expect(normalizeCurrency(undefined)).toBe(FALLBACK);
});
