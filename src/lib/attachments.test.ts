import { describe, expect, test } from "bun:test";
import { formatBytes } from "./attachments";

describe("formatBytes", () => {
  test("schreibt Größen so, wie man sie liest", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(2_517_483)).toBe("2,4 MB");
  });

  test("Dezimalkomma statt Punkt", () => {
    expect(formatBytes(1_600_000)).toContain(",");
  });
});
