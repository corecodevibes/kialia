import { defineConfig, loadEnv } from "vite";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ mode, command }) => {
  // Load-bearing: VITE_* Variablen werden explizit als `define` eingebacken.
  // Ohne das greift die Injektion im nitro-Server-Bundle nicht zuverlaessig und
  // die App startet in Produktion mit leeren Supabase-Credentials.
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const envDefine = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  );

  // Ein Produktionsbuild ohne Supabase-Credentials erzeugt ein Bundle, das
  // aussieht wie ein gutes, aber sich nicht verbinden kann — der Fehler faellt
  // erst im Browser auf. Deshalb hier hart abbrechen statt still durchlaufen.
  const REQUIRED_ENV = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"] as const;
  const missingEnv = REQUIRED_ENV.filter((key) => !env[key]);
  if (command === "build" && missingEnv.length > 0) {
    throw new Error(
      `Build abgebrochen: ${missingEnv.join(", ")} fehlt/fehlen. ` +
        `Liegt eine .env im Projektwurzelverzeichnis? Vorlage: .env.example`,
    );
  }

  return {
    define: envDefine,
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      // server.entry -> src/server.ts: unser SSR-Error-Wrapper, der von h3
      // verschluckte 500er in eine echte Fehlerseite uebersetzt.
      tanstackStart({ server: { entry: "server" } }),
      nitro({
        preset: "cloudflare-module",
        /**
         * Die HTML-Antwort kam ohne jede Cache-Vorgabe. Dann entscheidet der
         * Browser selbst, wie lange sie gilt — und Safari haelt eine zum
         * Homescreen hinzugefuegte Web-App hartnaeckig fest. Ergebnis: eine
         * Auslieferung ist draussen, aber auf dem Geraet aendert sich nichts,
         * und niemand versteht warum. Genau das ist im Simulator passiert.
         *
         * Das HTML muss deshalb bei jedem Aufruf nachfragen; dank ETag kostet
         * das im Normalfall nur eine leere Antwort. Die Dateien unter /assets
         * tragen einen Hash im Namen und duerfen dafuer ewig liegen bleiben —
         * bei einer neuen Fassung heissen sie ohnehin anders.
         */
        routeRules: {
          // Seiten muessen bei jedem Aufruf nachfragen. Dank ETag kostet das
          // im Normalfall eine leere Antwort.
          //
          // Bewusst einzeln aufgezaehlt statt "/**": eine Regel auf alles wird
          // von nitro mit der Asset-Regel ZUSAMMENGEFUEHRT, und heraus kam
          // "no-cache, public, max-age=31536000, immutable" — no-cache gewinnt,
          // und die Dateien mit Hash im Namen wuerden bei jedem Start erneut
          // erfragt. Nachgemessen, nicht vermutet.
          //
          // Kommt eine neue Seite dazu, gehoert sie hierhin. Vergisst man sie,
          // faellt sie auf das bisherige Verhalten zurueck — unschoen, aber
          // nicht kaputt.
          "/": { headers: { "cache-control": "no-cache" } },
          "/auth": { headers: { "cache-control": "no-cache" } },
          "/onboarding": { headers: { "cache-control": "no-cache" } },
          "/plan": { headers: { "cache-control": "no-cache" } },
          "/ideen": { headers: { "cache-control": "no-cache" } },
          "/packliste": { headers: { "cache-control": "no-cache" } },
          "/tagebuch": { headers: { "cache-control": "no-cache" } },
          "/einstellungen": { headers: { "cache-control": "no-cache" } },
          "/passwort-neu": { headers: { "cache-control": "no-cache" } },
          "/datenschutz": { headers: { "cache-control": "no-cache" } },
          "/impressum": { headers: { "cache-control": "no-cache" } },
          // Der Service Worker darf NIE aus dem Cache kommen. Steckt eine alte
          // Fassung im Browser-Cache, bleibt sie es auch nach einem Deploy —
          // und ein Service Worker, den man nicht mehr austauschen kann, ist
          // die schlechteste Sorte Fehler.
          "/sw.js": { headers: { "cache-control": "no-cache, no-store, must-revalidate" } },
          // Hash im Namen: eine neue Fassung heisst ohnehin anders.
          "/assets/**": {
            headers: { "cache-control": "public, max-age=31536000, immutable" },
          },
          "/fonts/**": {
            headers: { "cache-control": "public, max-age=31536000, immutable" },
          },
        },
        cloudflare: {
          wrangler: {
            // Explizit gesetzt: ohne name leitet nitro ihn aus der Git-Remote ab
            // und wir haetten "corecodevibes-kialia".
            name: "kialia",
            // Fest gepinnt statt aus dem Buildtag abgeleitet: nitro nimmt sonst
            // das lokale Datum, und bei Cloudflare (UTC) liegt das abends in
            // der Zukunft — die API lehnt den Deploy dann ab.
            compatibility_date: "2026-08-21",
            // Custom Domains: wrangler legt DNS-Eintrag und Zertifikat selbst
            // an. www bewusst mit — sonst laeuft jeder, der es eintippt, in
            // einen Fehler statt auf die App.
            routes: [
              { pattern: "kialia.app", custom_domain: true },
              { pattern: "www.kialia.app", custom_domain: true },
            ],
          },
        },
      }),
      viteReact(),
    ],
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      // Doppelte React-/Query-Instanzen fuehren zu Hook-Fehlern zur Laufzeit.
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    server: { host: true, port: 8080 },
  };
});
