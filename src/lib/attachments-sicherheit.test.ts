import { describe, expect, test } from "bun:test";
import { sicherer } from "./attachments";

/**
 * Belege aus einer Sicherungsdatei kommen von aussen. Ein HTML- oder SVG-Typ
 * darf nie unveraendert in einer Blob-URL des App-Ursprungs landen, sonst fuehrt
 * der Browser Skript aus. Diese Tests sichern die Grenze ab.
 */
describe("sicherer (Beleg-Typen)", () => {
  test("laesst anzeigbare Bildtypen unveraendert", () => {
    expect(sicherer("image/jpeg")).toBe("image/jpeg");
    expect(sicherer("image/png")).toBe("image/png");
    expect(sicherer("application/pdf")).toBe("application/pdf");
  });

  test("ersetzt HTML und SVG durch den neutralen Typ", () => {
    expect(sicherer("text/html")).toBe("application/octet-stream");
    expect(sicherer("image/svg+xml")).toBe("application/octet-stream");
    expect(sicherer("application/xhtml+xml")).toBe("application/octet-stream");
  });

  test("ist gegen Grossschreibung und fehlende Typen robust", () => {
    expect(sicherer("IMAGE/PNG")).toBe("image/png");
    expect(sicherer("")).toBe("application/octet-stream");
    expect(sicherer(undefined as unknown as string)).toBe("application/octet-stream");
  });
});
