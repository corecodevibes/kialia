import { expect, test } from "bun:test";
import { esc } from "./inventory";

test("maskiert alles, was aus einem Namen Markup machen könnte", () => {
  expect(esc('<img src=x onerror="alert(1)">')).toBe(
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
  );
  expect(esc("Rucksack & Zelt")).toBe("Rucksack &amp; Zelt");
  expect(esc("Annalinas 'gute' Jacke")).toBe("Annalinas &#39;gute&#39; Jacke");
});

test("lässt normale Bezeichnungen unangetastet", () => {
  expect(esc("Wanderschuhe Gr. 42")).toBe("Wanderschuhe Gr. 42");
  expect(esc("")).toBe("");
});
