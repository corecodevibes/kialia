# Capacitor-Spike: Analyse vor dem Umbau

**Stand:** 29.10.2026 · **Status:** Analyse abgeschlossen, Umbau nicht begonnen.

## Frage
Lässt sich kialia als statische Web-App verpacken, damit Capacitor daraus eine
native iOS- und Android-Hülle baut?

## Befund: Server-Code im Projekt

| Datei | Rolle | Für Capacitor |
|---|---|---|
| `src/start.ts` | Start-Instanz mit Request-Middleware (Fehlerseite, CSRF) | entfällt ohne Server-Funktionen |
| `src/integrations/supabase/auth-middleware.ts` | Server-Middleware, Supabase-Client auf dem Server | entfällt |
| `src/integrations/supabase/auth-attacher.ts` | Anbinden der Anmeldung an Funktionsaufrufe | entfällt |

- **Keine Server-Routen und keine `createServerFn`-Aufrufe** in der Oberfläche.
  Die Suche nach `createServerFn`, `createServerRoute`, `getRequest` und `.server.ts`
  findet nur die drei Middleware-Dateien oben.
- **Edge Functions** (`scan-beleg`, `transkribieren`, `vorschlaege`) laufen auf
  Supabase, nicht auf dem Cloudflare-Worker. Sie bleiben unberührt.
- **Deploy-Ziel** heute: Cloudflare Workers mit Preset `cloudflare-module`
  (nitro). Für Capacitor wäre ein statischer Build nötig.

## Was zu klären ist (nicht geprüft)

1. Ob TanStack Start einen reinen Client-Build ohne Server-Teil erzeugt, und wie
   dafür die Konfiguration aussieht. Das muss im Spike mit einem Build geprüft
   werden, nicht aus dem Code geschlossen.
2. Ob die Routen beim Laden Daten vom Server über die Middleware holen. Die
   Analyse hat keine solche Stelle gefunden, aber der Test am Build ist der
   Beweis.
3. Apple und Google Sign-In in der Hülle: Der Web-Login läuft im nativen Fenster
   nicht zuverlässig. Dafür braucht es Native Plugins. Das ist der aufwendigste
   Punkt.

## Vorgehen beim Spike (ein Tag)

1. Branch `spike/capacitor` anlegen, nicht auf `main`.
2. Konfiguration auf reinen Client-Build umstellen, Build laufen lassen.
3. `npx cap add ios` in einem Wegwerf-Ordner, nicht im Hauptrepo.
4. Auf dem Simulator prüfen: Anmeldung, Reise laden, Speichern, Teilen-Blatt.
5. Ergebnis hier festhalten, bevor entschieden wird.

## Nicht im Spike
Keine Änderung an der Datenbank, keine Änderung an der Auth, kein Store-Eintrag.
