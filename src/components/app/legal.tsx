import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logo from "@/assets/kialia-logo.png";

/**
 * Gemeinsame Huelle fuer Datenschutz und Impressum.
 *
 * Beide Seiten muessen ohne Anmeldung erreichbar sein: die Stores pruefen sie,
 * bevor ein Konto existiert, und wer wissen will, was mit seinen Daten
 * passiert, soll sich dafuer nicht erst anmelden muessen.
 */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2">
          <img src={logo} alt="" className="size-8 rounded-xl" />
          <span className="text-sm font-semibold tracking-tight">kialia</span>
        </Link>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">{title}</h1>
        <div className="legal mt-5 space-y-5 text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>
        <div className="mt-10 flex gap-4 text-xs font-semibold">
          <Link to="/datenschutz" className="underline underline-offset-2">
            Datenschutz
          </Link>
          <Link to="/impressum" className="underline underline-offset-2">
            Impressum
          </Link>
          <Link to="/" className="underline underline-offset-2">
            Zur App
          </Link>
        </div>
      </div>
    </div>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="pt-2 text-base font-bold text-foreground">{children}</h2>;
}

/** Was noch fehlt, soll auffallen — nicht in einem grauen Absatz untergehen. */
export function Todo({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
      Noch zu ergänzen: {children}
    </p>
  );
}

export function LegalFooter() {
  return (
    <div className="mt-8 flex justify-center gap-4 text-xs text-muted-foreground">
      <Link to="/datenschutz" className="underline underline-offset-2">
        Datenschutz
      </Link>
      <Link to="/impressum" className="underline underline-offset-2">
        Impressum
      </Link>
    </div>
  );
}
