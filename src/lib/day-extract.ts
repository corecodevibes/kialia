import { supabase } from "@/integrations/supabase/client";

/**
 * Einen eingesprochenen Tag in Felder zerlegen.
 *
 * Der zweite Schritt nach dem Verschriftlichen. Ohne ihn landet alles in einem
 * Block, und wer abends erzaehlt "Schlucht, danach Souvlaki fuer zwanzig Euro,
 * war grossartig", muesste das von Hand auf vier Felder verteilen. Macht
 * niemand.
 *
 * Scheitert es, ist der Text NICHT verloren — die Oberflaeche schreibt ihn
 * dann wie bisher ins Textfeld. Ein Zusatzschritt darf nie das Ergebnis des
 * ersten Schritts vernichten.
 */
export type DayFields = {
  text: string | null;
  highlight: string | null;
  food: string | null;
  foodTag: string | null;
  mood: string | null;
  spent: number | null;
};

export type ExtractResult = { ok: true; fields: DayFields } | { ok: false; error: string };

export async function extractDay(text: string): Promise<ExtractResult> {
  try {
    const { data, error } = await supabase.functions.invoke("tag-auswerten", { body: { text } });
    if (error) return { ok: false, error: "Das Sortieren hat nicht geklappt." };
    if (data?.error) return { ok: false, error: String(data.error) };
    if (!data?.data) return { ok: false, error: "Es kam nichts zurück." };
    return { ok: true, fields: data.data as DayFields };
  } catch {
    return { ok: false, error: "Keine Verbindung." };
  }
}

/** Was tatsaechlich etwas enthaelt — leere Felder braucht niemand zu bestaetigen. */
export function filledEntries(f: DayFields): [keyof DayFields, string][] {
  const label: Record<keyof DayFields, string> = {
    text: "Was passiert ist",
    highlight: "Highlight",
    food: "Gegessen",
    foodTag: "Bewertung",
    mood: "Stimmung",
    spent: "Ausgegeben",
  };
  return (Object.keys(label) as (keyof DayFields)[])
    .filter((k) => {
      const v = f[k];
      return v !== null && v !== undefined && String(v).trim() !== "";
    })
    .map((k) => [k, label[k]]);
}
