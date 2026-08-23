/**
 * Ein Einladungscode, der aus einem Link kommt und die Anmeldung ueberlebt.
 *
 * Der Weg ist: Link antippen -> Konto anlegen -> Mail bestaetigen -> zurueck
 * in die App. Zwischen dem ersten und dem letzten Schritt liegt ein
 * Seitenwechsel und womoeglich ein anderer Tag. Haelt man den Code nur im
 * Zustand der Seite, ist er nach dem ersten Schritt weg — und der Neuling
 * steht in einer leeren App und weiss nicht, warum die Reise fehlt, obwohl er
 * doch auf den Link geklickt hat.
 *
 * Deshalb localStorage und nicht sessionStorage: eine Bestaetigungsmail wird
 * oft in einem anderen Tab geoeffnet.
 */
const KEY = "kialia.pendingInvite";

/** Codes sind kurz und alphanumerisch — alles andere ist Unfug oder Angriff. */
export function cleanCode(raw: string): string {
  return (raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
}

export function rememberInvite(code: string): void {
  const clean = cleanCode(code);
  if (clean.length < 4) return;
  try {
    window.localStorage.setItem(KEY, clean);
  } catch {
    /* Kein Speicher: dann eben ohne — der Code steht ja noch im Feld. */
  }
}

/** Nur nachsehen, ohne zu verbrauchen. */
export function peekInvite(): string | null {
  try {
    const value = window.localStorage.getItem(KEY);
    return value && value.length >= 4 ? value : null;
  } catch {
    return null;
  }
}

export function takeInvite(): string | null {
  try {
    const value = window.localStorage.getItem(KEY);
    if (value) window.localStorage.removeItem(KEY);
    return value && value.length >= 4 ? value : null;
  } catch {
    return null;
  }
}

/** Liest den Code aus einer Adresse wie https://kialia.app/?reise=ABC123 */
export function codeFromUrl(search: string): string | null {
  try {
    const code = new URLSearchParams(search).get("reise");
    if (!code) return null;
    const clean = cleanCode(code);
    return clean.length >= 4 ? clean : null;
  } catch {
    return null;
  }
}

/** Der Link, der per Nachricht verschickt wird. */
export function inviteUrl(code: string, origin: string): string {
  return `${origin}/?reise=${encodeURIComponent(cleanCode(code))}`;
}
