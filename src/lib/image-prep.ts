/**
 * Fotos beim Hinzufuegen auf ein vernuenftiges Mass bringen.
 *
 * WARUM UEBERHAUPT: ein Handyfoto wiegt zwei bis vier Megabyte. Der
 * Inventar-Export bettet die Bilder als base64 ein, was noch einmal ein
 * Drittel aufschlaegt — fuenfundzwanzig Originale ergaeben eine Datei von
 * ueber achtzig Megabyte. Die laesst sich nicht mailen und oeffnet sich
 * quaelend langsam. Genau dann waere die Sicherung wertlos, wenn man sie
 * braucht.
 *
 * WARUM 2000 PIXEL: das sind je nach Seitenverhaeltnis vier bis acht
 * Megapixel. Auf so einem Bild ist eine Seriennummer lesbar und eine Marke
 * erkennbar — mehr muss ein Beleg nicht koennen. Das Original zu behalten
 * klaenge gruendlicher, macht die Datei aber unbrauchbar, und eine Sicherung,
 * die niemand verschicken kann, sichert nichts.
 *
 * WAS BEWUSST NICHT PASSIERT: freistellen, aufhellen, begradigen. Ein Foto,
 * das als Nachweis dienen soll, wird nicht schoener gemacht. Wer den
 * Hintergrund entfernt, entfernt auch den Beleg dafuer, wo und wann die
 * Aufnahme entstand.
 */

/** Groesste Abmessung, auf die verkleinert wird. */
export const MAX_EDGE = 2000;
const QUALITY = 0.85;

/** Wie gross wird das Bild, wenn die lange Kante hoechstens `max` sein darf? */
export function fitWithin(
  width: number,
  height: number,
  max = MAX_EDGE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max || longest === 0) return { width, height };
  const factor = max / longest;
  return { width: Math.round(width * factor), height: Math.round(height * factor) };
}

/**
 * Verkleinert ein Bild und richtet es auf.
 *
 * `imageOrientation: "from-image"` wendet die EXIF-Drehung an. Ohne das liegen
 * Hochkantaufnahmen mancher Geraete im Export auf der Seite — im Browser sieht
 * man es nicht, weil der die Drehung beim Anzeigen selbst nachholt, in der
 * exportierten Datei dann aber nicht mehr.
 *
 * Geht irgendetwas schief — unbekanntes Format, kein Canvas, HEIC ohne
 * Decoder — kommt die Originaldatei zurueck. Lieber ein grosses Foto als gar
 * keines.
 */
export async function prepareImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const size = fitWithin(bitmap.width, bitmap.height);
    const gedreht = bitmap.width !== size.width || bitmap.height !== size.height;

    // Steht das Bild schon richtig und ist klein genug, nichts anfassen:
    // erneutes Kodieren kostet nur Qualitaet.
    if (!gedreht && file.size < 900_000) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
  } catch {
    return file;
  }
}
