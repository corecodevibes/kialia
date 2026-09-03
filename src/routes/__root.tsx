import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SplashScreen } from "@/components/app/splash-screen";
import { codeFromUrl, rememberInvite } from "@/lib/pending-invite";
import { watchForStaleBuild } from "@/lib/stale-reload";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="display mt-4 text-[1.4rem] text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {}, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="display text-[1.4rem] text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "kialia – Reise planen, Budget & Reisetagebuch" },
      {
        name: "description",
        content: "Ideen sammeln, Kosten planen und jeden Reisetag festhalten – mit kialia.",
      },
      { name: "author", content: "CoreCodeVibes" },
      // Die Farbe der Statusleiste in der installierten App. Sie muss zur
      // OBERSTEN Flaeche passen, und das ist der Kopf mit dem Verlauf — dort
      // steht das Perlblau. Kurzzeitig stand hier #584876, weil Perlblau als
      // Flaechenfarbe unter Text ausgeschieden ist; das gilt fuer Knoepfe, nicht
      // fuer die Systemleiste, auf der kein Text von uns steht. Dunkles Violett
      // ergaebe einen harten Balken ueber einem hellen Kopf.
      { name: "theme-color", content: "#8F9BE0" },
      { name: "mobile-web-app-capable", content: "yes" },
      // Legacy-Pendant, das iOS bis heute auswertet.
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "kialia" },
      { property: "og:title", content: "kialia – Reise planen, Budget & Reisetagebuch" },
      {
        property: "og:description",
        content: "Ideen sammeln, Kosten planen und jeden Reisetag festhalten – mit kialia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "kialia – Reise planen, Budget & Reisetagebuch" },
      {
        name: "twitter:description",
        content: "Ideen sammeln, Kosten planen und jeden Reisetag festhalten – mit kialia.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      // iOS liest fuer den Homescreen dieses Icon, nicht die Manifest-Eintraege.
      { rel: "apple-touch-icon", href: "/icons/icon-180.png", sizes: "180x180" },
      // Die Schrift liegt unter /fonts und wird in styles.css deklariert —
      // kein Aufruf bei Google, also auch offline vorhanden. Vorgeladen wird
      // nur das Gewicht, das auf jedem Bildschirm zuerst sichtbar ist.
      {
        rel: "preload",
        href: "/fonts/manrope-latin-400.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <head>
        <HeadContent />
      </head>
      <body>
        {/* Streifen hinter der Statusleiste — an der Wurzel, nicht in der
            Bildschirmhuelle.
            `viewport-fit=cover` laesst Inhalt bis an den oberen Rand laufen,
            damit der Verlauf bis zum Rand geht. Zurueckgeben muss man den
            Abstand selbst. Er stand zuerst in AppShell und fehlte damit auf
            Datenschutz und Impressum — im iOS-Simulator lief die Ueberschrift
            dort unter die Uhrzeit. Es ist eine Eigenschaft des Geraets, nicht
            eines Bildschirms, also gehoert er hierhin. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-[60] backdrop-blur-md print:hidden"
          style={{
            height: "env(safe-area-inset-top)",
            background: "color-mix(in oklab, var(--background) 70%, transparent)",
          }}
        />
        <SplashScreen />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Einen Code aus dem Link sofort sichern — noch bevor irgendeine Route auf
  // die Anmeldung umleitet. Danach ist die Adresse weg, und mit ihr der Code.
  // Muss so frueh wie moeglich laufen: greift, bevor eine Route nachgeladen
  // wird und dabei auf eine geloeschte Datei stoesst.
  useEffect(() => watchForStaleBuild(), []);

  useEffect(() => {
    const code = codeFromUrl(window.location.search);
    if (!code) return;
    rememberInvite(code);
    // Aus der Adresszeile nehmen, damit ein Code nicht in Verlaeufen,
    // Lesezeichen oder geteilten Bildschirmfotos liegen bleibt.
    const url = new URL(window.location.href);
    url.searchParams.delete("reise");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
