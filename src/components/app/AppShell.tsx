import { Link } from "@tanstack/react-router";
import { Home, Lightbulb, Wallet, BookOpen } from "lucide-react";
import type { ReactNode } from "react";
import logo from "@/assets/travelivibes-logo.png";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/ideen", label: "Ideen", icon: Lightbulb },
  { to: "/plan", label: "Plan", icon: Wallet },
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
  return (
    <div className="min-h-screen bg-background">
      <header
        className="sticky top-0 z-30 px-5 pb-5 pt-6 print:hidden"
        style={{ background: "var(--gradient-sky)" }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <img
            src={logo}
            alt="TraveliVibes Logo"
            width={64}
            height={64}
            className="size-11 shrink-0 rounded-2xl bg-background/85 p-1.5"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-background/90">
              TraveliVibes
            </p>
            <h1 className="truncate text-2xl font-semibold leading-tight text-background">
              {title}
            </h1>
          </div>
        </div>
        {subtitle && (
          <p className="mx-auto mt-2 max-w-lg text-sm leading-snug text-background/90">
            {subtitle}
          </p>
        )}
      </header>

      <main className="mx-auto max-w-lg px-4 pb-28 pt-4 print:pb-0 print:pt-0">{children}</main>



      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition"
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
      className={`rounded-3xl bg-card p-4 ${className}`}
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      {children}
    </section>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary";
