import { expect, test } from "bun:test";
import { stripDataUrl } from "./use-voice-memo";

test("schneidet den data-URL-Kopf ab", () => {
  expect(stripDataUrl("data:audio/wav;base64,UklGRiQ=")).toBe("UklGRiQ=");
  expect(stripDataUrl("data:audio/mp4;codecs=mp4a;base64,AAAA")).toBe("AAAA");
});

test("lässt reines base64 unangetastet", () => {
  expect(stripDataUrl("UklGRiQAAABXQVZF")).toBe("UklGRiQAAABXQVZF");
  expect(stripDataUrl("")).toBe("");
});

test("stolpert nicht über einen data-Präfix ohne Komma", () => {
  expect(stripDataUrl("data:kaputt")).toBe("data:kaputt");
});
