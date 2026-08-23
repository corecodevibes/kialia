import { supabase } from "@/integrations/supabase/client";

/**
 * Belege auslesen lassen.
 *
 * Der Aufruf geht an eine Edge Function, nie direkt an OpenAI: der Schlüssel
 * darf nicht ins Bundle, alles dort ist öffentlich lesbar.
 *
 * Das Ergebnis wird NIE automatisch übernommen. Es geht als Vorschlag an die
 * Oberfläche, die jedes Feld einzeln zur Bestätigung stellt — ein Modell, das
 * still in eine Buchung schreibt, ist eine Fehlerquelle mit Ansage.
 */

export type ScannedFields = {
  kind: string | null;
  title: string | null;
  address: string | null;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  amount: number | null;
  currency: string | null;
  bookingRef: string | null;
};

export type ScanResult = { ok: true; fields: ScannedFields } | { ok: false; error: string };

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result);
      resolve(s.slice(s.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.readAsDataURL(blob);
  });
}

export async function scanReceipt(file: Blob, mimeType: string): Promise<ScanResult> {
  // Bilder werden gross; über etwa 5 MB lohnt der Versuch nicht, und der
  // Fehler käme erst nach langem Warten.
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Der Beleg ist zu groß. Ein Screenshot reicht meist." };
  }

  try {
    const imageBase64 = await blobToBase64(file);
    const { data, error } = await supabase.functions.invoke("scan-beleg", {
      body: { imageBase64, mimeType },
    });

    if (error) {
      return { ok: false, error: "Der Beleg konnte nicht gelesen werden." };
    }
    if (data?.error) return { ok: false, error: String(data.error) };
    if (!data?.fields) return { ok: false, error: "Es wurde nichts erkannt." };

    return { ok: true, fields: data.fields as ScannedFields };
  } catch {
    // Offline ist hier ein Zustand, kein Fehler: der Beleg bleibt angehängt.
    return { ok: false, error: "Keine Verbindung. Der Beleg ist gespeichert — versuch es später." };
  }
}

/** Wie viele Felder tatsächlich erkannt wurden. */
export function foundCount(f: ScannedFields): number {
  return Object.values(f).filter((v) => v !== null && v !== "").length;
}
