---
name: app-store-ready
description: Bringt kialia in den App Store und haelt die Qualitaet auf Auszeichnungsniveau. Nutze diesen Skill bei allem, was mit Store-Reife zu tun hat - App Store Connect einrichten, Metadaten, Screenshots, Privacy-Labels und Datenschutz-Formular, Account-Loeschung, Einreichung, abgelehnte Reviews, TestFlight, Capacitor- oder Xcode-Builds, Signierung, Versionsnummern, Play Console - und ebenso bei Fragen zu Design-Qualitaet, Motion, Hero-Momenten, Widgets, Barrierefreiheit oder dem Apple Design Award. Greif auch dann zu, wenn der Nutzer nur sagt "koennen wir das einreichen", "ist das store-reif", "warum wurde die App abgelehnt", "wie machen wir die App besonders" oder an nativen Huellen arbeitet, ohne den Store ausdruecklich zu nennen.
---

# App Store Ready — kialia

Zweck: kialia einreichbar machen **und** so bauen, dass sie eine Auszeichnung
verdient haette. Das sind zwei verschiedene Latten. Die erste ist eine
Checkliste, die zweite ist Handwerk.

## Zuerst: was hier NICHT steht

Der Skill `app-review-board` enthaelt bereits `references/ship-gate.md` — die
allgemeine Einreichungs-Checkliste (Blocker, Commercial, Measurement, Listing,
Woche 1). **Lies die zuerst und arbeite sie ab.** Dieser Skill dupliziert sie
nicht, sondern ergaenzt, was dort fehlt: die konkreten Schritte in App Store
Connect, den Capacitor-Pfad dieses Projekts, die haeufigen Ablehnungsgruende
und die Kriterien fuer Design-Qualitaet.

## Regeln, die ueber allem stehen

**Store-Richtlinien aendern sich.** Nichts in diesem Skill ist ein Zitat aus
einer aktuellen Richtlinie. Alles Regulatorische — Guideline-Nummern,
Pflichtfelder, Fristen, Bildgroessen, Provisionen — gegen die *heutige*
Fassung der App Review Guidelines und der App-Store-Connect-Hilfe pruefen,
bevor du es als Tatsache behauptest. Diese Liste sagt, **was** zu pruefen ist,
nicht wie die Regel gerade lautet.

**Eine Ablehnung kostet Tage, ein Fehler im Build kostet einen neuen Build.**
Anders als im Web ist nichts schnell nachgebessert: Die native Huelle traegt
die Oberflaeche fest eingebaut. Was du im Web in Minuten behebst, braucht dort
einen neuen Build und eine neue Pruefung. Deshalb lieber einmal zu viel
kontrollieren.

**Sag, was du nicht geprueft hast.** Eine Checkliste mit stillschweigend
uebersprungenen Punkten ist gefaehrlicher als keine.

## Arbeitsweise

1. **Stand feststellen.** Was ist gebaut, was ist konfiguriert, was fehlt?
   Nicht raten — im Projekt nachsehen (`docs/MIGRATION.md`, `CLAUDE.md`) und in
   App Store Connect nachfragen, wenn du es nicht selbst sehen kannst.
2. **Blocker zuerst.** Alles aus dem Ship-Gate-Block "Blockers" verhindert die
   Freigabe. Erst wenn der sauber ist, lohnt sich Feinschliff.
3. **Dann die Vorbereitung**, die Zeit braucht und nicht in letzter Minute
   geht: Konten, Vertraege, Zertifikate, Datenschutzerklaerung, Support-Adresse.
4. **Dann Metadaten und Screenshots** — der Teil, der ueber Installationen
   entscheidet.
5. **Erst danach Design-Politur.** Sie ist der Grund, warum jemand bleibt, aber
   sie rettet keine Einreichung, die an einer fehlenden Account-Loeschung
   scheitert.

## Wohin fuer was

| Frage | Datei |
| --- | --- |
| Konto, Vertraege, Bundle-ID, Metadaten, Privacy-Labels, Einreichung | `references/app-store-connect.md` |
| Von der Web-App zum signierten iOS-Build, TestFlight, Versionierung | `references/capacitor-ios.md` |
| Warum Apps abgelehnt werden und wie man es vermeidet | `references/rejection-patterns.md` |
| Was ausgezeichnete Apps gemeinsam haben, Motion, Hero, Proaktivitaet | `references/design-award.md` |

## Der ehrliche Rahmen fuer den Design Award

Apple **waehlt die Gewinner selbst aus**; es gibt keinen Weg, das zu kaufen
oder zu erzwingen. Ob es in einem gegebenen Jahr ein Einreichungsfenster gibt,
aendert sich — pruef das bei developer.apple.com, statt es anzunehmen.

Wichtiger ist die Bauform: Ausgezeichnete Apps sind praktisch ausnahmslos tief
nativ integriert — Widgets, Live-Aktivitaeten, App Intents, systemweite
Freigabe, Barrierefreiheit auf Systemniveau. Eine in eine Huelle verpackte
Web-App kann handwerklich hervorragend sein und wird trotzdem selten in dieser
Liga wahrgenommen.

Das ist kein Grund, die Qualitaet nicht anzustreben — sie zahlt auf
Verweildauer, Bewertungen und die Chance auf redaktionelle Platzierung ein,
und **von Apple im Store empfohlen zu werden ist ein realistisches Ziel**, das
denselben Weg geht. Es ist ein Grund, ehrlich zu bleiben: Wer die Auszeichnung
wirklich anpeilt, muss irgendwann ueber native Umsetzung reden, nicht ueber
noch eine Animation. Sag das, statt Erwartungen zu naehren, die die
Architektur nicht traegt.
