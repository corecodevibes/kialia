# kialia

Reiseplaner-App (Route, Budget, Ideen, Reisetagebuch). Web live, Ziel iOS +
Android. Urspruenglich mit Lovable gebaut, seit 22.08.2026 vollstaendig geloest.

**Live:** https://kialia.app · **Repo:** corecodevibes/kialia (privat)

## Stack

TanStack Start + TanStack Router, React 19, Vite 8, Tailwind v4, Radix/shadcn,
Supabase. Deploy auf Cloudflare Workers (nitro, Preset `cloudflare-module`).

**Paketmanager ist bun, nicht npm.** `bun.lock` ist massgeblich.

## Befehle

    bun install
    bun run dev      # localhost:8080, bindet auch auf LAN
    bun run build
    bun run lint     # ~200 Prettier-Altlasten aus Lovable-Generat, bekannt
    bun run deploy   # build + wrangler deploy

**`wrangler deploy` nur aus dem Projektwurzelverzeichnis.** Aus `.output/server`
findet wrangler zwei konkurrierende Configs und bricht ab.

## Fallen, die schon Zeit gekostet haben

- **`define` fuer `VITE_*` in `vite.config.ts` ist load-bearing.** Ohne das
  greift die Env-Injektion im nitro-Server-Bundle nicht zuverlaessig und die
  App startet in Produktion ohne Supabase-Credentials. Nie entfernen.
- **Punkt-Notation bei `import.meta.env.VITE_X` beibehalten.** Vites `define`
  ersetzt nur diese; mit Klammer-Zugriff ist die Variable zur Laufzeit
  undefined. Typen stehen in `src/vite-env.d.ts`.
- **`compatibility_date` ist fest gepinnt.** Aus dem Buildtag abgeleitet liegt
  es abends gegenueber UTC in der Zukunft, Cloudflare lehnt mit 10021 ab.
- **`supabase db push` scheitert mit 403 bei "Initialising login role".** Der
  Management-API-Endpunkt ist fuer den Account gesperrt. Workaround mit
  `--db-url` steht in `docs/MIGRATION.md`, inklusive Prozentkodierung.
- **`.env` ist gitignored und existiert nur lokal.** Ein `git checkout` auf
  einen aelteren Commit, in dem sie noch getrackt war, ueberschreibt sie —
  der anschliessende Merge loescht sie dann ganz. Passiert am 22.08.2026:
  der Folgebuild lief ohne Credentials durch und wurde deployed. Seitdem
  bricht `vite.config.ts` den Produktionsbuild ab, wenn `VITE_SUPABASE_URL`
  oder `VITE_SUPABASE_PUBLISHABLE_KEY` fehlen. **Diesen Guard nicht entfernen.**
  Notfall-Wiederherstellung: `supabase projects api-keys --project-ref
  izxkcxqmzsaavkbprlfa` liefert den publishable Key.
- **Nach jedem Deploy Bundle-Hash live gegen lokal pruefen.** Und bei
  `grep` auf die Live-Seite `-a` verwenden: das HTML enthaelt Umlaute, sonst
  stuft grep es als Binaerdatei ein und liefert stillschweigend nichts.
- **`viewport-fit=cover` muss bleiben**, sonst liefert `env(safe-area-inset-*)`
  konstant 0 und die Tab-Leiste landet unter dem iPhone-Home-Indicator.

## Regeln

- **Keine Secrets im Repo.** `.env` ist gitignored. Ein `service_role`-Key
  gehoert niemals in Client-Code, `.env` oder Repo.
- **Jede Tabelle braucht RLS.** Migration ohne `ENABLE ROW LEVEL SECURITY` plus
  Policies gilt als unfertig. Policies an `auth.uid()` binden. Ausserdem
  explizite `GRANT`s — "Automatically expose new tables" ist im Projekt aus.
- **Zielplattform ist mobil.** Kein Code, der einen eigenen Server voraussetzt;
  Serverseitiges gehoert in Supabase Edge Functions.
- Migrationen additiv, nie bestehende Migrationsdateien editieren.
- Vor dem Commit: `bunx tsc --noEmit` und `bunx prettier --write` auf den
  geaenderten Dateien. Kein repo-weites Format, das verdeckt jeden Diff.

## Stand & naechster Schritt

Bewertung nach App-Review-Board: **27/100** (`docs/REVIEW_BOARD_2026-08-21.md`).
Offene Migrationsschritte: `docs/MIGRATION.md`.

Die eine Sache, die zaehlt: **Reisedaten liegen im `localStorage`**
(`src/lib/trip-store.ts`). Daraus folgt alles andere — kein Geraetewechsel,
kein Backup, und der Teilen-Mechanismus kann nicht echt werden. Naechster
Schritt ist `trips` + `trip_members` in Supabase mit RLS ueber die
Mitgliedschaft, localStorage bleibt Offline-Cache.
