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

**Zwei Marken-Töne mussten abgedunkelt werden.** `k-violet #69578E` schafft mit weißer
Schrift nur 6,26:1 und verfehlt die geforderten 7:1; `k-copper #CE7B5C` schafft 3,18:1
und kann gar keine weiße Schrift tragen. Gefüllte Flächen nutzen deshalb `--primary`
`#584876` und `--clay` `#BA5B38`. Die hellen Töne bleiben für Ränder und Flächen ohne
Text. Begründung und Rechenweg in `DESIGN-KIT.md`, Abschnitt 2.

**Der Blätterstapel ist der kialia-eigene Teil.** Tagebuch, Plan und Packliste liegen als
aufgefächertes Papier übereinander. Der Effekt hängt an einem Schatten nach *oben* — ohne
ihn sind es nur schlecht gesetzte Karten.

## Nächster Schritt

`PROMPT.md` enthält den fertigen Auftrag, um die App darauf umzustellen.
