import { expect, test } from "bun:test";
import { guessIdeaKind } from "./idea-kind";

test("erkennt Essen an typischen Woertern", () => {
  expect(guessIdeaKind("Taverne in Chania, Meze probieren").kind).toBe("restaurant");
  expect(guessIdeaKind("Frühstück am Hafen").kind).toBe("restaurant");
});

test("erkennt Aktivitaeten", () => {
  expect(guessIdeaKind("Samaria-Schlucht wandern").kind).toBe("aktivitaet");
  expect(guessIdeaKind("Bootstour zur Bucht").kind).toBe("aktivitaet");
});

test("zieht den Link heran, wenn der Text nichts hergibt", () => {
  const g = guessIdeaKind("Das hier noch", ["https://www.getyourguide.com/kreta"]);
  expect(g).toEqual({ kind: "aktivitaet", sure: true });
});

test("gibt zu, wenn es unklar ist — statt zu raten", () => {
  expect(guessIdeaKind("Nochmal nachfragen bei Nikos").sure).toBe(false);
  // Beides drin: die App darf das nicht still entscheiden.
  expect(guessIdeaKind("Taverne am Strand, danach schwimmen").sure).toBe(false);
});

test("ist gegen leere und kaputte Eingaben robust", () => {
  expect(guessIdeaKind("").kind).toBe("sonstiges");
  expect(guessIdeaKind("   ", []).sure).toBe(false);
});
