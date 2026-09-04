# kialia Design System — Kit

Warmes Elfenbein, tiefes Violett, Lagune als einziger Schmuck. Struktur, Regeln und
Klassennamen stammen aus dem **Mazune Design Kit**; ersetzt sind Farben, Schriften und
drei Bausteine, die eine Reise braucht und ein Hochzeitstag nicht.

> **Zuerst ansehen:** `open examples.html` — jede Komponente gerendert, mit echten
> kialia-Inhalten. Der Blätterstapel und die Chips sind anklickbar.

| Datei | Zweck |
|---|---|
| `DESIGN-KIT.md` | Diese Spezifikation |
| `PROMPT.md` | Fertiger Auftrag für eine neue Session |
| `examples.html` | Lebende Beispielseite |
| `css/kialia.css` | Das komplette System, kopierfertig |
| `css/tokens.css` | Nur die Variablen |
| `css/fonts.css` | Newsreader + Manrope, eingebettet (offlinefähig) |
| `tokens.json` | Dieselben Werte maschinenlesbar |
| `icon-vorschlaege.html` | Zwei Icon-Fassungen im Größenvergleich |
| `fonts/` | Die Schriftdateien |

---

## 1. Die fünf Prinzipien

Unverändert aus Mazune übernommen — sie sind der Grund, warum es hochwertig wirkt.

1. **Zwei Schriften, klare Rollen.** Serif (Newsreader) für alles Erzählte: Reiseziele,
   Überschriften, Uhrzeiten, Beträge. Grotesk (Manrope) für alles Funktionale: Fließtext,
   Labels, Buttons, Badges. Nie mischen innerhalb einer Zeile — Ausnahme: Serif-Kursiv
   als Zitat aus dem Tagebuch.
2. **Farbe bedeutet etwas.** Grün = bezahlt. Blau = gebucht, noch offen. Lagune = kostet
   Geld. Kupfer = Handlung. Rot ausschließlich für Abgesagtes. Alles andere ist
   Elfenbein, Papier und Tinte.
3. **Keine harten Kanten, keine kalten Schatten.** Radien ab 10 px, Pillen für alles
   Anklickbare. Schatten warm getönt aus der Tinte, nie grau-blau. Jede Karte hat
   zusätzlich eine 1-px-Hairline — auf hellem Grund trägt Schatten allein zu wenig.
4. **Papier statt Bildschirm.** Über der ganzen Seite liegt ein feines SVG-Korn
   (`feTurbulence`, opacity .35). Es ist der Unterschied zwischen „App" und „Reisetagebuch".
5. **Ruhe vor Effekt.** Alle Bewegungen unter 0,4 s, keine Hover-Spielereien auf Karten,
   kein Parallax. Die einzige Rückmeldung beim Drücken ist `scale(.985)`.

---

## 2. Farben — abgeleitet aus dem Zeichen, erzeugt aus der App

Die Werte in `css/tokens.css` und `tokens.json` sind **erzeugt**, nicht
gepflegt: `scripts/sync_design_kit.py` liest den `:root`-Block aus
`src/styles.css` und schreibt sie. Von Hand geändert wird nur die App.

Der Grund steht in der Geschichte dieses Kits. Die erste Fassung kam aus einem
Marken-Handoff und zeigte Violett und Kupfer — Farben, die die App nie
gerendert hat. Zwei Quellen für dieselbe Wahrheit laufen immer auseinander;
die Frage ist nur, wann es auffällt.

### Woher die Palette kommt

Aus dem Icon. Es bringt ein **Grün** mit (Berggrat, Palmenwedel), und das ist
die einzige tiefe, gesättigte Farbe der Marke — alles andere (Perlblau, Sonne,
Terrakotta, Mauve) ist hell und gehört in den Verlauf. Daraus folgt die
Rollenverteilung von selbst.

### Flächen: drei Beige-Stufen

