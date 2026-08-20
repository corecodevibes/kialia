import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Field, inputClass } from "@/components/app/AppShell";
import logo from "@/assets/travelivibes-logo.png";

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

function AuthPage() {
  const navigate = useNavigate();
  const { session, ready } = useSession();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && session) navigate({ to: "/onboarding", replace: true });
  }, [ready, session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Eingabe prüfen");
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
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (err) throw err;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Etwas ist schiefgelaufen";
      setError(
        msg.includes("Invalid login credentials")
          ? "E-Mail oder Passwort stimmt nicht."
          : msg.includes("already registered")
            ? "Diese E-Mail ist schon registriert – bitte anmelden."
            : msg,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="acrylic-page flex min-h-screen items-center justify-center px-5 py-10">
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="App Logo" width={72} height={72} className="size-16 rounded-2xl shadow-sm" />
          <h1 className="mt-3 text-2xl font-semibold text-background drop-shadow-sm">
            Plane deine Reise
          </h1>
          <p className="mt-1 text-sm text-background/90">
            Organisation, Budget und Erinnerungen an einem Ort.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-3xl border border-border/60 bg-card p-5"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1 text-sm font-medium">
            {(["signup", "login"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`rounded-xl py-2 transition ${
                  mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
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

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="acrylic-warm mt-4 w-full rounded-2xl px-4 py-3.5 text-sm font-semibold text-background disabled:opacity-60"
          >
            {busy ? "Einen Moment …" : mode === "signup" ? "Konto erstellen" : "Anmelden"}
          </button>
        </form>
      </div>
    </div>
  );
}
