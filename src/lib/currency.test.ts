import { describe, expect, test } from "bun:test";
import { convert, money } from "./currency";

describe("money", () => {
  test("formatiert in der jeweiligen Währung", () => {
    expect(money(1200, "EUR")).toContain("1.200");
    expect(money(1200, "CHF")).toContain("CHF");
  });

  test("ein unbekannter Code führt nicht zum Absturz", () => {
    expect(money(50, "XYZ")).toContain("XYZ");
    expect(money(50, "XYZ")).toContain("50");
  });

  test("verkraftet NaN statt 'NaN €' anzuzeigen", () => {
    expect(money(Number.NaN, "EUR")).toContain("0");
  });
});

describe("convert", () => {
  test("rechnet mit dem gegebenen Kurs", () => {
    expect(convert(100, { value: 0.94, at: "2026-08-23", source: "ecb" })).toBeCloseTo(94, 5);
  });

  test("ohne Kurs wird NICHT geraten — das ist der Kern", () => {
    expect(convert(100, undefined)).toBeNull();
    expect(convert(100, null)).toBeNull();
    expect(convert(100, { value: 0, at: "", source: "manual" })).toBeNull();
    expect(convert(100, { value: Number.NaN, at: "", source: "manual" })).toBeNull();
  });
});
