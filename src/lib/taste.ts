/**
 * Was jemand an Reisen mag — einmal beantwortet, danach bei jedem Ziel nutzbar.
 *
 * Die Frage nach einem Ort, den man gut kennt, ist der Trick: "was magst du?"
 * beantwortet niemand brauchbar, "was hat dir in Lissabon gefallen?" schon.
 * Der genannte Ort ist die Referenz, an der sich Vorschlaege messen lassen.
 *
 * Die Vorlieben sind eine feste Auswahl, kein Textfeld. Das ist hier kein
 * Kompromiss, sondern die bessere Frage: ankreuzen geht in zehn Sekunden,
 * einen Absatz schreiben tut niemand. Nebenbei geht so kein freier Text an
 * das Modell.
 */
export const TASTE_OPTIONS = [
  { key: "essen", label: "Essen & Märkte" },
  { key: "natur", label: "Natur & Wandern" },
  { key: "wasser", label: "Strand & Wasser" },
  { key: "kultur", label: "Geschichte & Kultur" },
  { key: "viertel", label: "Viertel abseits der Zentren" },
  { key: "ruhe", label: "Ruhe & wenig Trubel" },
  { key: "nachtleben", label: "Abends unterwegs" },
  { key: "design", label: "Kunst & Design" },
] as const;

export type TasteKey = (typeof TASTE_OPTIONS)[number]["key"];
export type TasteProfile = { place: string; likes: TasteKey[] };

const KEY = "kialia.taste";
const VALID = new Set<string>(TASTE_OPTIONS.map((o) => o.key));

export const EMPTY_TASTE: TasteProfile = { place: "", likes: [] };

/** Gleiche Saeuberung wie beim Reiseziel — der Ort geht an ein Modell. */
export function cleanPlace(raw: string): string {
  return (
    (raw ?? "")
      .replace(/[\r\n\t]+/g, " ")
      // eslint-disable-next-line no-control-regex -- genau darum geht es hier
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .replace(/[<>{}[\]|`]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60)
  );
}

export function loadTaste(): TasteProfile {
  if (typeof window === "undefined") return EMPTY_TASTE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY_TASTE;
    const parsed = JSON.parse(raw) as Partial<TasteProfile>;
    return {
      place: cleanPlace(String(parsed.place ?? "")),
      likes: Array.isArray(parsed.likes)
        ? (parsed.likes.filter((l) => VALID.has(String(l))) as TasteKey[])
        : [],
    };
  } catch {
    // Kaputter Eintrag darf die Einstellungen nicht lahmlegen.
    return EMPTY_TASTE;
  }
}

export function saveTaste(p: TasteProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ place: cleanPlace(p.place), likes: p.likes.filter((l) => VALID.has(l)) }),
    );
  } catch {
    /* Voller Speicher darf nicht abstuerzen lassen. */
  }
}

/** Nur mitschicken, wenn wirklich etwas hinterlegt ist. */
export function tasteForRequest(p: TasteProfile) {
  const place = cleanPlace(p.place);
  const likes = p.likes.filter((l) => VALID.has(l));
  if (!place && likes.length === 0) return undefined;
  return { knownPlace: place, likes };
}
