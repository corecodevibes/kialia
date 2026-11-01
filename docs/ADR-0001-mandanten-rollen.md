# ADR-0001: Mandanten und Rollen

**Status:** Vorschlag, noch nicht entschieden · **Stand:** 29.10.2026
**Anlass:** Option B ist gewählt — kialia soll mehrere Gruppen, Rollen und
Berechtigungen tragen, nicht nur die Reise von zwei Personen.

## Ist-Zustand (aus dem Schema)

- **Mandant = Reise.** `trips` hat `owner_id`, `invite_code` (eindeutig) und ein
  `data`-Feld (jsonb), in dem die ganze Reise liegt.
- **Mitgliedschaft.** `trip_members` verknüpft Reise und Nutzer mit einer Rolle.
- **Rollen heute:** `owner` und `editor` (Prüfung per `check`-Constraint).
  Keine Betrachter-Rolle.
- **Einladung** über `invite_code`, Beitritt per Funktion `join_trip`, Verlassen
  per `leave_trip`.
- **Berechtigungen** liegen in Row-Level-Security auf `trips` und `trip_members`
  sowie in fünf `SECURITY DEFINER`-Funktionen. `auth.uid()` kommt an 15 Stellen in
  6 Migrationen vor.

## Optionen

**A · Reise bleibt Mandant, Rollen werden erweitert (empfohlen für den nächsten Schritt).**
Neue Rolle `viewer` (nur lesen) per Check-Constraint und Policy. Keine neue
Ebene. Passt zu dem, was es schon gibt.

**B · Zusätzliche Ebene „Gruppe" über den Reisen.**
Eine Gruppe (z. B. „Familie") enthält mehrere Reisen, und Rollen gelten auf
Gruppenebene. Nötig nur, wenn eine Person Reisen mit verschiedenen Gruppen
teilen soll, die nicht identisch sind.

**C · Clerk Organizations.** Verworfen für die Reisen-Struktur: eine Reise ist
keine Firma. Clerk würde zusätzlich die Auth wechseln, und das ist ein eigenes
Risiko (siehe NOW.md).

## Empfehlung

A jetzt. B erst, wenn es eine konkrete Gruppen-Anforderung gibt, die A nicht
abbildet. Die Entscheidung hängt an einer Frage an Steffen (siehe NOW.md).

## Regeln für jede Migration (aus den Projektfallen)

- Jede neue Tabelle im Schema `public` braucht ab 30.10.2026 **explizite GRANTs**
  in derselben Migration. Sonst ist sie für `authenticated` nicht erreichbar.
- Funktionen: `REVOKE … FROM public` und `GRANT EXECUTE … TO authenticated`
  ausdrücklich setzen (Gegenbeispiel war `is_trip_member`).
- Spaltenebene: Schreibrechte pro Spalte prüfen, wo Rollen unterschiedlich
  schreiben dürfen.
- Jede Änderung mit einer **Positiv- und einer Negativprobe** testen (Rolle darf,
  Rolle darf nicht).

## Offene Fragen an Steffen

1. Braucht ihr mehrere Gruppen, die nicht dieselben Reisen teilen (Option B)?
2. Soll ein Betrachter nur lesen dürfen, oder genügt „Mitbearbeiter" für alle?
