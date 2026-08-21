# App Review — Kialia · Vollreview · 21.08.2026

**Stage:** pre-launch (Build existiert, nicht im Store)
**Score: 27.0/100 — Kill or pivot (Bandgrenze; siehe Einordnung unten)**
**The one thing:** Reisedaten aus dem `localStorage` nach Supabase holen — davon hängen Teilen, Retention und Vertrauen gleichzeitig ab.

## Einordnung der Zahl

27 löst laut Rubrik "Kill or pivot" aus. Das halte ich hier für ein Fehlurteil
der Skala, und zwar aus einem nachvollziehbaren Grund: 40 der 100 gewichteten
Punkte (Monetarisierung, Store, Distribution, Unit Economics) messen
Launch-Maschinerie, die bewusst noch nicht existiert. Ich rechne sie nicht
schön — aber "Rework" trifft die Lage besser als "Kill": Wedge und Datenmodell
sind tragfähig, die Ausführung ist es nicht.

Was die Skala *zu Recht* hart bestraft, sind die Punkte 2, 3 und 5. Die sind
nicht "noch nicht gebaut", sondern strukturell falsch gebaut.

## Scorecard

| # | Kriterium | Score | Gewicht | Gewichtet | Warum |
|---|---|---|---|---|---|
| 1 | Problem & Wedge | 5/10 | 15 | 7.5 | Sparraten-Rechner ("kann ich mir die Reise leisten?") ist ein echter, unbesetzter Wedge — steckt aber als Unterfunktion in `plan.tsx` statt in der Positionierung. README beschreibt eine Kategorie, keinen Moment. Polarsteps/Wanderlog besetzen Tagebuch und Route bereits. |
| 2 | Time-to-Value | 3/10 | 15 | 4.5 | Alle drei Red Flags gleichzeitig: Account-Wall vor jedem Wert, Onboarding fragt Präferenzen ab ohne etwas zu liefern, danach leere App mit Tipparbeit. Kein Seed-Content. |
| 3 | Onboarding & Aktivierung | 3/10 | 10 | 3.0 | Kein definiertes Aktivierungs-Event, keinerlei Instrumentierung. Regel der Rubrik: nicht benennbares Aktivierungs-Event deckelt bei 4. Die 2 Schritte fragen Name/Mitreisende/Kinder/Haustiere — reine Datenerhebung. |
| 4 | Monetarisierung | 1/10 | 15 | 1.5 | Nicht vorhanden. Kein Preis, kein Paywall-Modell, kein RevenueCat. |
| 5 | Retention & Habit | 3/10 | 10 | 3.0 | Reiseplanung ist von Natur aus stoßweise: intensiv vor der Reise, tot dazwischen. Das Tagebuch wäre der tägliche Loop *während* der Reise — es gibt aber keinen Trigger, der ihn auslöst. |
| 6 | Store-Präsenz | 1/10 | 10 | 1.0 | Existiert nicht. Bei pre-launch erwartbar, kostet aber 10 Punkte. |
| 7 | Distribution | 2/10 | 10 | 2.0 | Kein Kanal, kein Publikum. Bitter: der native virale Mechanismus ist da — jede Reise hat 1-4 Mitreisende, die eingeladen werden *müssen* — und ist als Attrappe gebaut. |
| 8 | Craft & Vertrauen | 4/10 | 10 | 4.0 | Visuell klar über Median (kohärentes Acryl-Theme, saubere Typo). Substanziell darunter: Datenverlust bei Cache-Leerung, toter Sprachmemo-Button, Blank-Screen als Ladezustand, keine Account-Löschung (App-Store-Pflicht), keine Datenschutzerklärung. |
| 9 | Unit Economics | 1/10 | 5 | 0.5 | Nichts zu rechnen, weil es keinen Preis gibt. |
| 10 | Durability & Moat | 3/10 | 0 | 0.0 | Gewichtung 0 bei pre-launch. Zur Information: die Reisehistorie *wäre* ein echter Wechselkosten-Effekt (Polarsteps-Modell) — sie akkumuliert nur nirgends. |
| | **Total** | | **100** | **27.0** | |

## Benchmark-Check

| Metrik | Deins | Median 2026 | Top-Quartil | Lesart |
|---|---|---|---|---|
| D1/D7/D30 Retention | nicht gemessen | — | — | blind |
| Download-to-paid | nicht gemessen | 2.1% Freemium / 10.7% Hard Paywall | 6.1%+ | blind |
| Trial-to-paid | kein Trial | 42.5% (17-32 Tage) | — | blind |
| Aktivierungsrate | kein Event definiert | — | — | blind |
| Realized LTV/Zahler J1 | kein Preis | ~$23 global, DACH näher an NA-Band | ~$32 NA | blind |

Der Funnel ist vollständig unvermessen. Drei Events müssen zuerst instrumentiert
werden: **Signup abgeschlossen**, **erste Reise mit Ziel+Datum angelegt**,
**erster Tagebucheintrag**. Ohne die kann keine spätere Optimierung bewertet werden.

## Board Notes

**Nikita Bier — Seconds-to-Value & native Viralität**
Die ersten zehn Sekunden bestehen aus einem Registrierungsformular. Es gibt
keinen Grund, das auszufüllen, weil der Nutzer noch nichts gesehen hat, was er
behalten will. Der härtere Einwand betrifft das Teilen: der Button verspricht
gemeinsames Planen und kopiert `window.location.origin`. Das ist kein fehlendes
Feature, das ist ein Versprechen, das beim ersten Test bricht — und zwar
gegenüber der Person, die dem Nutzer am nächsten steht. Sharing ist hier nativ
zum Produkt (eine Reise hat fast nie genau einen Teilnehmer); das ungenutzt zu
lassen ist der teuerste Einzelposten der Bewertung.

