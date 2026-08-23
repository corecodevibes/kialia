import { expect, test } from "bun:test";
import { fitWithin, MAX_EDGE } from "./image-prep";

test("verkleinert nur, was zu gross ist", () => {
  expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  expect(fitWithin(MAX_EDGE, 1000)).toEqual({ width: MAX_EDGE, height: 1000 });
});

test("behaelt das Seitenverhaeltnis", () => {
  // Typisches iPhone-Foto, quer.
  const r = fitWithin(4032, 3024);
  expect(r.width).toBe(2000);
  expect(r.height).toBe(1500);
  expect(Math.abs(r.width / r.height - 4032 / 3024)).toBeLessThan(0.01);
});

test("richtet sich nach der langen Kante, nicht nach der Breite", () => {
  // Hochkant: die Hoehe muss gedeckelt werden, nicht die Breite.
  const r = fitWithin(3024, 4032);
  expect(r.height).toBe(2000);
  expect(r.width).toBe(1500);
});

test("stolpert nicht ueber entartete Groessen", () => {
  expect(fitWithin(0, 0)).toEqual({ width: 0, height: 0 });
  expect(fitWithin(1, 100000).height).toBe(2000);
});
