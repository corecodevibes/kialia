import { expect, test } from "bun:test";
import { anbieterVollstaendig } from "./anbieter";

const voll = {
  name: "Beispiel",
  strasse: "Musterweg 1",
  ort: "8000 Zürich",
  land: "Schweiz",
  email: "post@example.org",
};

test("erkennt vollständige Angaben", () => {
  expect(anbieterVollstaendig(voll)).toBe(true);
});

test("eine fehlende Pflichtangabe genügt", () => {
  for (const key of ["name", "strasse", "ort", "land", "email"] as const) {
    expect(anbieterVollstaendig({ ...voll, [key]: "" })).toBe(false);
  }
});

test("Firmenangaben und USt-IdNr. sind keine Pflicht", () => {
  expect(anbieterVollstaendig({ ...voll, firmenangaben: "", ustId: "" })).toBe(true);
});
