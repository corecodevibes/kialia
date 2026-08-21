# Ablösung von Lovable — Stand & offene Schritte

## Erledigt (Branch `lovable-cut`)

- `@lovable.dev/vite-tanstack-config` entfernt, `vite.config.ts` durch eine
  Standard-Config ersetzt. Verhaltensgleich: gleiche Plugin-Reihenfolge
  (tailwind → tsconfigPaths → tanstackStart → nitro → react), `@`-Alias,
  React-/Query-Dedupe und das explizite `define` fuer `VITE_*`.
  **Das `define` ist load-bearing** — ohne greift die Env-Injektion im
  nitro-Server-Bundle nicht zuverlaessig.
- `.lovable/`, `src/lib/lovable-error-reporting.ts` geloescht.
- `src/integrations/supabase/client.server.ts` geloescht: war toter Code
  (kein einziger Import) und haette einen `service_role`-Key erzwungen.
- Branding raus aus `__root.tsx` (author, twitter:site, og:image auf Lovable-CDN).
- `bunfig.toml` bereinigt; der 24h-Supply-Chain-Guard bleibt.
- `.env` aus dem Git-Index entfernt und gitignored, `.env.example` angelegt.

## Offen — braucht Steffen

### 1. Eigenes Supabase-Projekt
Aktuell zeigt die App auf ein von Lovable Cloud provisioniertes Projekt.
Jetzt ist der guenstigste Moment fuer den Umzug: es existiert nur die Tabelle
`profiles`, alle Reisedaten liegen im `localStorage`. Es gibt also praktisch
nichts zu migrieren — nur Auth-Nutzer.

Schritte: neues Projekt anlegen, `supabase/migrations/*.sql` einspielen,
`.env` mit URL + publishable Key fuellen, `types.ts` neu generieren.

### 2. Sprachtranskription (`src/lib/transcribe.functions.ts`)
Nutzt noch `ai.gateway.lovable.dev` + `LOVABLE_API_KEY`. Ziel ist eine
**Supabase Edge Function**, nicht ein direkter OpenAI-Call aus einer
`createServerFn`: die App soll als statisches Bundle in die Stores, dort gibt
es keinen Server und kein sicheres Versteck fuer einen API-Key.

### 3. GitHub-Zugang
Repo ist privat, weder SSH-Key noch ein Token mit `Contents: Read and write`
sind eingerichtet. Ohne das ist kein `push` moeglich.

## Offen — technisch

### 4. SPA-Umbau (Voraussetzung fuer die Stores)
TanStack Start rendert serverseitig und baut ueber nitro zu einem Cloudflare
Worker. Capacitor braucht ein statisches Bundle. Nach Schritt 2 gibt es keine
Server-Funktion mehr, dann kann `ssr` aus und der nitro-Schritt entfallen.
Betroffen: `src/server.ts`, `src/start.ts`, `auth-middleware.ts`.

### 5. Capacitor + native Projekte
Erst nach Schritt 4. `/ios` und `/android` sind bereits gitignored.

### 6. Lint-Altlast
`bun run lint` meldet ~200 Prettier-Fehler aus generiertem Lovable-Code.
Als eigener Commit zu bereinigen, damit der Diff nicht andere Aenderungen
ueberdeckt.

## Produkt-Baustellen (unabhaengig von der Migration)

- **Alle Reisedaten liegen im `localStorage`** (`src/lib/trip-store.ts`).
  Kein Geraetewechsel, kein Backup, Cache leeren = Reise weg.
- **Der Partner-Link ist eine Attrappe**: `src/routes/index.tsx` kopiert nur
  `window.location.origin`. Der Partner oeffnet eine leere App. Gemeinsames
  Planen ist das Kernversprechen aus dem README und aktuell nicht eingeloest.
  Haengt direkt am Punkt darueber.
