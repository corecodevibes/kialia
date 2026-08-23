import { describe, expect, test } from "bun:test";
import { mapsQuery, mapsUrl } from "./maps";

describe("mapsQuery", () => {
  test("hängt das Reiseziel an, damit der Ort eindeutig wird", () => {
    expect(mapsQuery("Taverne am Hafen", "", "Kreta")).toBe("Taverne am Hafen, Kreta");
  });

  test("wiederholt das Ziel nicht, wenn es schon drinsteht", () => {
    expect(mapsQuery("Hotel", "Hauptstraße 1, Kreta", "Kreta")).toBe("Hauptstraße 1, Kreta");
  });

  test("die Adresse führt, wenn es eine gibt", () => {
    expect(mapsQuery("Villa Sonne", "Odos Nikou 4, Chania", "Kreta")).toBe(
      "Odos Nikou 4, Chania, Kreta",
    );
  });

  test("ohne Angaben bleibt es leer statt nur das Land zu zeigen", () => {
    expect(mapsQuery("", "", "")).toBe("");
  });
});

describe("mapsUrl", () => {
  test("öffnet auf Apple-Geräten Apple Maps", () => {
    const url = mapsUrl("Chania, Kreta", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)");
    expect(url).toStartWith("https://maps.apple.com/?q=");
  });

  test("sonst Google Maps", () => {
    const url = mapsUrl("Chania, Kreta", "Mozilla/5.0 (Linux; Android 14)");
    expect(url).toStartWith("https://www.google.com/maps/search/");
  });

  test("kodiert Sonderzeichen", () => {
    expect(mapsUrl("Hauptstraße 1", "iPhone")).toContain("Hauptstra%C3%9Fe%201");
  });

  test("leere Anfrage ergibt keinen Link", () => {
    expect(mapsUrl("  ", "iPhone")).toBe("");
  });
});
