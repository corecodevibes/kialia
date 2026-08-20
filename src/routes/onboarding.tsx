import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Baby, Dog, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/lib/auth";
import { Field, inputClass } from "@/components/app/AppShell";
import logo from "@/assets/travelivibes-logo.png";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding – deine Reise vorbereiten" },
      {
        name: "description",
        content:
          "Ein paar kurze Fragen: Name, Reisebegleitung, Kinder und Haustiere – damit Packliste und Planung zu euch passen.",
      },
      { property: "og:title", content: "Onboarding – deine Reise vorbereiten" },
      {
        property: "og:description",
        content: "Kurz einrichten und direkt mit Planung, Budget und Reisetagebuch starten.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { session, ready } = useSession();
  const { profile, ready: profileReady } = useProfile(session?.user.id);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [companions, setCompanions] = useState("");
  const [hasKids, setHasKids] = useState(false);
  const [hasPets, setHasPets] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && !session && window.location.pathname !== "/auth") navigate({ to: "/auth", replace: true });
  }, [ready, session, navigate]);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setCompanions(profile.companions);
      setHasKids(profile.has_kids);
      setHasPets(profile.has_pets);
      if (profile.onboarding_done) navigate({ to: "/", replace: true });
    }
  }, [profile, navigate]);

  async function finish() {
    if (!session) return;
    setBusy(true);
    await supabase.from("profiles").upsert({
      id: session.user.id,
      name: name.trim().slice(0, 100),
      companions: companions.trim().slice(0, 200),
      has_kids: hasKids,
      has_pets: hasPets,
      onboarding_done: true,
    });
    setBusy(false);
    navigate({ to: "/", replace: true });
  }

  if (!ready || !profileReady) return <div className="acrylic-page min-h-screen" />;

  return (
    <div className="acrylic-page flex min-h-screen items-center justify-center px-5 py-10">
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-5 flex flex-col items-center text-center">
          <img src={logo} alt="App Logo" width={64} height={64} className="size-14 rounded-2xl shadow-sm" />
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-background/90">
            Schritt {step + 1} von 2
          </p>
        </div>

        <div
          className="rounded-3xl border border-border/60 bg-card p-5"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          {step === 0 ? (
            <div className="space-y-4">
              <h1 className="text-xl font-semibold">Schön, dass du da bist</h1>
              <Field label="Wie heißt du?">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  placeholder="Dein Name"
                  className={inputClass}
                />
              </Field>
              <Field label="Wer reist mit?">
                <input
                  value={companions}
                  onChange={(e) => setCompanions(e.target.value)}
                  maxLength={200}
                  placeholder="Partner, Familie, Freunde …"
                  className={inputClass}
                />
              </Field>

              <div className="space-y-2">
                <ToggleRow
                  icon={<Baby className="size-4" />}
                  label="Sind Kinder dabei?"
                  value={hasKids}
                  onChange={setHasKids}
                />
                <ToggleRow
                  icon={<Dog className="size-4" />}
                  label="Habt ihr Haustiere?"
                  value={hasPets}
                  onChange={setHasPets}
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="acrylic-warm w-full rounded-2xl px-4 py-3.5 text-sm font-semibold text-background"
              >
                Weiter
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h1 className="flex items-center gap-2 text-xl font-semibold">
                <Sparkles className="size-5 text-accent" />
                Kurz zur App
              </h1>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Diese App begleitet dich <strong className="text-foreground">vor, während und nach</strong>{" "}
                  deiner Reise. Sie hilft dir, organisiert zu bleiben und am Ende dein Budget im Blick zu
                  behalten.
                </p>
                <p>
                  Und du hast am Ende ein Tagebuch, das dich immer an die Reise erinnert. Man weiß nie, was
                  im Leben kommt – und heutzutage vergisst man schöne Sachen viel zu schnell.
                </p>
                <p>
                  Halte deine Organisation im Griff, plane dein Budget ein und halte deine Erinnerungen
                  täglich fest. Schau am Ende, ob du im Budget geblieben bist, und teile alles mit deiner
                  Begleitung oder deiner Familie.
                </p>
                <p className="text-foreground">
                  Bist du bereit, deine Reisen zu planen und Erinnerungen festzuhalten? Dann bist du genau
                  richtig hier.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="rounded-2xl border border-border px-4 py-3.5 text-sm font-medium"
                >
                  Zurück
                </button>
                <button
                  type="button"
                  onClick={finish}
                  disabled={busy}
                  className="acrylic-warm flex-1 rounded-2xl px-4 py-3.5 text-sm font-semibold text-background disabled:opacity-60"
                >
                  {busy ? "Einen Moment …" : "Los geht's"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex w-full items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-sm transition ${
        value ? "border-primary bg-primary/10" : "border-border"
      }`}
    >
      <span className={value ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      <span className="flex-1">{label}</span>
      <span className="text-xs font-semibold text-muted-foreground">{value ? "Ja" : "Nein"}</span>
    </button>
  );
}
