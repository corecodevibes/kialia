import { expect, test } from "bun:test";
import { missingSelf, otherTravellers, rosterFromOthers, newTrip, type Trip } from "./trip-store";

const mit = (companions: string): Trip => ({ ...newTrip("Kreta"), companions });

test("jeder sieht die anderen, nie sich selbst", () => {
  // Die Reise kennt beide Namen — das ist der springende Punkt.
  const t = mit("Steffen, Annalina");
  expect(otherTravellers(t, "Steffen")).toEqual(["Annalina"]);
  expect(otherTravellers(t, "Annalina")).toEqual(["Steffen"]);
});

test("Groß- und Kleinschreibung trennt niemanden ab", () => {
  const t = mit("Steffen, Annalina");
  expect(otherTravellers(t, "annalina")).toEqual(["Steffen"]);
});

test("getippt werden die anderen, gespeichert wird die ganze Runde", () => {
  expect(rosterFromOthers("Annalina", "Steffen")).toBe("Steffen, Annalina");
  expect(rosterFromOthers("Annalina und Lena", "Steffen")).toBe("Steffen, Annalina, Lena");
});

test("niemand steht doppelt drin", () => {
  expect(rosterFromOthers("Steffen, Annalina", "Steffen")).toBe("Steffen, Annalina");
  expect(rosterFromOthers("annalina", "Annalina")).toBe("Annalina");
});

test("ohne eigenen Namen bleibt es bei den getippten", () => {
  expect(rosterFromOthers("Annalina", "")).toBe("Annalina");
});

test("fehlender eigener Name wird genau einmal nachgetragen", () => {
  // Alte Reise: Steffen hatte nur "Annalina" getippt.
  const alt = mit("Annalina");
  expect(missingSelf(alt, "Steffen")).toBe("Steffen, Annalina");
  // Danach ist nichts mehr zu tun — sonst liefe bei jedem Abgleich eine
  // Änderung los.
  const neu = mit("Steffen, Annalina");
  expect(missingSelf(neu, "Steffen")).toBeNull();
  expect(missingSelf(neu, "Annalina")).toBeNull();
});

test("ohne bekannten eigenen Namen wird nichts angefasst", () => {
  expect(missingSelf(mit("Annalina"), "")).toBeNull();
});
