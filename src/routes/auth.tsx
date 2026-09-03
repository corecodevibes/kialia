import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Field, inputClass } from "@/components/app/AppShell";
import { authErrorMessage, type AuthMessage } from "@/lib/auth-errors";
import logo from "@/assets/kialia-logo.png";
import { peekInvite } from "@/lib/pending-invite";
import { LegalFooter } from "@/components/app/legal";
import { Wordmark } from "@/components/app/bits";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Anmelden – Reiseplaner & Reisetagebuch" },
      {
        name: "description",
        content:
          "Melde dich an, um deine Reisen zu planen, dein Budget im Blick zu behalten und dein Reisetagebuch zu führen.",
      },
      { property: "og:title", content: "Anmelden – Reiseplaner & Reisetagebuch" },
      {
        property: "og:description",
        content: "Konto erstellen und Reisen planen, Budget kalkulieren, Erinnerungen festhalten.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email({ message: "Bitte gültige E-Mail eingeben" }).max(255),
  password: z.string().min(6, { message: "Mindestens 6 Zeichen" }).max(72),
});

type Phase = "form" | "signup-sent" | "reset-sent";

function AuthPage() {
  const navigate = useNavigate();
  const { session, ready } = useSession();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [phase, setPhase] = useState<Phase>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<AuthMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (ready && session && window.location.pathname !== "/onboarding")
      navigate({ to: "/onboarding", replace: true });
  }, [ready, session, navigate]);

  // Sichtbarer Countdown statt einer Sackgasse: wer zu schnell nochmal tippt,
  // soll sehen, wie lange noch, und nicht raten.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function fail(err: unknown) {
    const m = authErrorMessage(err);
    setMsg(m);
    if (m.retryAfter) setCooldown(m.retryAfter);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setMsg({ text: parsed.error.issues[0]?.message ?? "Bitte Eingabe prüfen." });
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/onboarding` },
        });
        if (err) throw err;
        // Ohne bestaetigte Adresse entsteht keine Session, also wuerde ohne
        // diesen Zustand sichtbar gar nichts passieren — genau der Fehler,
        // der zum doppelten Klick und zur Rate-Limit-Meldung gefuehrt hat.
        setPhase("signup-sent");
        setCooldown(30);
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (err) throw err;
      }
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    setMsg(null);
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/onboarding` },
      });
      if (err) throw err;
      setMsg({ text: "Neue E-Mail unterwegs." });
      setCooldown(30);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function requestReset() {
    setMsg(null);
    const mail = z.string().trim().email().safeParse(email);
    if (!mail.success) {
      setMsg({
        text: "Trag zuerst deine E-Mail-Adresse ein.",
        action: "Dann schicken wir dir einen Link.",
      });
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(mail.data, {
        redirectTo: `${window.location.origin}/passwort-neu`,
      });
      if (err) throw err;
      setPhase("reset-sent");
      setCooldown(30);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  function backToForm() {
    setPhase("form");
    setMsg(null);
    setPassword("");
  }

  const Notice = () =>
    msg ? (
      <div
        role="status"
        className={`mt-3 rounded-2xl px-3 py-2 text-sm ${
          msg.offline ? "bg-secondary text-foreground" : "bg-destructive/10 text-destructive"
        }`}
      >
        <p className="font-medium">{msg.text}</p>
        {msg.action && <p className="mt-0.5 text-xs opacity-90">{msg.action}</p>}
        {cooldown > 0 && (
          <p className="mt-1 text-xs tabular-nums opacity-90">Noch {cooldown} Sekunden.</p>
        )}
      </div>
    ) : null;

  if (phase !== "form") {
    const isSignup = phase === "signup-sent";
    return (
      <AuthFrame>
        <div className="rounded-[var(--radius)] border border-border bg-card p-5 shadow-[var(--sh-2)]">
          <h2 className="text-lg font-bold">
            {isSignup ? "Fast geschafft" : "Link ist unterwegs"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Wir haben eine E-Mail an <span className="font-medium text-foreground">{email}</span>{" "}
            geschickt.{" "}
            {isSignup
              ? "Öffne den Link darin — danach geht es direkt weiter."
              : "Darin setzt du ein neues Passwort."}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Nichts angekommen? Sieh auch im Spam-Ordner nach.
          </p>

          <Notice />

          {isSignup && (
            <button
              type="button"
              onClick={resendConfirmation}
              disabled={busy || cooldown > 0}
              className="mt-4 w-full rounded-full bg-secondary px-4 py-3 text-sm font-semibold transition active:scale-[0.985] disabled:opacity-40"
            >
              {cooldown > 0 ? `Erneut senden in ${cooldown}\u00a0s` : "E-Mail erneut senden"}
            </button>
          )}
          <button
            type="button"
            onClick={backToForm}
            className="mt-2.5 w-full rounded-full px-4 py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Andere Adresse verwenden
          </button>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame>
      <form
        onSubmit={submit}
        className="rounded-[var(--radius)] border border-border bg-card p-5 shadow-[var(--sh-2)]"
      >
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-secondary p-1 text-sm font-medium">
          {(["signup", "login"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setMsg(null);
              }}
              className={`rounded-full py-2 transition ${
                mode === m
                  ? "bg-card text-foreground shadow-[var(--sh-1)]"
                  : "text-muted-foreground"
              }`}
            >
              {m === "signup" ? "Registrieren" : "Anmelden"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <Field label="E-Mail">
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@beispiel.de"
              className={inputClass}
            />
          </Field>
          <Field label="Passwort">
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mind. 6 Zeichen"
              className={inputClass}
            />
          </Field>
        </div>

        <Notice />

        <button
          type="submit"
          disabled={busy || cooldown > 0}
          className="mt-5 w-full rounded-full bg-[var(--clay)] px-4 py-3.5 text-sm font-semibold text-[#FFF7F3] shadow-[var(--sh-1)] transition active:scale-[0.985] disabled:opacity-40"
        >
          {busy
            ? "Einen Moment …"
            : cooldown > 0
              ? `Noch ${cooldown}\u00a0s`
              : mode === "signup"
                ? "Konto erstellen"
                : "Anmelden"}
        </button>

        {mode === "login" && (
          <button
            type="button"
            onClick={requestReset}
            disabled={busy}
            className="mt-2.5 w-full rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-40"
          >
            Passwort vergessen?
          </button>
        )}
      </form>
    </AuthFrame>
  );
}

/** Logo, Wortmarke und Verlaufshintergrund — in jedem Zustand gleich. */
function AuthFrame({ children }: { children: React.ReactNode }) {
  // Der Code liegt schon im Speicher — abgelegt von der Wurzelroute, bevor
  // hierher umgeleitet wurde. Nur nachsehen, nicht verbrauchen: eingeloest
  // wird er erst, wenn eine Anmeldung besteht.
  const [hasInvite, setHasInvite] = useState(false);
  useEffect(() => setHasInvite(peekInvite() !== null), []);

  return (
    <div className="acrylic-page flex min-h-screen items-center justify-center px-5 py-10">
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src={logo}
            alt="kialia Logo"
            width={160}
            height={160}
            className="size-32 rounded-3xl shadow-sm"
          />
          <h1 className="mt-4">
            <Wordmark size="lg" />
          </h1>
          <p className="mt-1.5 font-serif text-[15px] italic text-muted-foreground">
            See more. travel further.
          </p>
        </div>
        {/* Wer ueber einen Einladungslink kommt, wollte eine Reise sehen und
            landet auf einer Anmeldemaske. Ohne diesen Satz wirkt der Link
            kaputt und der Abbruch ist wahrscheinlicher als die Anmeldung. */}
        {hasInvite && (
          <div className="mb-4 rounded-[var(--radius)] border border-border bg-card/85 px-4 py-3 text-center text-sm">
            <p className="font-semibold">Du wurdest zu einer Reise eingeladen</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Leg kurz ein Konto an — danach ist die Reise sofort da.
            </p>
          </div>
        )}
        {children}
        {/* Muss vor der Anmeldung erreichbar sein: wer wissen will, was mit
            seinen Daten passiert, soll dafuer kein Konto anlegen muessen —
            und die Stores pruefen die Seiten, bevor ein Konto existiert. */}
        <LegalFooter />
      </div>
    </div>
  );
}
