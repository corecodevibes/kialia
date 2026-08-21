import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Lightbulb, Wallet, BookOpen, Backpack, LogOut } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import logo from "@/assets/travelivibes-logo.png";
import { signOut, useProfile, useSession } from "@/lib/auth";
import { onboardingGate, readOnboardedCache } from "@/lib/onboarding-gate";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/ideen", label: "Ideen", icon: Lightbulb },
  { to: "/plan", label: "Plan", icon: Wallet },
  { to: "/packliste", label: "Packen", icon: Backpack },
  { to: "/tagebuch", label: "Tagebuch", icon: BookOpen },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, ready } = useSession();
  const { profile, failed, ready: profileReady } = useProfile(session?.user.id);

  // "Profil nicht abrufbar" ist keine Aussage darueber, ob jemand das
  // Onboarding erledigt hat. Ohne diese Unterscheidung landet offline jeder
  // zurueck im Onboarding — und von dort per fehlgeschlagenem Speichern
  // wieder hierher.
  const gate = onboardingGate({
    profileDone: profile ? !!profile.onboarding_done : null,
    loadFailed: failed,
    cachedDone: readOnboardedCache(session?.user.id),
  });

  useEffect(() => {
    if (ready && !session && pathname !== "/auth") navigate({ to: "/auth", replace: true });
  }, [ready, session, pathname, navigate]);

  useEffect(() => {
    if (session && profileReady && gate === "onboarding" && pathname !== "/onboarding") {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [session, profileReady, gate, pathname, navigate]);

  if (!ready || !session || !profileReady) {
    return <div className="acrylic-page min-h-screen" />;
  }

  // Kein Kontakt und kein lokaler Merker: nicht raten, sondern sagen was ist.
  // Eine leere Flaeche waere hier das Schlimmste — sie sieht aus wie ein
  // Absturz und nennt keinen naechsten Schritt.
  if (gate === "offline-unknown") {
    return (
      <div className="acrylic-page flex min-h-screen items-center justify-center px-6">
        <div className="relative z-10 max-w-sm rounded-3xl bg-card p-5 text-center">
          <h1 className="text-lg font-bold">Keine Verbindung</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Wir konnten dein Konto nicht laden. Sobald du wieder online bist, geht es weiter — deine
            Reisen auf diesem Gerät bleiben unberührt.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="acrylic-warm mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-background"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  if (gate !== "app") {
    return <div className="acrylic-page min-h-screen" />;
  }

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="acrylic-page min-h-screen">
      <header className="relative z-30 px-5 pb-6 pt-6 print:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <img
            src={logo}
            alt="App Logo"
            width={64}
            height={64}
            className="size-11 shrink-0 rounded-2xl shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold leading-tight tracking-tight text-background drop-shadow-sm">
              kialia · κιάλια
            </p>
            <h1 className="truncate text-sm font-medium leading-snug text-background/90">
              {title}
            </h1>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Abmelden"
            className="shrink-0 rounded-xl p-2 text-background/90 transition hover:bg-background/15"
          >
            <LogOut className="size-5" />
          </button>
        </div>
        {subtitle && (
          <p className="mx-auto mt-2 max-w-lg text-sm leading-snug text-background/90">
            {subtitle}
          </p>
        )}
      </header>

      <main className="relative z-10 mx-auto max-w-lg px-4 pb-28 pt-1 print:pb-0 print:pt-0">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card print:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-1 pb-[env(safe-area-inset-bottom)]">
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition"
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-3xl border border-border/60 bg-card p-4 ${className}`}
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      {children}
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="block truncate text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1 min-w-0">{children}</div>
    </label>
  );
}

/** Zwei Felder nebeneinander – auf sehr schmalen Displays untereinander. */
export function FieldRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[340px]:grid-cols-2 [&>*]:min-w-0">{children}</div>
  );
}

export const inputClass =
  "block w-full min-w-0 max-w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground transition focus:border-primary";

/** Datums-Felder: gleiches Aussehen, aber kompakter, damit nichts abgeschnitten wird. */
export const dateInputClass = `${inputClass} px-2.5 text-[13px] [&::-webkit-calendar-picker-indicator]:ml-0`;

export const selectClass = `${inputClass} appearance-none bg-background pr-8`;

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 mt-6 px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-background/95 drop-shadow-sm">
      {children}
    </h2>
  );
}

/** Einheitliche Überschrift innerhalb einer Karte – überall gleich. */
export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </h2>
  );
}

/** Einheitlicher Kennzahl-Block (z. B. Reisedauer, Gesamtkosten). */
export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="text-center">
      <CardTitle>{label}</CardTitle>
      <p className="mt-1 text-3xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  className = "",
  type = "button",
  disabled,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`acrylic-warm flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-background transition active:scale-[0.99] disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="acrylic-warm grid size-11 shrink-0 place-items-center rounded-xl text-background transition active:scale-95"
    >
      {children}
    </button>
  );
}

export function DeleteButton({
  onClick,
  ariaLabel = "Eintrag löschen",
}: {
  onClick: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
    >
      <span className="sr-only">{ariaLabel}</span>
      {/* Icon wird von der aufrufenden Seite gestellt */}
      <TrashIcon />
    </button>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-background/60 bg-background/25 py-3 text-sm font-semibold text-background backdrop-blur-sm transition hover:bg-background/40"
    >
      <span className="text-base leading-none">+</span> {label}
    </button>
  );
}

export function chipClass(active: boolean) {
  return `inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition ${
    active
      ? "border-primary bg-primary/10 text-primary"
      : "border-border bg-background text-muted-foreground"
  }`;
}
