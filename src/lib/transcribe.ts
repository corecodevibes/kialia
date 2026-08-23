import { supabase } from "@/integrations/supabase/client";

/**
 * Sprachmemo verschriftlichen.
 *
 * Ersetzt die alte Anbindung an den abgeschalteten Lovable-Gateway. Läuft über
 * eine Edge Function, damit der Schlüssel nicht ins Bundle wandert.
 *
 * Wird nichts erkannt, ist das KEIN Fehler des Nutzers: laute Umgebung,
 * Dialekt, fremde Orts- und Speisenamen. Die Oberfläche fragt dann schriftlich
 * nach, statt eine Fehlermeldung zu zeigen — und die Aufnahme ist ohnehin
 * verloren, sobald man sie wegwirft, also darf sie nie kommentarlos
 * verschwinden.
 */
export type TranscribeResult =
  { ok: true; text: string } | { ok: false; error: string; askInstead: boolean };

export async function transcribe(audioBase64: string, mimeType: string): Promise<TranscribeResult> {
  try {
    const { data, error } = await supabase.functions.invoke("transkribieren", {
      body: { audioBase64, mimeType },
    });

    if (error) {
      return { ok: false, error: "Das Verschriftlichen hat nicht geklappt.", askInstead: true };
    }
    if (data?.error) return { ok: false, error: String(data.error), askInstead: true };

    const text = String(data?.text ?? "").trim();
    if (!text) {
      return {
        ok: false,
        error: "Ich habe nichts verstanden — war es zu laut?",
        askInstead: true,
      };
    }
    return { ok: true, text };
  } catch {
    return {
      ok: false,
      error: "Keine Verbindung. Schreib es kurz auf, das geht auch offline.",
      askInstead: true,
    };
  }
}
