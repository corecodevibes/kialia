#!/usr/bin/env python3
"""Leitet das Design-Kit aus der laufenden App ab.

Der Grund fuer dieses Skript ist ein Fehler, der schon einmal passiert ist:
Das Kit wurde aus einem Marken-Handoff gebaut, die App rendert aber andere
Farben. Zwei Quellen fuer dieselbe Wahrheit laufen immer auseinander — die
Frage ist nur, wann es jemandem auffaellt.

Also gibt es nur noch EINE Quelle: der :root-Block in src/styles.css. Dieses
Skript liest ihn und schreibt daraus design/css/tokens.css und
design/tokens.json. Die Prosa in DESIGN-KIT.md bleibt Handarbeit — sie
erklaert das Warum, und das kann kein Skript.

    python3 scripts/sync_design_kit.py

Laeuft ohne Abhaengigkeiten und schreibt nur, wenn sich etwas geaendert hat.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Welcher App-Token welche Rolle im Kit hat. Die Kit-Namen folgen Mazunes
# Struktur, damit ein Kit-Leser sich zurechtfindet, ohne die App zu kennen.
ROLLEN = [
    ("Flaechen", [
        ("ivory", "background", "Seitenhintergrund", "keine"),
        ("paper", "card", "Blaetter, Karten", "keine"),
        ("paper-2", "secondary", "eingesenkt: Felder, Segmented Control", "keine"),
        ("paper-3", "muted", "noch eine Stufe tiefer", "keine"),
    ]),
    ("Text", [
        ("ink", "foreground", "Fliesstext", "text"),
        ("ink-display", "display-ink", "grosse Serif-Titel — bewusst weicher als Fliesstext", "text"),
        ("ink-soft", "muted-foreground", "Beiwerk, Kicker", "text"),
        ("line", "border", "Haarlinie", "keine"),
        ("line-strong", "input", "Feldrahmen", "keine"),
    ]),
    # "flaeche" heisst: der Ton traegt helle Schrift, also wird gegen das
    # Papier ALS SCHRIFTFARBE gerechnet — nicht als Text auf dem Papier.
    ("Handlung", [
        ("primary", "primary", "gefuellte Flaechen", "flaeche"),
        ("primary-2", "primary-2", "gedrueckt", "flaeche"),
        ("clay", "clay", "der eine warme Akzent", "flaeche"),
        ("clay-soft", "clay-soft", "seine helle Flaeche", "keine"),
        ("no", "destructive", "Loeschen, Fehler", "flaeche"),
    ]),
    ("Marke — Verlauf, Punkte, Raender; nie Flaeche unter Text", [
        ("periwinkle", "periwinkle", "Perlblau", "keine"),
        ("sage", "sage", "Salbei: Fortschritt, Fokus, Zeitachse", "keine"),
        ("brass", "brass", "warmer Stein: Preise, Kicker", "text"),
        ("sun", "sun", "Sonne", "keine"),
        ("terracotta", "terracotta", "Terrakotta hell", "keine"),
        ("blush", "lilac", "Flieder", "keine"),
    ]),
    ("Status", [
        ("ok", "ok", "erledigt, bezahlt", "flaeche"),
        ("ok-soft", "ok-soft", "", "keine"),
        ("warn", "warn", "offen", "text"),
        ("warn-soft", "warn-soft", "", "keine"),
        ("no-soft", "no-soft", "", "keine"),
    ]),
]

MEHRZEILIG = ["gradient-sky", "gradient-warm", "gradient-soft", "sh-1", "sh-2", "sh-3"]


def lies_root(css: str) -> dict[str, str]:
    """Den :root-Block einlesen. Werte koennen ueber mehrere Zeilen gehen."""
    start = css.index(":root {")
    tiefe, i = 0, start
    while i < len(css):
        if css[i] == "{":
            tiefe += 1
        elif css[i] == "}":
            tiefe -= 1
            if tiefe == 0:
                break
        i += 1
    block = css[start : i + 1]
    out: dict[str, str] = {}
    for m in re.finditer(r"--([a-z0-9-]+):\s*((?:[^;{}]|\([^)]*\))*);", block):
        out[m.group(1)] = re.sub(r"\s*/\*.*?\*/", "", m.group(2)).strip()
    return out


def kontrast(a: str, b: str) -> float | None:
    """Nur fuer reine Hex-Werte — rgba() und Verlaeufe uebersprungen."""
    def lum(h: str):
        if not re.fullmatch(r"#[0-9A-Fa-f]{6}", h):
            return None
        c = [int(h[k : k + 2], 16) / 255 for k in (1, 3, 5)]
        f = [(v / 12.92) if v <= 0.04045 else (((v + 0.055) / 1.055) ** 2.4) for v in c]
        return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]

    la, lb = lum(a), lum(b)
    if la is None or lb is None:
        return None
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def main() -> None:
    css = (ROOT / "src/styles.css").read_text()
    tok = lies_root(css)
    papier = tok.get("card", "#FFFFFF")

    zeilen = [
        "/* kialia Design System — Tokens",
        "   ---------------------------------------------------------------------------",
        "   ERZEUGT von scripts/sync_design_kit.py aus src/styles.css.",
        "   Nicht von Hand aendern: die App ist die Quelle, dieses Kit die Ableitung.",
        "   Genau daran ist die erste Fassung gescheitert — sie kam aus einem",
        "   Marken-Handoff und zeigte Farben, die die App nie gerendert hat.",
        "",
        "   Die Kontraste in Klammern sind gerechnet, nicht geschaetzt: gegen das",
        f"   Papier {papier}, auf dem in dieser App fast jeder Text steht.",
        "   --------------------------------------------------------------------------- */",
        ":root {",
    ]
    fehlend: list[str] = []
    warnungen: list[str] = []
    for ueberschrift, eintraege in ROLLEN:
        zeilen.append(f"  /* ---- {ueberschrift} " + "-" * max(3, 66 - len(ueberschrift)))
        zeilen.append("     */")
        for kit_name, app_name, notiz, art in eintraege:
            wert = tok.get(app_name)
            if wert is None:
                fehlend.append(app_name)
                continue
            kommentar = notiz
            if art == "text":
                k = kontrast(wert, papier)
                if k is not None:
                    kommentar = f"{notiz}  ({k:.2f}:1 auf Papier)".strip()
                    if k < 4.5:
                        warnungen.append(f"{kit_name} traegt nur {k:.2f}:1 auf dem Papier")
            elif art == "flaeche":
                # Diese Toene sind der GRUND unter heller Schrift — gerechnet
                # wird deshalb gegen die Schrift, die tatsaechlich darauf steht,
                # nicht gegen das Papier und erst recht nicht gegen reines
                # Weiss. Genau diese falsche Bezugsfarbe hat bei --clay einen
                # echten Fehler zwei Durchgaenge lang verdeckt (4,70 gerechnet,
                # 4,37 in Wirklichkeit).
                k = kontrast(wert, tok.get("primary-foreground", "#FFFFFF"))
                if k is not None:
                    kommentar = f"{notiz}  ({k:.2f}:1 mit heller Schrift)".strip()
                    if k < 4.5:
                        warnungen.append(f"{kit_name} traegt nur {k:.2f}:1 unter heller Schrift")
            pad = " " * max(1, 16 - len(kit_name))
            zeilen.append(
                f"  --{kit_name}:{pad}{wert};" + (f"  /* {kommentar} */" if kommentar else "")
            )
        zeilen.append("")

    zeilen.append("  /* ---- Verlaeufe und Schatten, wortgleich aus der App ---------------- */")
    for name in MEHRZEILIG:
        wert = tok.get(name)
        if wert is None:
            fehlend.append(name)
            continue
        if "\n" in wert:
            teile = [t.strip() for t in wert.split("\n") if t.strip()]
            zeilen.append(f"  --{name}:")
            for t in teile:
                zeilen.append(f"    {t}")
            zeilen[-1] += ";" if not zeilen[-1].endswith(";") else ""
        else:
            zeilen.append(f"  --{name}: {wert};")
    zeilen.append("")
    zeilen.append("  /* ---- Schrift, Radien, Abstaende ----------------------------------- */")
    zeilen.append('  --serif: "Source Serif 4", "Iowan Old Style", Palatino, Georgia, serif;')
    zeilen.append('  --sans:  "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;')
    zeilen.append("  --r-sm: 10px;")
    zeilen.append("  --r-md: 14px;")
    zeilen.append(f"  --r-lg: {tok.get('radius', '1.25rem')};")
    zeilen.append("  --r-xl: 30px;")
    zeilen.append("  --gap:    14px;")
    zeilen.append("  --gap-lg: 26px;")
    zeilen.append("}")

    ziel = ROOT / "design/css/tokens.css"
    neu = "\n".join(zeilen) + "\n"
    geaendert = not ziel.exists() or ziel.read_text() != neu
    ziel.write_text(neu)

    farben = {
        kit: tok[app]
        for _, eintraege in ROLLEN
        for kit, app, *_ in eintraege
        if app in tok
    }
    (ROOT / "design/tokens.json").write_text(
        json.dumps(
            {
                "color": farben,
                "gradient": {n: " ".join(tok[n].split()) for n in MEHRZEILIG[:3] if n in tok},
                "shadow": {n: tok[n] for n in MEHRZEILIG[3:] if n in tok},
                "font": {
                    "serif": '"Source Serif 4", "Iowan Old Style", Palatino, Georgia, serif',
                    "sans": '"Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                },
                "radius": {"sm": "10px", "md": "14px", "lg": tok.get("radius", "1.25rem"),
                           "xl": "30px", "pill": "999px"},
                "space": {"gap": "14px", "gap-lg": "26px"},
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n"
    )

    print(f"tokens.css {'aktualisiert' if geaendert else 'unveraendert'} · {len(farben)} Farben")
    if fehlend:
        print("  FEHLT in src/styles.css:", ", ".join(sorted(set(fehlend))))
    for w in warnungen:
        print("  ZU SCHWACH:", w)


if __name__ == "__main__":
    main()
