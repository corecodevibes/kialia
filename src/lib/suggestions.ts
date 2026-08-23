import { supabase } from "@/integrations/supabase/client";

/**
 * Vorschläge und Kostenspannen fürs Reiseziel.
 *
 * Beides sind ANGEBOTE, keine Tatsachen — und die Oberfläche muss das sagen.
 * Ein Sprachmodell kennt weder die heutige Qualität einer Taverne noch den
 * Preis, den ihr morgen zahlt. Was es kann: die Größenordnung treffen und
 * bekannte Orte nennen. Beides hilft genau dort, wo die App heute leer ist.
 */

export type Idea = { title: string; why: string; category: string };
export type CostRange = { category: string; min: number; max: number };
export type Costs = { currency: string; perDay: CostRange[]; note: string };

export const IDEA_CATEGORY_LABELS: Record<string, string> = {
  essen: "Essen",
  natur: "Natur",
  kultur: "Kultur",
  aktivitaet: "Aktivität",
  ort: "Ort",
};

export const COST_CATEGORY_LABELS: Record<string, string> = {
  fruehstueck: "Frühstück",
  mittag: "Mittag",
  abend: "Abend",
  snacks: "Snacks",
  unterkunft: "Unterkunft (pro Nacht)",
  transport: "Transport",
  aktivitaet: "Aktivitäten",
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(body: Record<string, unknown>): Promise<Result<T>> {
  try {
    const { data, error } = await supabase.functions.invoke("vorschlaege", { body });
    if (error) return { ok: false, error: "Die Vorschläge konnten nicht geholt werden." };
    if (data?.error) return { ok: false, error: String(data.error) };
    if (!data?.data) return { ok: false, error: "Es kam nichts zurück." };
    return { ok: true, data: data.data as T };
  } catch {
    return { ok: false, error: "Keine Verbindung. Vorschläge brauchen Netz." };
  }
}

export function fetchIdeas(destination: string, tripKind?: string, days?: number) {
  return call<{ ideas: Idea[] }>({ kind: "ideen", destination, tripKind, days });
}

export function fetchCosts(destination: string, tripKind?: string, travellers?: number) {
  return call<Costs>({ kind: "kosten", destination, tripKind, travellers });
}

/** Die Mitte einer Spanne — als Startwert, den man anpasst. */
export function midpoint(r: CostRange): number {
  return Math.round((r.min + r.max) / 2);
}