**Sarah Tavel — Hierarchy of Engagement**
Die Kernaktion ist "eine Reise planen". Ebene 1 verlangt eine wachsende Zahl
engagierter Nutzer, Ebene 2 dass der Nutzen sich mit Wiederholung *anreichert*,
Ebene 3 dass Verlassen teuer wird. Der `localStorage` zerstört alle drei
gleichzeitig: nichts akkumuliert über Geräte hinweg, nichts überlebt einen
Browserwechsel, und der Wechsel zu Wanderlog kostet exakt nichts. Die
Reisehistorie wäre der Wechselkosten-Effekt — sie wird nur nirgends aufbewahrt.

**Andrew Chen — The Cold Start Problem**
Reiseplanung ist ein Multiplayer-Problem, das hier als Singleplayer gebaut ist.
Jede Reise hat ihren eigenen Cold Start: allein ist die App ein besseres
Notizbuch, zu zweit ist sie ein Werkzeug. Die App wird also nicht nur "leer"
schlechter, sie wird *einsam* schlechter — und genau der Zustand ist der einzige,
den sie aktuell unterstützt.

**Pieter Levels / Marc Lou — Scope-Disziplin**
Fünf Module (Home, Ideen, Plan, Packliste, Tagebuch), keines fertig. Die
Packliste steht nicht mal im eigenen Konzept. Der Einwand: was hier fehlt, ist
nicht Zeit, sondern eine Streichliste.

**Wo die Linsen sich widersprechen — und das ist die eigentliche Entscheidung:**
Levels/Lou sagen: heute ausliefern, selbst nutzen, echtes Feedback holen. Tavel
sagt: einen kaputten Engagement-Loop auszuliefern verbrennt genau die ersten
Nutzer, die am wertvollsten sind. Beide haben recht, aber für verschiedene
Zeiträume. **Für heute gewinnt Levels** — Eigennutzung erzeugt Erkenntnis und
kostet keine Nutzerbeziehung. **Für den Launch gewinnt Tavel** — vor dem ersten
fremden Nutzer muss Persistenz und Teilen stehen. Was den Streit entscheidet:
eine echte Reise, mit dem Partner, mit der App geplant.

## Top 3 Fixes

**1. Reisedaten nach Supabase + echtes Teilen — Impact: hoch · Aufwand: L**
`trip-store.ts` schreibt alles in den Browser. Erste konkrete Aktion: Migration
mit `trips` und `trip_members` (Rolle owner/editor), RLS an
`auth.uid() IN (SELECT user_id FROM trip_members WHERE trip_id = ...)`, dann
`useTrip()` von localStorage auf Supabase umstellen — localStorage bleibt als
Offline-Cache. Danach den Teilen-Button auf echte Einladungslinks. Bewegt
Kriterium 5 (+3), 7 (+4) und 8 (+2) gleichzeitig: **≈ +9 Punkte**.

**2. Wert vor Login — Impact: hoch · Aufwand: M**
Erste konkrete Aktion: `/` ohne Session benutzbar machen, Reise in
localStorage anlegen lassen, Login erst beim Teilen oder beim zweiten Gerät
verlangen — und die lokal angelegte Reise beim Signup übernehmen. Genau der
Hebel, den du bei MealVibes schon gezogen hast. Kriterium 2 (+4) und 3 (+2):
**≈ +9 Punkte**.

**3. Die Lügen entfernen — Impact: mittel · Aufwand: S**
Ein Button, der gemeinsames Planen verspricht und eine URL kopiert; ein
Sprachmemo, das gegen einen abgeschalteten Gateway läuft. Beides sofort
entweder ehrlich beschriften oder ausblenden. Kriterium 8 (+2): **≈ +2 Punkte**.

Realistisches Ziel nach diesen drei: **≈ 47/100**. Die restlichen ~40 Punkte
(Monetarisierung, Store, Distribution) sind eigene Projekte, keine Fixes.

## Angenommen

- **Zielmarkt ist DACH, Preis später in EUR/CHF.** Ändert Kriterium 9 um ±1, wenn falsch.
- **Kein bestehendes Publikum, kein Marketingbudget.** Ändert Kriterium 7 um +3, wenn du eines hast.
- **Wettbewerber sind Wanderlog, TripIt, Polarsteps, Google Travel.** Ändert Kriterium 1 um ±2, wenn du auf eine Nische zielst, die ich nicht kenne.

## Kill-Kriterien

Wenn du nach **einer echten, vollständig mit Kialia geplanten Reise mit deinem
Partner** feststellst, dass ihr die gemeinsame Planung trotzdem in WhatsApp und
einer Tabelle gemacht habt — dann ist die Multiplayer-Prämisse falsch. Ehrliche
Konsequenz: auf den Sparraten-Rechner als Solo-Werkzeug pivotieren, den Rest
streichen.

Wenn nach drei Monaten kein einziger Nutzer außer dir eine zweite Reise anlegt,
ist es kein Produkt, sondern ein Projekt.

## Next Action

Reisedaten nach Supabase, mit `trip_members` von Anfang an — nicht nachrüsten.
Messgröße: **plane eine echte Reise mit deinem Partner darin, bis 15.09.2026.**
Wenn ihr dabei mehr als zweimal in WhatsApp ausweicht, ist Fix 1 nicht
ausreichend gebaut und der Rest der Roadmap ist Makulatur.
