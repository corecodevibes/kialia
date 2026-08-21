/**
 * Entscheidet, ob ein angemeldeter Nutzer in die App darf.
 *
 * Der Anlass ist eine Endlosschleife, die offline auftritt — also in genau der
 * Lage, in der eine Reise-App gebraucht wird:
 *
 *   1. Sitzung kommt aus dem localStorage und ist gueltig.
 *   2. Das Profil laesst sich nicht laden; postgrest-js loest mit einem
 *      Fehlerobjekt auf, `profile` wird null.
 *   3. Die Weiche liest "kein Profil" als "Onboarding nicht erledigt" und
 *      schickt den Nutzer ins Onboarding.
 *   4. Dort speichert `finish()` per upsert — offline vergeblich — und
 *      navigiert trotzdem weiter.
 *   5. Die Weiche greift erneut. Zurueck zu Schritt 3.
 *
 * Der Fehler liegt in Schritt 3: **"unbekannt" ist nicht "nicht erledigt".**
 * Ein fehlgeschlagener Abruf darf keine Aussage ueber den Nutzer treffen.
 * Deshalb merken wir uns lokal, dass jemand das Onboarding abgeschlossen hat,
 * und lassen ihn damit auch dann hinein, wenn der Server nicht antwortet —
 * die Reisedaten liegen ohnehin auf dem Geraet.
 */

const KEY = "kialia.onboarded.v1";

export type GateInput = {
  /** Profil vom Server, oder null wenn keines existiert. */
  profileDone: boolean | null;
  /** Der Abruf ist gescheitert — wir wissen nichts, statt "nein" zu wissen. */
  loadFailed: boolean;
  /** Was wir lokal ueber diesen Nutzer wissen. */
  cachedDone: boolean;
};

export type GateResult = "app" | "onboarding" | "offline-unknown";

export function onboardingGate({ profileDone, loadFailed, cachedDone }: GateInput): GateResult {
  // Der Server hat geantwortet — seine Aussage gilt.
  if (!loadFailed) return profileDone ? "app" : "onboarding";

  // Kein Kontakt: lokales Wissen entscheidet.
  if (cachedDone) return "app";

  // Kein Kontakt und kein lokales Wissen. Weder hineinlassen noch ins
  // Onboarding schicken — beides waere geraten. Stattdessen sagen, was los ist.
  return "offline-unknown";
}

export function readOnboardedCache(userId: string | undefined): boolean {
  if (!userId || typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw)[userId] === true : false;
  } catch {
    return false;
  }
}

export function writeOnboardedCache(userId: string, done: boolean) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    map[userId] = done;
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* Speicher voll oder blockiert — dann eben ohne Merker. */
  }
}
