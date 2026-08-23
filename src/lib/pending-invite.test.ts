import { expect, test } from "bun:test";
import { cleanCode, codeFromUrl, inviteUrl } from "./pending-invite";

test("säubert Codes auf das erlaubte Alphabet", () => {
  expect(cleanCode(" ab-12 cd ")).toBe("AB12CD");
  expect(cleanCode("<script>")).toBe("SCRIPT");
  expect(cleanCode("A".repeat(50)).length).toBe(12);
});

test("liest den Code aus der Adresse", () => {
  expect(codeFromUrl("?reise=abc123")).toBe("ABC123");
  expect(codeFromUrl("?reise=ab")).toBeNull();
  expect(codeFromUrl("?anderes=abc123")).toBeNull();
  expect(codeFromUrl("")).toBeNull();
});

test("baut einen Link, der wieder lesbar ist", () => {
  const url = inviteUrl("abc123", "https://kialia.app");
  expect(url).toBe("https://kialia.app/?reise=ABC123");
  expect(codeFromUrl(new URL(url).search)).toBe("ABC123");
});
