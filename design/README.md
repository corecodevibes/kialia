# kialia Design Kit

Das Designsystem von kialia — Struktur aus dem Mazune Design Kit, Farben aus
dem kialia-Zeichen.

## Sofort ansehen

```bash
open design/examples.html
```

Jede Komponente in ihren echten Zuständen, mit echten kialia-Inhalten.
Funktioniert offline — die Schriften sind eingebettet, es gibt keinen einzigen
externen Aufruf.

## Die eine Regel

**`css/tokens.css` und `tokens.json` werden erzeugt, nicht gepflegt.**

```bash
python3 scripts/sync_design_kit.py
```

Das Skript liest den `:root`-Block aus `src/styles.css` und schreibt daraus die
Kit-Tokens. Geändert wird nur die App.

Der Grund steht in der Geschichte: die erste Fassung dieses Kits kam aus einem
Marken-Handoff und zeigte Violett und Kupfer — Farben, die die App nie
gerendert hat. Zwei Quellen für dieselbe Wahrheit laufen immer auseinander.

Das Skript rechnet außerdem bei jedem Lauf die Kontraste nach und warnt, wenn
ein Ton unter 4,5:1 fällt. Es hat dabei schon zwei echte Fehler gefunden, die
zwei Durchgänge lang unbemerkt geblieben waren.

## Drei Dinge, die man wissen muss

**Beige, nicht Weiß.** Seite `#EFE7D9`, Blätter `#F7F1E5` — 1,09:1 dazwischen.
Kein Kontrast, sondern eine Ahnung; getragen wird die Trennung von der
Haarlinie. Weiß auf Weiß *braucht* einen Schatten, Papier auf Papier nicht.

**Titel nicht in Schwarz.** Große Serif-Titel stehen im Taupe `#574B3E`
(7,52:1). Fast-Schwarz trägt auf Beige 12,6:1 und schlägt einem entgegen,
statt dazuzuliegen. Fließtext bleibt dunkler — er wird gelesen, nicht
betrachtet.

**Die Marken-Töne tragen keinen Text.** Perlblau, Salbei, Sonne und Terrakotta
liegen alle unter 3:1. Sie gehören an Verlauf, Punkte, Ränder und
Fortschritt; gefüllte Flächen bekommen `--primary` oder `--clay`.

## In die App einbauen

```css
@import "./design/css/kialia.css";
```

Für Tailwind, SwiftUI oder Figma: `tokens.json`.

## Nächster Schritt

`PROMPT.md` enthält den fertigen Auftrag für eine neue App im selben Design.
