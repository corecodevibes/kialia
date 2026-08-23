import { describe, expect, test } from "bun:test";
import { countryCodeFor, flagFor } from "./country";

describe("countryCodeFor", () => {
  test("erkennt Land und Region", () => {
    expect(countryCodeFor("Griechenland")).toBe("GR");
    expect(countryCodeFor("Kreta")).toBe("GR");
    expect(countryCodeFor("Bali")).toBe("ID");
  });

  test("findet das Land auch in einem freien Satz", () => {
    expect(countryCodeFor("Rundreise Kreta & Athen")).toBe("GR");
    expect(countryCodeFor("2 Wochen Sri Lanka")).toBe("LK");
  });

  test("verkraftet Umlaute in beiden Schreibweisen", () => {
    expect(countryCodeFor("Türkei")).toBe("TR");
    expect(countryCodeFor("Tuerkei")).toBe("TR");
    expect(countryCodeFor("ÖSTERREICH")).toBe("AT");
  });

  test("rät nicht, wenn das Land unbekannt ist", () => {
    expect(countryCodeFor("Irgendwo im Nirgendwo")).toBeNull();
    expect(countryCodeFor("")).toBeNull();
    expect(flagFor("Fantasialand")).toBe("");
  });
});

describe("flagFor", () => {
  test("baut die Emoji-Flagge aus dem Ländercode", () => {
    expect(flagFor("Griechenland")).toBe("🇬🇷");
    expect(flagFor("Japan")).toBe("🇯🇵");
    expect(flagFor("Neuseeland")).toBe("🇳🇿");
  });
});
