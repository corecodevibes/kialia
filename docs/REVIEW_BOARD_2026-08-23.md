# App Review — Kialia · Re-Review · 23.08.2026

**Stage:** pre-launch (unverändert)
**Score: 35.5/100** — vorher 27.0 · **+8.5**
**Verdict: Rework** (vorher: Kill-or-pivot-Band)
**The one thing:** Wert vor dem Login — der einzige empfohlene Fix, der bisher ignoriert wurde.

## Scorecard mit Delta

| # | Kriterium | 21.08. | 23.08. | Δ | Warum |
|---|---|---|---|---|---|
| 1 | Problem & Wedge | 5 | **6** | +1 | Der Sparraten-Wedge ist jetzt als Fortschritt sichtbar statt als nackte Zahl, und der Plan-Tab plant tatsächlich (Reiseverlauf). Positionierung weiterhin eine Kategorie, kein Moment. |
| 2 | Time-to-Value | 3 | **3** | 0 | Unverändert. Account-Wall vor jedem Wert, Onboarding liefert nichts. Der Leerzustand ist schöner, aber nicht schneller. |
| 3 | Onboarding & Aktivierung | 3 | **3** | 0 | Weiterhin kein definiertes Aktivierungs-Event, keine Instrumentierung. Regel der Rubrik deckelt bei 4. |
| 4 | Monetarisierung | 1 | **1** | 0 | Nicht vorhanden. |
| 5 | Retention & Habit | 3 | **5** | +2 | Daten überleben den Browser, sammeln sich an und liegen auf zwei Geräten. Der Sparfortschritt ist der erste Rückkehrgrund zwischen Reisen. Kein Trigger, keine Mitteilung — deshalb keine 6. |
| 6 | Store-Präsenz | 1 | **1** | 0 | Existiert nicht. |
| 7 | Distribution | 2 | **5** | +3 | Der native virale Mechanismus ist gebaut: jede Reise hat Mitreisende, die den Code brauchen. Vom Versprechen zur Funktion. Noch ungemessen, deshalb keine 7. |
| 8 | Craft & Vertrauen | 4 | **6** | +2 | Datenverlust bei Cache-Leerung behoben, Fokusring, reduced-motion, ehrliche Fehlermeldungen, keine falschen Versprechen mehr. Gegen 8 stehen: keine Account-Löschung, keine Datenschutzerklärung. |
| 9 | Unit Economics | 1 | **1** | 0 | Kein Preis, nichts zu rechnen. |
| 10 | Durability & Moat | 3 | **5** | +2 | Gewichtung 0 bei pre-launch. Die geteilte Reisehistorie ist jetzt ein echter Wechselkosten-Effekt statt einer Absichtserklärung. |
| | **Total** | **27.0** | **35.5** | **+8.5** | |

## Die empfohlenen Fixes — was daraus wurde

**Fix 1 · Reisedaten nach Supabase, echtes Teilen — UMGESETZT.**
Geschätzt waren +9 Punkte, eingetreten sind +8.5. `trips` als JSONB-Dokument,
`trip_members`, Einladungscode, Realtime. RLS gegen anonyme Zugriffe geprüft.

**Fix 2 · Wert vor dem Login — IGNORIERT.**
Unverändert: ohne Konto sieht man nichts. Damit bleiben Kriterium 2 und 3 auf
3, zusammen 25 gewichtete Punkte, von denen aktuell 7.5 realisiert sind. Das
ist der größte einzelne Rückstand im gesamten Board.

**Fix 3 · Die Lügen entfernen — UMGESETZT.**
Teilen-Attrappe, „alle mit dem Link können ergänzen" in der Packliste, totes
Sprachmemo. Alle drei behoben.

## Neue Befunde dieses Durchgangs

**Sicherheit, behoben:** An vier Stellen landete Nutzereingabe roh in einem
`href`. `normalizeUrl` greift nur beim Verlassen des Feldes, und über den
Abgleich kommen fremde Werte ganz ohne Prüfung an — ein `javascript:`-Link
wäre ausgeführt worden. Jetzt wird beim Anzeigen geprüft.

**Sicherheit, in Ordnung:** Anonyme Zugriffe scheitern am fehlenden GRANT
(42501), also vor RLS. Funktionen für anonyme Aufrufe gesperrt. Keine
Geheimnisse im Bundle.

**Neue Asymmetrie:** Reisedaten sind geteilt, Belege liegen weiterhin nur auf
dem jeweiligen Gerät. Für den Nutzer nicht erkennbar. Muss entweder aufgelöst
oder benannt werden.

**Privatsphäre, benannt:** Teilen schließt die Tagebucheinträge ein. Steht
jetzt in der App, bevor jemand den Code weitergibt.

## Blocker vor jeder Einreichung

- Account-Löschung in der App (fehlt vollständig)
- Datenschutzerklärung unter erreichbarer URL (fehlt)
- Kein Aktivierungs-Event, keine Instrumentierung — der Funnel ist blind

## Kill-Kriterien — unverändert

Wenn ihr die Reise ab Mittwoch mit der App plant und trotzdem mehr als zweimal
nach WhatsApp ausweicht, trägt die Multiplayer-Prämisse nicht.

## Next Action

**Wert vor dem Login.** Die Startseite ohne Konto benutzbar machen, Reise
lokal anlegen lassen, Konto erst beim Teilen verlangen — und die lokale Reise
beim Anmelden übernehmen. Der Mechanismus dafür existiert bereits: `syncTrips`
lädt genau das hoch, was vorher lokal entstanden ist.

Schätzung: Kriterium 2 auf 6, Kriterium 3 auf 5 → **≈ +6.5 Punkte auf 42**.
