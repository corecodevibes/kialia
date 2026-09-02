# Fertiger Auftrag für eine neue Session

---

## A · kialia auf dieses Design umstellen

> Stelle kialia auf das Designsystem in `design/` um.
> `DESIGN-KIT.md` beschreibt es vollständig, `css/kialia.css` ist die kopierfertige
> Implementierung, `examples.html` zeigt jede Komponente gerendert.
>
> **Lies zuerst `DESIGN-KIT.md` und öffne `examples.html`, bevor du eine Zeile änderst.**
>
> Reihenfolge:
> 1. Tokens einziehen und die vorhandenen Werte darauf mappen — **zeig mir die
>    Mapping-Tabelle, bevor du etwas löschst.**
> 2. Komponenten angleichen: Karten → Buttons → Badges → Formulare → Navigation → Overlays.
> 3. Typografie umstellen (Serif für Titel, Uhrzeiten und Beträge; Grotesk für den Rest)
>    inklusive Kicker-Zeilen über jeder Überschrift.
> 4. Tagebuch, Plan und Packliste auf den Blätterstapel (`.leafstack` / `.leaf`).
>
> Struktur und Funktionalität bleiben unverändert — das ist ein reiner Skin.
> Am Ende die Abnahme-Checkliste aus Abschnitt 8 durchgehen und bei 375 px und 1280 px prüfen.

## B · Neue App im selben Design

> Ich habe ein fertiges Designsystem, das du exakt übernehmen sollst: `design/DESIGN-KIT.md`
> beschreibt es, `css/kialia.css` ist die Implementierung, `examples.html` zeigt es gerendert.
>
> **Lies zuerst `DESIGN-KIT.md` und öffne `examples.html`.**
>
> Baue damit: **[HIER DIE APP BESCHREIBEN — Zweck, Zielgruppe, 3–5 Screens]**
>
> Regeln:
> - `css/kialia.css` und `css/fonts.css` unverändert übernehmen, eigenes CSS nur ergänzen.
> - Keine UI-Bibliothek, keine Icon-Library — Symbole als Inline-SVG, 24×24, Strich 1.5.
> - Keine Farben, Größen oder Radien inline — ausschließlich die Tokens.
> - Serif für Titel, Uhrzeiten und Beträge; Grotesk für alles andere.
> - Jede Überschrift bekommt eine Kicker-Zeile darüber.
> - Gefüllte Flächen nur mit `--primary` / `--clay` — die hellen Marken-Töne tragen
>   keine weiße Schrift (siehe Abschnitt 2).
> - Eingabefelder mindestens 16 px, sonst zoomt iOS hinein und bleibt so.
> - Mobil zuerst: Tab-Bar unten unter 861 px, darüber Navigation in der Topbar.

## C · Design mit anderer Farbwelt weiterverwenden

> Nutze das System aus `design/DESIGN-KIT.md`, aber färbe es um für **[Marke]**:
> Akzent `--clay` → **[Farbe]**, Primär `--primary` → **[Farbe]**, Serif → **[Schrift]**.
>
> **Rechne die Kontraste nach, bevor du eine Farbe setzt:** die Primärfarbe braucht ≥ 7:1
> mit weißer Schrift, der Akzent ≥ 4,5:1. Genau daran ist kialias Marken-Violett
> gescheitert (6,26:1) — deshalb steht dort der gedrückte Ton.
>
> Alles andere bleibt: Elfenbein statt Weiß, Papierkorn, warme Schatten, Kicker-Zeilen,
> Serif-Zahlen, zwei Abstände, Pillen-Radien, Blätterstapel.
> Zeig mir zuerst eine Beispielseite mit allen Komponenten in der neuen Farbwelt.

---

## Kurzfassung (wenn nur ein Absatz reinpasst)

> Design: warmes Elfenbein `#FAF6F0` statt Weiß, Text Tinte `#2F2A3E`, Primärfarbe tiefes
> Violett `#584876`, Akzent Kupfer `#BA5B38`, Lagune `#A57990` für Preise und Kicker,
> Status Grün `#4E7A63` / Ocker `#8A6A2E` / Rot `#9A4F53`. Newsreader für Titel, Uhrzeiten
> und Beträge, Manrope für alles andere; über jeder Überschrift eine gesperrte Kicker-Zeile
> in Versalien. Karten: Papier, 1-px-Hairline, Radius 20, weicher warmer Schatten. Alles
> Anklickbare ist eine Pille. Feines SVG-Korn über der ganzen Seite. Zwei vertikale
> Abstände (14/26 px), Inhaltsbreite 680 px, Übersichten 1080 px. Tagebuch, Plan und
> Packliste als Blätterstapel: negativer Abstand, Schatten nach oben, immer genau eines
> aufgeschlagen. Tab-Bar unten unter 861 px. Animationen unter 0,4 s. Keine Fotos.
