import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, LogOut, Trash2 } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Wie in trip-sync: der generierte Typ kennt die neue Funktion noch nicht,
 * weil er vor der Migration erzeugt wurde. Faellt weg, sobald
 * `supabase gen types typescript` gelaufen ist.
 */
const db = supabase as unknown as SupabaseClient;
import { signOut, useProfile, useSession } from "@/lib/auth";
import { Card, CardTitle, Field, PrimaryButton, inputClass } from "@/components/app/AppShell";
import { authErrorMessage, type AuthMessage } from "@/lib/auth-errors";
import { downloadAllTrips, useTrip } from "@/lib/trip-store";

export const Route = createFileRoute("/einstellungen")({
  head: () => ({
    meta: [{ title: "Einstellungen – kialia" }, { name: "robots", content: "noindex" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const { profile } = useProfile(session?.user.id);
  const { trips } = useTrip();

  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState<AuthMessage | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profile) setName(profile.name);
  }, [profile]);

  async function saveName() {
    if (!session) return;
    setMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim().slice(0, 100) })
      .eq("id", session.user.id);
    if (error) {
      setMsg(authErrorMessage(error));
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  /**
   * Konto löschen.
   *
   * Bewusst mit Tippbestätigung statt eines Ja/Nein-Dialogs: das hier ist
   * unwiderruflich und nimmt Mitreisenden die gemeinsame Reise mit. Wer das
   * Wort abtippt, hat es gelesen.
   */
  async function deleteAccount() {
    setDeleting(true);
    setMsg(null);
    try {
      const { error } = await db.rpc("delete_own_account");
      if (error) throw error;
      await supabase.auth.signOut();
      window.localStorage.clear();
      navigate({ to: "/auth", replace: true });
    } catch (err) {
      setMsg(authErrorMessage(err));
      setDeleting(false);
    }
  }

  return (
    <div className="acrylic-page min-h-screen px-5 pb-16 pt-6">
      <div className="mx-auto max-w-lg">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-foreground/70"
        >
          <ChevronLeft className="size-4" /> Zurück
        </button>

        <h1 className="text-[1.35rem] font-extrabold leading-tight tracking-[-0.02em]">
          Einstellungen
        </h1>

        <div className="mt-5 space-y-4">
          <Card>
            <CardTitle>Dein Profil</CardTitle>
            <div className="mt-3">
              <Field label="Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Wie sollen wir dich nennen?"
                  className={inputClass}
                />
              </Field>
            </div>
            <PrimaryButton onClick={saveName} className="mt-3">
              {saved ? "Gespeichert" : "Namen speichern"}
            </PrimaryButton>
          </Card>

          <Card>
            <CardTitle>Konto</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{session?.user.email}</p>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate({ to: "/auth", replace: true });
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold transition hover:bg-secondary/70"
            >
              <LogOut className="size-4" /> Abmelden
            </button>
          </Card>

          <Card>
            <CardTitle>Deine Daten</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {trips.length === 1 ? "Eine Reise" : `${trips.length} Reisen`} auf diesem Gerät.
              Angehängte Belege liegen nur hier und wandern nicht mit.
            </p>
            <button
              type="button"
              onClick={() => downloadAllTrips(trips)}
              disabled={!trips.length}
              className="mt-3 w-full rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold transition hover:bg-secondary/70 disabled:opacity-50"
            >
              Alle Reisen sichern
            </button>
          </Card>

          <Card>
            <CardTitle>Konto löschen</CardTitle>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Das entfernt dein Konto, deine Reisen und alle Tagebucheinträge endgültig.{" "}
              <span className="font-medium text-foreground">
                Reisen, die dir gehören, verschwinden auch für die anderen Mitreisenden.
              </span>{" "}
              Das lässt sich nicht rückgängig machen.
            </p>

            <div className="mt-3">
              <Field label="Tippe LÖSCHEN, um fortzufahren">
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="LÖSCHEN"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  className={inputClass}
                />
              </Field>
            </div>

            <button
              type="button"
              onClick={deleteAccount}
              disabled={confirmText !== "LÖSCHEN" || deleting}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive px-4 py-3 text-sm font-semibold text-background transition disabled:opacity-40"
            >
              <Trash2 className="size-4" />
              {deleting ? "Wird gelöscht …" : "Konto endgültig löschen"}
            </button>

            {msg && (
              <div
                role="status"
                className="mt-3 rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <p className="font-medium">{msg.text}</p>
                {msg.action && <p className="mt-0.5 text-xs opacity-90">{msg.action}</p>}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
