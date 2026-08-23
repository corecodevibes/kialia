import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  EMPTY_TASTE,
  TASTE_OPTIONS,
  cleanPlace,
  loadTaste,
  saveTaste,
  type TasteProfile,
} from "@/lib/taste";
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
import { LegalFooter } from "@/components/app/legal";
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
  const [taste, setTaste] = useState<TasteProfile>(EMPTY_TASTE);
  const [tasteSaved, setTasteSaved] = useState(false);

  useEffect(() => setTaste(loadTaste()), []);

  function saveTasteProfile() {
    const clean = { ...taste, place: cleanPlace(taste.place) };
    saveTaste(clean);
    setTaste(clean);
    setTasteSaved(true);
    window.setTimeout(() => setTasteSaved(false), 2000);
  }

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

          {/* Reiseprofil. Nicht "was magst du?" — darauf antwortet niemand
              brauchbar — sondern "was hat dir DORT gefallen?". Ein Ort, den
              man kennt, ist die einzige Referenz, die wirklich traegt. */}
          <Card>
            <CardTitle>Wie ihr reist</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Einmal beantwortet — danach richten sich die Vorschläge bei jedem Ziel danach.
            </p>
            <div className="mt-3">
              <Field label="Eine Stadt oder Region, die ihr gut kennt">
                <input
                  value={taste.place}
                  maxLength={60}
                  onChange={(e) => setTaste({ ...taste, place: e.target.value })}
                  placeholder="z. B. Lissabon"
                  className={inputClass}
                />
              </Field>
            </div>
            <p className="mt-4 text-sm font-medium">Was hat euch dort am meisten gefallen?</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TASTE_OPTIONS.map((o) => {
                const on = taste.likes.includes(o.key);
                return (
                  <button
                    key={o.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setTaste({
                        ...taste,
                        likes: on
                          ? taste.likes.filter((k) => k !== o.key)
                          : [...taste.likes, o.key],
                      })
                    }
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      on ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Wird nur mitgeschickt, wenn ihr euch Vorschläge holt — und bleibt sonst auf diesem
              Gerät.
            </p>
            <PrimaryButton onClick={saveTasteProfile} className="mt-3">
              Speichern
            </PrimaryButton>
            {tasteSaved && (
              <p role="status" className="mt-2 text-sm text-muted-foreground">
                Gespeichert.
              </p>
            )}
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

          <LegalFooter />
        </div>
      </div>
    </div>
  );
}
