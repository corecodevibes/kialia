# kialia Design Kit

Das Designsystem von kialia — Struktur aus dem [Mazune Design Kit](../../../Desktop/Claude%20Code/mazune-design-kit/),
Farben aus der kialia-Marke.

## Sofort ansehen

```bash
open design/examples.html
```

Jede Komponente in ihren echten Zuständen, mit echten kialia-Inhalten. Der Blätterstapel,
die Chips, der Segmented Control und der Tagesumschalter sind anklickbar. Funktioniert
offline — die Schriften sind eingebettet, es gibt keinen einzigen externen Aufruf.

## In die App einbauen

```css
@import "./design/css/kialia.css";
```

Danach stehen alle Klassen bereit: `.card`, `.btn`, `.badge`, `.chip`, `.option`,
`.segmented`, `.field`, `.timeline`, `.dayscroll`, `.sheet`, `.toast`, `.hero`, `.stat`,
`.bar` — dazu die drei Reise-Bausteine `.leafstack`/`.leaf`, `.amount` und `.hint`.

Für Tailwind, SwiftUI oder Figma: `tokens.json`.

## Zwei Dinge, die man wissen muss

**Die hellen Marken-Töne tragen keine weiße Schrift.** Perlblau `#8F9BE0` — die Farbe,
an der man kialia erkennt — schafft mit Weiß nur 2,65:1. Um auf die geforderten 7:1 zu
kommen, müsste es zu `#364BC4` werden, einem Königsblau ohne Bezug zur Marke. Perlblau
gehört deshalb an Verlauf, Punkte, Ränder und Ausgewähltes; gefüllte Flächen nutzen den
dunklen Partner `--primary` `#584876` (8,07:1). Dasselbe gilt für Terrakotta `#CE7F5F`
(3,08:1) und `--clay` `#B85D38` (4,51:1). Rechenweg in `DESIGN-KIT.md`, Abschnitt 2.

**Der Blätterstapel ist der kialia-eigene Teil.** Tagebuch, Plan und Packliste liegen als
aufgefächertes Papier übereinander. Der Effekt hängt an einem Schatten nach *oben* — ohne
ihn sind es nur schlecht gesetzte Karten.

## Nächster Schritt

`PROMPT.md` enthält den fertigen Auftrag, um die App darauf umzustellen.
