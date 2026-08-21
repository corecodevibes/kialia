import { describe, expect, test } from "bun:test";
import { onboardingGate } from "./onboarding-gate";

describe("onboardingGate", () => {
  test("die Endlosschleife: offline, Onboarding war laengst erledigt", () => {
    // Vorher landete dieser Fall auf "onboarding" — und von dort per
    // fehlgeschlagenem upsert wieder hierher.
    expect(onboardingGate({ profileDone: null, loadFailed: true, cachedDone: true })).toBe("app");
  });

  test("Server antwortet: seine Aussage gilt, in beide Richtungen", () => {
    expect(onboardingGate({ profileDone: true, loadFailed: false, cachedDone: false })).toBe("app");
    expect(onboardingGate({ profileDone: false, loadFailed: false, cachedDone: true })).toBe(
      "onboarding",
    );
  });

  test("neuer Nutzer offline wird weder eingelassen noch ins Onboarding geschickt", () => {
    expect(onboardingGate({ profileDone: null, loadFailed: true, cachedDone: false })).toBe(
      "offline-unknown",
    );
  });

  test("kein Profil trotz Antwort heisst Onboarding", () => {
    expect(onboardingGate({ profileDone: null, loadFailed: false, cachedDone: false })).toBe(
      "onboarding",
    );
  });
});