| Token | Wert | Rolle |
|---|---|---|
| `--ivory` | `#EFE7D9` | die Seite |
| `--paper` | `#F7F1E5` | die Blätter darauf |
| `--paper-2` | `#EAE0CE` | eingesenkt: Felder, Segmented Control |

Zwischen Seite und Blatt liegen **1,09:1**. Das ist kein Kontrast, sondern eine
Ahnung — getragen wird die Trennung von der Haarlinie, nicht vom Schatten.
Genau darin liegt der Unterschied: Weiß auf Weiß *braucht* einen Schatten zum
Abheben, Papier auf Papier kommt mit einer Linie aus.

### Schrift

| Token | Wert | Rolle | auf Papier |
|---|---|---|---|
| `--ink` | `#3A342C` | Fließtext | 10,93:1 |
| `--ink-display` | `#574B3E` | große Serif-Titel | 7,52:1 |
| `--ink-soft` | `#6B6154` | Beiwerk, Kicker | 5,39:1 |
| `--brass` | `#836858` | Preise, Kicker | 4,57:1 |

**Titel stehen nicht in Schwarz.** Fast-Schwarz trägt auf Beige 12,6:1 und wirkt
dort hart — der Titel schlägt einem entgegen, statt dazuzuliegen. Fließtext
bleibt dunkler, weil er gelesen und nicht betrachtet wird.

### Handlung

| Token | Wert | Rolle | gegen die eigene helle Schrift |
|---|---|---|---|
| `--primary` | `#35553F` | gefüllte Flächen | 7,58:1 |
| `--primary-2` | `#2B4633` | gedrückt | 9,44:1 |
| `--clay` | `#AD5533` | der eine warme Akzent | 4,64:1 |

**In welche Richtung gerechnet wird, entscheidet.** `--clay` stand zwei
Durchgänge lang auf `#B25936` mit dem Vermerk „4,70:1" — gerechnet gegen reines
Weiß. Auf der Fläche steht aber cremefarbene Schrift `#FBF3EC`, und dagegen
waren es nur **4,37:1**. Aufgefallen ist es erst, als das Sync-Skript die
Prüfung in die richtige Richtung gedreht hat. Dasselbe bei `--brass`: auf dem
alten helleren Papier 4,55:1, auf dem beigen nur 4,13 — beim Wechsel auf Beige
mitgerutscht, ohne dass es jemand gemerkt hätte.

Das Skript warnt jetzt bei jedem Lauf, wenn ein Ton unter 4,5 fällt.

### Marke — nie Fläche unter Text

`--periwinkle` `#8F9BE0`, `--sage` `#7E9A88`, `--sun` `#F7D67F`,
`--terracotta` `#CE7F5F`. Alle vier tragen unter 3:1 und gehören an Verlauf,
Punkte, Ränder, Fokusringe und Fortschrittsbalken — nie unter Text.

### Der Verlauf

`--gradient-sky` sind dieselben Farbkreise wie im Icon, mit derselben Dämpfung
(Sättigung ×0,76, minimal aufgehellt). **„Pastellig" heißt hier ausdrücklich
nicht „heller":** die Linien im Zeichen sind beige, also hell — ein
aufgehellter Grund lässt sie verschwinden. Weich wird der Verlauf über breitere
Flanken der Farbkreise, nicht über Entfärbung.

Zwei Fallen beim Nachbauen in Code:
- In CSS liegt die **zuerst** genannte Verlaufsebene **oben**. Trägt man sie in
  Lesereihenfolge auf, deckt das Orange aus der letzten Zeile das Perlblau zu.
- Die Alpha-Flanke läuft **linear**. Eine weiche Kurve (smoothstep) sieht
  gefälliger aus, verwäscht aber die Farbkreise.

### Personen- und Kategoriefarben

