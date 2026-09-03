import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Field, inputClass } from "@/components/app/AppShell";
import { authErrorMessage, type AuthMessage } from "@/lib/auth-errors";
import logo from "@/assets/kialia-logo.png";
import { Wordmark } from "@/components/app/bits";

export const Route = createFileRoute("/passwort-neu")({
  head: () => ({
    meta: [{ title: "Neues Passwort – kialia" }, { name: "robots", content: "noindex" }],
  }),
  component: NewPasswordPage,
});

const schema = z.object({
  password: z.string().min(6, { message: "Mindestens 6 Zeichen" }).max(72),
});

/**
 * Landeseite des Rücksetz-Links.
 *
 * Der Client nimmt den Token aus der URL selbst auf (detectSessionInUrl).
 * Entscheidend ist, danach zu prüfen, ob wirklich eine Sitzung entstanden ist —
 * "die Seite hat sich geöffnet" ist kein Beleg dafür, dass der Link gewirkt hat.
 */
function NewPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<AuthMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setHasSession(!!session);
      setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setHasSession(!!data.session);
      setReady(true);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const parsed = schema.safeParse({ password });
    if (!parsed.success) {
      setMsg({ text: parsed.error.issues[0]?.message ?? "Bitte Eingabe prüfen." });
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate({ to: "/", replace: true }), 1400);
    } catch (err) {
      setMsg(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="acrylic-page flex min-h-screen items-center justify-center px-5 py-10">
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src={logo}
            alt="kialia Logo"
            width={160}
            height={160}
            className="size-24 rounded-3xl shadow-sm"
          />
          <h1 className="mt-4">
            <Wordmark />
          </h1>
        </div>

        <div className="rounded-3xl bg-card p-5" style={{ boxShadow: "var(--shadow-soft)" }}>
          {!ready ? (
            <p className="text-sm text-muted-foreground">Einen Moment …</p>
          ) : done ? (
            <>
              <h2 className="display text-[1.15rem]">Passwort geändert</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Du bist angemeldet. Es geht gleich weiter.
              </p>
            </>
          ) : !hasSession ? (
            <>
              <h2 className="display text-[1.15rem]">Dieser Link wirkt nicht mehr</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Rücksetz-Links gelten aus Sicherheitsgründen nur kurz und nur einmal. Fordere
                einfach einen neuen an.
              </p>
              <button
                type="button"
                onClick={() => navigate({ to: "/auth" })}
                className="acrylic-warm mt-4 w-full rounded-2xl px-4 py-3.5 text-sm font-semibold text-background"
              >
                Zurück zur Anmeldung
              </button>
            </>
          ) : (
            <form onSubmit={submit}>
              <h2 className="display text-[1.15rem]">Neues Passwort</h2>
              <p className="mt-1 mb-3 text-sm text-muted-foreground">
                Wähle ein neues Passwort für dein Konto.
              </p>
              <Field label="Neues Passwort">
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="mind. 6 Zeichen"
                  className={inputClass}
                />
              </Field>

              {msg && (
                <div
                  role="status"
                  className="mt-3 rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <p className="font-medium">{msg.text}</p>
                  {msg.action && <p className="mt-0.5 text-xs opacity-90">{msg.action}</p>}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="acrylic-warm mt-4 w-full rounded-2xl px-4 py-3.5 text-sm font-semibold text-background disabled:opacity-60"
              >
                {busy ? "Einen Moment …" : "Passwort speichern"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
