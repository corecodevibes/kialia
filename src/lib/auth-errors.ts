/**
 * Uebersetzt Supabase-Auth-Fehler in Saetze, die eine Nutzerin lesen kann.
 *
 * Der Anlass: eine echte Registrierung zeigte mitten im Ablauf
 * "For security purposes, you can only request this after 51 seconds." —
 * englisch, technisch, ohne Ausweg. Deshalb gilt hier eine harte Regel:
 * **es wird nie ein Servertext durchgereicht.** Was wir nicht kennen, bekommt
 * eine allgemeine Meldung plus einen naechsten Schritt.
 */

export type AuthMessage = {
  /** Was war. */
  text: string;
  /** Was man jetzt tun kann. Leer, wenn der Text das schon sagt. */
  action?: string;
  /** Sekunden, die gewartet werden muessen — steuert den Countdown im UI. */
  retryAfter?: number;
  /** Kein Fehler, sondern ein Zustand: das Geraet ist offline. */
  offline?: boolean;
};

const RATE_LIMIT = /after (\d+) seconds?/i;

export function authErrorMessage(error: unknown): AuthMessage {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const m = raw.toLowerCase();

  // Offline ist ein Zustand, kein Fehler.
  if (m.includes("failed to fetch") || m.includes("networkerror") || m.includes("load failed")) {
    return {
      text: "Keine Verbindung zum Server.",
      action: "Sobald du wieder online bist, versuch es erneut.",
      offline: true,
    };
  }

  const limit = RATE_LIMIT.exec(raw);
  if (limit) {
    return {
      text: "Du warst etwas schnell — wir haben die Mail schon verschickt.",
      action: "Schau in dein Postfach. Eine neue kannst du gleich anfordern.",
      retryAfter: Number(limit[1]),
    };
  }

  if (m.includes("email rate limit exceeded") || m.includes("over_email_send_rate_limit")) {
    return {
      text: "Es wurden zu viele E-Mails an diese Adresse geschickt.",
      action: "Warte ein paar Minuten, bevor du es nochmal versuchst.",
    };
  }

  if (m.includes("invalid login credentials")) {
    return {
      text: "E-Mail oder Passwort stimmt nicht.",
      action: "Tippfehler im Passwort? Sonst kannst du es zurücksetzen.",
    };
  }

  if (m.includes("email not confirmed")) {
    return {
      text: "Diese Adresse ist noch nicht bestätigt.",
      action: "Öffne den Link in unserer E-Mail — dann kommst du rein.",
    };
  }

  if (m.includes("already registered") || m.includes("user_already_exists")) {
    return {
      text: "Diese E-Mail ist schon registriert.",
      action: "Wechsle auf „Anmelden“.",
    };
  }

  if (m.includes("password should be at least") || m.includes("weak_password")) {
    return { text: "Das Passwort ist zu kurz.", action: "Mindestens 6 Zeichen." };
  }

  if (m.includes("unable to validate email") || m.includes("invalid format")) {
    return { text: "Diese E-Mail-Adresse sieht nicht gültig aus." };
  }

  if (m.includes("signups not allowed") || m.includes("signup_disabled")) {
    return {
      text: "Neue Konten sind gerade nicht möglich.",
      action: "Bitte später nochmal versuchen.",
    };
  }

  if (m.includes("token has expired") || m.includes("otp_expired")) {
    return {
      text: "Dieser Link ist abgelaufen.",
      action: "Fordere einen neuen an — Links gelten aus Sicherheitsgründen nur kurz.",
    };
  }

  // Bewusst ohne `raw`: ein unbekannter Servertext hilft niemandem weiter.
  return {
    text: "Das hat gerade nicht geklappt.",
    action: "Versuch es nochmal. Bleibt es dabei, meld dich bei uns.",
  };
}
