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

### 1. Eigenes Supabase-Projekt — ERLEDIGT 22.08.2026
Projekt `izxkcxqmzsaavkbprlfa` (EU Frankfurt, Free). Schema per
`supabase db push` eingespielt, Migrationsverlauf sauber. `.env` umgestellt,
`config.toml` zeigt auf den neuen Ref. `types.ts` blieb unveraendert gueltig,
weil das Schema identisch ist.

**Stolperstein fuer die Zukunft:** `supabase db push` und `migration list`
scheitern mit 403 bei "Initialising login role" — dieser Management-API-
Endpunkt ist fuer den Account gesperrt (andere Endpunkte wie `projects
api-keys` funktionieren). Workaround, der zuverlaessig laeuft:

    export PGPW="$(python3 -c 'import getpass,urllib.parse;print(urllib.parse.quote(getpass.getpass(),safe=""))')"
    supabase db push --db-url "postgresql://postgres:$PGPW@db.izxkcxqmzsaavkbprlfa.supabase.co:5432/postgres"
    unset PGPW

Die Prozentkodierung ist nicht optional — `--db-url` verlangt sie, und
Supabase-Passwoerter enthalten regelmaessig Zeichen, die eine URL zerreissen.
Die Direktverbindung ist ausserdem IPv6-only (kein A-Record).

**Sicherheitslage geprueft:** Anonyme Zugriffe scheitern bereits am fehlenden
GRANT (42501), also eine Ebene vor RLS — Folge davon, dass "Automatically
expose new tables" beim Projekt aus ist und die Migration nur `authenticated`
freigibt.

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

## Handy-Nutzung (PWA)

Manifest, Icons und Apple-Meta liegen vor, `display: standalone` ist gesetzt.
Im gleichen WLAN erreichbar unter `http://<LAN-IP>:8080` (Vite bindet dank
`host: true` auf alle Interfaces), dann "Zum Home-Bildschirm".

Bekannte Grenzen dieses Setups:
- **Nur im Heimnetz**, und nur solange `bun run dev` laeuft.
- **Kein Offline-Betrieb**: ein Service Worker braucht HTTPS, ueber LAN-HTTP
  gibt es keinen. Erst nach einem Deploy sinnvoll nachruestbar.
- **Getrennter Speicher**: eine Homescreen-Web-App hat unter iOS einen eigenen
  Storage-Container. In Safari eingegebene Reisen tauchen dort *nicht* auf.
  Uebertragung ueber Export/Import.
- **Schrift kommt vom CDN** (`fonts.googleapis.com`, siehe `__root.tsx`). Ohne
  Verbindung faellt die Typografie zurueck. Vor dem Capacitor-Build muss
  Manrope lokal eingebunden werden.

Naechster sinnvoller Schritt: Deploy auf Cloudflare Workers — der nitro-Preset
ist bereits `cloudflare-module`, der Build erzeugt `wrangler.json` von selbst.
Das gibt eine HTTPS-URL, macht das Handy unabhaengig vom Laptop und schaltet
Service Worker und Web Push frei.

## Produkt-Baustellen (unabhaengig von der Migration)

- **Alle Reisedaten liegen im `localStorage`** (`src/lib/trip-store.ts`).
  Kein Geraetewechsel, kein Backup, Cache leeren = Reise weg.
- **Der Partner-Link ist eine Attrappe**: `src/routes/index.tsx` kopiert nur
  `window.location.origin`. Der Partner oeffnet eine leere App. Gemeinsames
  Planen ist das Kernversprechen aus dem README und aktuell nicht eingeloest.
  Haengt direkt am Punkt darueber.
