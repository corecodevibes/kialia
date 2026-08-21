import { describe, expect, test } from "bun:test";
import { authErrorMessage } from "./auth-errors";

describe("authErrorMessage", () => {
  test("der Fehler, der eine echte Registrierung gestoppt hat", () => {
    const m = authErrorMessage(
      new Error("For security purposes, you can only request this after 51 seconds."),
    );
    expect(m.retryAfter).toBe(51);
    expect(m.text).not.toContain("security purposes");
    expect(m.action).toBeTruthy();
  });

  test("reicht NIE einen unbekannten Servertext durch", () => {
    const m = authErrorMessage(new Error("Unauthorized: No authorization header provided"));
    expect(m.text).not.toContain("Unauthorized");
    expect(m.text).not.toContain("authorization");
    expect(m.action).toBeTruthy();
  });

  test("offline ist ein Zustand, kein Fehler", () => {
    expect(authErrorMessage(new Error("Load failed")).offline).toBe(true);
    expect(authErrorMessage(new TypeError("Failed to fetch")).offline).toBe(true);
  });

  test("jede Meldung sagt, was war — und die meisten, was man tun kann", () => {
    for (const raw of [
      "Invalid login credentials",
      "Email not confirmed",
      "User already registered",
      "Password should be at least 6 characters",
      "Token has expired or is invalid",
      "irgendwas völlig Unbekanntes",
    ]) {
      const m = authErrorMessage(new Error(raw));
      expect(m.text.length).toBeGreaterThan(10);
      expect(m.text).not.toBe(raw);
    }
  });

  test("verkraftet null und Nicht-Fehler ohne zu werfen", () => {
    expect(authErrorMessage(null).text).toBeTruthy();
    expect(authErrorMessage(undefined).text).toBeTruthy();
    expect(authErrorMessage("kaputt").text).toBeTruthy();
  });
});
