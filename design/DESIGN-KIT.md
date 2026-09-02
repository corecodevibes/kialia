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

## 2. Farben — und warum sie so und nicht anders sind

Die Marke gibt die Töne vor, die Lesbarkeit gibt die Werte vor. **Zwei Marken-Töne
mussten abgedunkelt werden**, weil sie keine weiße Schrift tragen können. Alle Zahlen
unten sind gerechnet, nicht geschätzt.

| Mazune | kialia | Wert | Weiße Schrift darauf |
|---|---|---|---|
| `--ivory` | Elfenbein | `#FAF6F0` | — |
| `--paper` | Papier | `#FFFCF9` | — |
| `--paper-2` | Creme (`k-cream`) | `#FAF1E8` | — |
| `--ink` | Tinte (`k-ink`) | `#2F2A3E` | 12,8:1 auf Elfenbein |
| `--olive` → `--primary` | **Violett gedrückt** | `#584876` | **8,07:1** ✔ |
| — | `--primary-tone` (`k-violet`) | `#69578E` | 6,26:1 ✘ nur für Ränder |
| `--sage` | Perlblau (`k-periwinkle`) | `#8596DB` | Fokus, Zeitachse |
| `--clay` | **Kupfer abgedunkelt** | `#BA5B38` | **4,52:1** ✔ |
| — | `--clay-tone` (`k-copper`) | `#CE7B5C` | 3,18:1 ✘ nur ohne Text |
| `--brass` | Lagune (`k-lagoon`) | `#A57990` | Preise, Kicker |
| `--blush` | Flieder | `#EDE7F2` | Avatare |

**Die zwei Abdunklungen im Detail.** Mazune verlangt für die Primärfarbe ≥ 7:1.
`k-violet #69578E` schafft 6,26:1 — knapp daneben, aber daneben. Die Marke hat mit
`k-violet-press #584876` bereits einen passenden Ton (8,07:1); er wird zur Primärfarbe,
das hellere Violett bleibt für Ränder, Punkte und Ausgewähltes.

`k-copper #CE7B5C` trägt nur 3,18:1 und kann **keine** weiße Schrift halten — als
gefüllter Handlungs-Button wäre er unlesbar. Abgedunkelt auf `#BA5B38` sind es 4,52:1,
praktisch derselbe Wert wie Mazunes eigenes Clay (4,58:1). Gleiche Rolle, gleiche
Lesbarkeit.

**Status.** kialia hatte keine Statusfarben. Abgeleitet aus der Palette, damit sie nicht
wie Fremdkörper wirken: Grün `#4E7A63`, Ocker `#8A6A2E`, Rot `#9A4F53` — alle drei tragen
weiße Schrift.

---

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

Das Fernglas bleibt — es ist die Marke. Zwei Angleichungen an dieses System:

- **Die Wortmarke** wird gesperrt gesetzt (`KIALIA`, `letter-spacing .34em`) mit einem
  Punkt in Kupfer dahinter, Tagline als Serif-Kursiv darunter.
- **Der Verlauf im Icon** darf ruhiger werden. Er ist heute der lauteste Teil der Marke
  und konkurriert mit dem Inhalt; ein reduzierter Verlauf oder ein einfarbiger Grund in
  `--primary` mit hellem Fernglas passt besser zu einem System, das auf Papier setzt.

Nicht anfassen: die Silhouette des Fernglases.

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
