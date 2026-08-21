# kialia — Arbeitsanweisungen

Reiseplaner-App (Web + iOS + Android). Eigenstaendig, keine Lovable-Kopplung mehr.

## Stack
TanStack Start + TanStack Router, React 19, Vite 8, Tailwind v4, Radix/shadcn, Supabase.
Paketmanager: **bun** (nicht npm — `bun.lock` ist massgeblich).

## Befehle
    bun install
    bun run dev      # localhost:8080
    bun run build
    bun run lint

## Regeln
- **Keine Secrets im Repo.** `.env` ist gitignored, `.env.example` ist die Vorlage.
  Ein `service_role`-Key gehoert niemals in Client-Code, .env oder Repo.
- **Jede Tabelle braucht RLS.** Migration ohne `ENABLE ROW LEVEL SECURITY` +
  Policies gilt als unfertig. Policies immer an `auth.uid()` binden.
- **Zielplattform ist mobil.** Kein Code, der einen eigenen Server voraussetzt.
  Serverseitiges laeuft in Supabase Edge Functions.
- Migrationen additiv halten, nie bestehende Migration-Dateien editieren.

## Bekannte Baustellen
Siehe `docs/MIGRATION.md`.
