import { Link } from "@tanstack/react-router";
import { Home, Lightbulb, Wallet, BookOpen, Backpack } from "lucide-react";
import type { ReactNode } from "react";
import logo from "@/assets/travelivibes-logo.png";

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
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold leading-tight text-background drop-shadow-sm">
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
