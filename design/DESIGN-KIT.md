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

## 2. Farben — abgeglichen mit der laufenden App

**Wichtig:** kialias Marken-Handoff und die laufende App nennen verschiedene Farben. Das
Handoff spricht von Violett und Kupfer, die App rendert **Perlblau und Terrakotta**.
Maßgeblich ist, was man sieht — dieses Kit folgt der App.

| Rolle | Wert | Herkunft | Weiße Schrift |
|---|---|---|---|
| `--ivory` | `#FAF6F0` | `--background` der App | — |
| `--paper` | `#FFFCF9` | `--card` | — |
| `--paper-2` | `#FAF1E8` | `--secondary` | — |
| `--ink` | `#2F2A3E` | `--foreground` | 12,8:1 auf Elfenbein |
| `--primary-tone` | `#8F9BE0` | **Perlblau der App** | 2,65:1 ✘ nie als Fläche |
| `--primary` | `#584876` | dunkler Partner | **8,07:1** ✔ gefüllte Flächen |
| `--clay-tone` | `#CE7F5F` | **Terrakotta der App** | 3,08:1 ✘ nur ohne Text |
| `--clay` | `#B85D38` | abgedunkelt | **4,51:1** ✔ Handlungen |
| `--sun` | `#F7D67F` | Sonne der App | nur Fläche |
| `--brass` | `#966A7F` | Mauve, abgedunkelt | 4,50:1 — Preise, Kicker |

**Warum Perlblau keine Flächenfarbe sein kann.** Es trägt 2,65:1 mit weißer Schrift. Um
Mazunes 7:1 zu erreichen, müsste es zu `#364BC4` werden — einem Königsblau, das mit der
Marke nichts mehr zu tun hat. Perlblau gehört deshalb an Verlauf, Punkte, Ränder und
Ausgewähltes; gefüllte Flächen brauchen einen dunklen Partner aus derselben Familie.

**Der Verlauf** ist das Wiedererkennbarste an kialia und steht als `--gradient-sky` im
System — dieselben vier Farbkreise wie in der App.

**Status.** Die App hatte keine. Abgeleitet, damit sie nicht wie Fremdkörper wirken:
Grün `#4E7A63`, Ocker `#8A6A2E`, Rot `#9A4F53` — alle drei tragen weiße Schrift.

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

Das Fernglas bleibt — es ist die Marke. Die Silhouette wird nicht angefasst.

**Die Wortmarke** wird gesperrt gesetzt (`KIALIA`, `letter-spacing .34em`) mit einem Punkt
in `--clay` dahinter, Tagline als Serif-Kursiv darunter.

**Das Icon** ist die eine Stelle, an der die heutige Marke mit diesem System bricht: der
Verlauf liegt über der ganzen Fläche, und das Fernglas hat kaum Kontrast dazu. Bei 28 px —
der Größe im App-Umschalter und in den Einstellungen — wird daraus ein Farbfleck.

Zwei Fassungen in Mazunes Formensprache stehen in `icon-vorschlaege.html`, beide mit
kialias Farben, beide ohne Konturen und ohne Fotorealismus:

| | Grund | Fernglas | Bei 28 px |
|---|---|---|---|
| **Heute** | Verlauf über alles | dunkel auf bunt | Farbfleck |
| **A** | Creme, flach | dunkel, Landschaftsbänder in den Gläsern | klar, aber die Bänder werden Matsch |
| **B** | `--primary`, flach | hell, Silhouette | stärkster Kontrast |

**Empfehlung: B.** Ein App-Icon wird öfter klein gesehen als groß, und dort entscheidet
allein die Silhouette. Der Verlauf geht dabei nicht verloren — er ist als `--gradient-sky`
im System und trägt weiterhin jeden Bildschirmhintergrund. Er gehört dorthin, nicht auf
zwölf Quadratmillimeter.

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