Sechs gedämpfte Erdtöne, alle mit der Tinte über 6:1. Vorher waren es
gesättigte Töne — gut unterscheidbar, aber damit markierten die lautesten
Flächen des Bildschirms die nebensächlichste Angabe.

## 3. Typografie

| Klasse | Größe | Einsatz |
|---|---|---|
| `.display.d1` | `clamp(38px, 10vw, 64px)` | Reiseziel, große Kennzahlen |
| `.display.d2` | `clamp(30px, 7vw, 42px)` | Screen-Überschrift |
| `.display.d3` | `clamp(23px, 5.4vw, 30px)` | Kartenüberschrift |
| Body | 15 px / 1.55 | Manrope 400 |
| `.small` / `.tiny` | 13 px / 12 px | Beschreibungen, Metadaten |
| `.kicker` | 11 px, 600, `.18em`, VERSALIEN | Rubrik über jeder Überschrift |

**Wortmarke:** Versalien, Manrope 600, `letter-spacing: .34em`, dahinter ein Punkt in
`--clay`. Tagline immer als Serif-Kursiv darunter, nie daneben.

**Warum Newsreader statt Cormorant:** Mazune nennt sie selbst als Alternative
(„redaktioneller"), sie ist kialias Markenserif, und ein Reisetagebuch verträgt einen
redaktionellen Ton besser als eine Hochzeitsschrift. Manrope bleibt als Grotesk, weil
sie in der App bereits mitgeliefert wird.

---

## 4. Komponenten

Alle Klassen aus Mazune gelten unverändert: `.card` (`.tint` `.dark` `.flat` `.raised`),
`.btn` (`.btn-primary` `.btn-clay` `.btn-ghost` `.btn-quiet`), `.badge`, `.chip`,
`.option`, `.segmented`, `.field`/`.input`/`.select`/`.textarea`, `.timeline`,
`.dayscroll`/`.daypill`, `.sheet`, `.toast`, `.tabbar`/`.topnav`, `.hero`, `.stat`,
`.bar`, `.avatar`, `.list-row`.

**Umbenannt, weil hochzeitsspezifisch:**

| Mazune | kialia | Bedeutung |
|---|---|---|
| `.badge.ladies` | `.badge.paid` | bezahlt |
| `.badge.gents` | `.badge.booked` | gebucht, noch offen |
| `.dresscode` | `.hint` | Hinweiszeile mit Symbol |
| `.tl-item.is-ceremony` | `.tl-item.is-highlight` | der Punkt, um den es geht |
| `.avatar.olive` | `.avatar.brandfill` | gefüllter Avatar |

### Neu: Blätterstapel (`.leafstack` / `.leaf`)

Für **Tagebuch, Plan und Packliste** — alles, was nach Tagen sortiert ist. Die Blätter
liegen dicht übereinander wie aufgefächertes Papier, das aufgeschlagene löst sich heraus.

```html
<div class="leafstack">
  <div class="leaf">
    <button class="leaf-head">
      <span style="flex:1; min-width:0">
        <span class="kicker">1. Reisetag</span>
        <span class="leaf-title">27. August 2026</span>
        <span class="leaf-peek">Ankunft in Chania</span>
      </span>
      <span class="chev">…</span>
    </button>
  </div>
  <div class="leaf open">… <div class="leaf-body">…</div></div>
</div>
```

Drei Kleinigkeiten machen den Effekt, und alle drei sind nötig:

1. **negativer Abstand** (`margin-top: -18px`) — die Blätter überlappen
2. **Schatten nach OBEN** — das Blatt liegt *auf* dem darunter, nicht darüber in der Luft
3. **eine Kante am oberen Rand** als Papierrand

Ohne Punkt 2 sieht es aus wie schlecht gesetzte Karten. Mit Punkt 2 sieht es aus wie Papier.
Immer genau **ein** Blatt offen — wie ein aufgeschlagenes Buch.

### Neu: Betrag (`.amount`)

Auf einer Reise zahlt man in einer Währung und rechnet in einer anderen. Gezahlt wird
groß, umgerechnet klein daneben:

```html
<span class="amount lg"><span class="val">1.340</span><span class="cur">EUR</span><span class="conv">≈ 1.268 CHF</span></span>
```

Der Betrag steht in der Serif — Mazunes Regel „alle Zahlen ≥ 20 px in der Serif".

---

### Der Blätterstapel und die Buchseite

Der kialia-eigene Teil. Tagebuch, Plan und Packliste liegen als aufgefächertes
Papier übereinander statt als Liste getrennter Karten.

Drei Dinge tragen den Effekt, und jedes einzelne ist ohne die anderen wertlos:

1. **Der Schatten geht nach oben.** Papier, das auf Papier liegt, wirft seinen
   Schatten auf das Blatt darunter — nach unten ins Leere wäre eine Karte, die
   schwebt. `box-shadow: 0 -7px 16px -12px …`
2. **Die Papierkante.** Eine 1-px-Linie am oberen Rand jedes Blattes außer dem
   ersten. Ohne sie sind zwei überlappende Flächen eine Stufe, mit ihr zwei
   Blätter.
3. **Negativer Abstand.** `margin-top: -0.85rem` zwischen den Blättern.

Das **aufgeschlagene** Blatt ist eine Buchseite und bekommt drei weitere:

- **Der Falz**: `box-shadow: inset 26px 0 26px -26px …` an der linken
  Innenkante — die Krümmung zum Buchrücken.
- **Der Seitenstapel**: ein `::after` hinter der Seite, 6 px versetzt, das
  rechts unten zwei weitere Blätter andeutet.
- **Das Aufblättern**: die Seite dreht beim Öffnen in 6 Grad um die linke Kante
  herein. Einmal, 0,45 s, mit `prefers-reduced-motion`-Ausnahme.

Immer genau eine Seite ist aufgeschlagen. Zwei offene Seiten nebeneinander sind
kein Buch mehr, sondern wieder eine Liste.


## 5. Layout, Bewegung, Sprache

Unverändert aus Mazune: Inhaltsbreite 680 px (1080 px bei `.page.wide`), Seitenpadding
18 px, **nur zwei vertikale Abstände** (`.stack` 14 px, `.stack-lg` 26 px), Tab-Bar unter
861 px, darüber Topbar-Pillen. Animationen unter 0,4 s, nie `animation-fill-mode: both`,
`prefers-reduced-motion` schaltet alles ab. Sheets per Portal an `document.body`.

**Sprache:** Deutsch, Ansprache „ihr", kurz und warm. Keine Ausrufezeichen in
Systemtexten. Buttons sagen die Handlung („Zum Teilen freigeben"), nicht „OK". Leere
Zustände erklären, was passieren wird, nicht dass etwas fehlt.

## 6. Symbole

Inline-SVG, 24×24-Viewbox, Strichstärke 1.5 (aktiv 1.9), runde Enden und Ecken, keine
Füllung. Keine Icon-Bibliothek. Die fünf Tab-Symbole und die Reise-Symbole (Ort, Münze,
Mikrofon, Buch, Rucksack) stehen in `examples.html` zum Kopieren.

## 7. Logo

Das Zeichen ist ein Fernglas, frontal, auf dem Marken-Verlauf. Es liegt als
**Skript** vor, nicht als Bilddatei: `scripts/generate_icons.py` schreibt Logo,
beide PWA-Größen, das maskable Icon und das Favicon in einem Durchgang. Vorher
war jede Änderung Handarbeit in einem Bildprogramm, und die abgeleiteten Größen
liefen auseinander.

### Die Arbeitsteilung im Zeichen

„Dünner, feiner, edler" steht im Konflikt mit der Größe, in der ein App-Icon
meistens gesehen wird: eine Haarlinie, die bei 512 px edel wirkt, ist bei 28 px
schlicht weg. Aufgelöst ist es über zwei Ebenen.

**Die Silhouette trägt die Erkennbarkeit.** Schultern, Mittelstück und Gläser
sind eine einzige Fläche — also läuft auch nur **eine** Linie außen herum.
Einzeln gezeichnete Umrisse hätten an den Überlappungen Nahtstellen.

**Die feine Linie trägt die Anmutung, und zwar in den Gläsern.** Berg und Palme
sind dünne Konturen in Grün statt gefüllter Flächen, dazu je eine Haarlinie als
Fassung. Bei 180 px sieht man ein präzise gebautes Objekt; darunter lösen sich
die Motive auf, ohne die Form mitzunehmen.

Die Gläser sind milchig hinterlegt (`rgba(255,252,249,0.52)`), damit die Motive
ruhig stehen. Gemessen trägt diese Fassung **2,60:1** gegen die beige Linie und
damit *mehr* als die kräftigere Vorversion mit 2,41 — der Gewinn kommt daher,
dass die milchige Fläche gegen einen ruhigeren Grund stärker absticht.

### Die Grenze, die in der Sache liegt

Eine feine helle Linie auf hellem Grund trägt nie viel Kontrast. Bei 28 px löst
sich die Zeichnung sichtbar auf. Das ist der Preis dieser Richtung, kein
Ausführungsfehler — wer mehr Kontrast braucht, dunkelt den Verlauf unter dem
Zeichen ab, statt die Linie zu verdicken.

### Der Schriftzug

`kialia · κιάλια` in der Serif, das Trennzeichen in `--clay`. Er steht in der
App an fünf Stellen und ist deshalb **eine Komponente** — vorher war er fünf
Absätze, von denen zwei bereits auseinandergelaufen waren.

### Flaggen

Emoji-Flaggen sind der eine Fremdkörper in einer gedämpften Palette: knallige
Systemgrafik, auf Android anders als auf iOS. Das Kit zeichnet stattdessen 64
Länder selbst — vereinfachte Geometrie (Streifen, Kreuz, Punkt, Halbmond, Feld)
mit auf die Palette übersetzten Farben. Erkennung kommt von Anordnung und
Farbklang, nicht von der Normfarbe. Wo die Vereinfachung kippt, bekommt sie ein
Merkmal zurück: Griechenland trägt das Kreuz im Feld, sonst läse sich das
gestreifte Blau-Weiß als Kuba.

## 8. Abnahme-Checkliste

- [ ] Jede Überschrift hat eine Kicker-Zeile darüber
- [ ] Alle Zahlen ≥ 20 px stehen in der Serif
- [ ] Kein reines Weiß als Seitenhintergrund, kein reines Schwarz als Text
- [ ] Jede Karte hat Hairline **und** Schatten
- [ ] Status ausschließlich über die semantischen Farben (paid/booked/warn/no/brass)
- [ ] Nur zwei vertikale Abstände im Einsatz (14 / 26)
- [ ] Gefüllte Flächen nutzen `--primary` / `--clay`, nie die hellen Marken-Töne
- [ ] Bei 375 px kein horizontales Scrollen, Tab-Bar respektiert die Safe Area
- [ ] Eingabefelder mindestens 16 px — sonst zoomt iOS beim Antippen hinein und bleibt so
- [ ] Bei ≥ 861 px keine Tab-Bar, Navigation liegt in der Topbar
- [ ] Sheets liegen im Portal, Escape und Hintergrundklick schließen sie
- [ ] `prefers-reduced-motion` schaltet Animationen ab
- [ ] Alles funktioniert offline — keine externen Requests

## 9. Herkunft

Portiert aus `~/Desktop/Claude Code/mazune-design-kit/` (Stand August 2026). Struktur und
Klassennamen sind bewusst 1:1 geblieben, damit beide Kits vergleichbar bleiben und
Erkenntnisse aus einem im anderen landen können.
