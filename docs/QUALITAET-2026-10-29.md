# Qualitätsdurchgang — Messung vor und nach dem Umbau

**Messwerkzeug:** `~/.claude/skills/premium-app-design/scripts/audit.js` (Browser,
375 px). Gemessen wurden Plan, Packliste, Tagebuch, Ideen, Einstellungen und
Anmeldung. Das Onboarding wurde nur visuell geprüft.

| Befund | Vorher | Nachher |
|---|---|---|
| Schriftgrößen (ohne Eingabefelder) | 14 | 7 (12, 13, 15, 17, 20, 26, 34) |
| Eckenradien | 6 Werte | 3 Werte plus Pille |
| Ziele unter 44 px | 37 | 0 außer Rundungsfällen |
| Rahmen mit 1 px | 33 | 0 |
| Einzelwort-Zeilen am Ende von Fließtext | 1 | 0 |
| Überläufe, Emoji, Verläufe in Flächen | 0 | 0 |

## Bewusste Ausnahmen
- Eingabefelder bleiben bei **16 px**, sonst zoomt iOS beim Antippen hinein.
- Überschriften mit `text-wrap: balance` dürfen eine kürzere letzte Zeile haben.
- Der Untertitel auf der Anmeldung steht im Gegensatz zu den anderen Zeilen in
  zwei Zeilen, wenn die Breite es erzwingt. Bei Telefonbreite nicht der Fall.

## Offen
- Anmeldung und Onboarding visuell am Gerät prüfen (Onboarding nicht gemessen).
- Kontrast nur von Hand nachgerechnet, nicht im Audit.
- Bewegung (Dauer, Kurven) nicht gemessen.
