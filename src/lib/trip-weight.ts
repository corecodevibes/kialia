import type { Trip } from "@/lib/trip-store";

/**
 * Wie viel Arbeit steckt in dieser Reise?
 *
 * Loeschen soll nicht gleich schwer sein. Eine Reise, in der nur "Kreta" und
 * zwei Daten stehen, wegzuwerfen ist folgenlos — dafuer eine Sicherheitsfrage
 * zu stellen, erzieht nur dazu, Sicherheitsfragen wegzuklicken. Eine Reise mit
 * Fluegen, Unterkunft, Packliste und zwoelf Tagebucheintraegen ist etwas
 * anderes: da soll man sich entscheiden muessen, wie beim Loeschen des Kontos.
 *
 * Gezaehlt wird nur, was jemand von Hand angelegt hat. Die Packliste bringt
 * beim Anlegen Vorschlaege mit; die sind keine Arbeit und zaehlen deshalb nur,
 * wenn sie abgehakt oder jemandem zugeordnet wurden.
 */
export function tripWeight(trip: Trip): number {
  // Durchgaengig mit Rueckfall: diese Funktion liest gespeicherte Reisen, und
  // aeltere Staende koennen einzelne Listen noch gar nicht haben. Ein Absturz
  // hier hiesse, dass sich eine Reise nicht mehr loeschen laesst.
  const diary = (trip.diary ?? []).filter(
    (d) => d.text?.trim() || d.highlight?.trim() || d.notes?.trim() || d.food?.trim(),
  ).length;
  const packed = (trip.packing ?? []).reduce(
    (n, c) => n + (c.items ?? []).filter((i) => i.done || i.who).length,
    0,
  );
  return (
    (trip.transports ?? []).length +
    (trip.stays ?? []).length +
    (trip.activities ?? []).length +
    (trip.ideas ?? []).length +
    diary +
    packed
  );
}

/** Ab hier wird nach dem Namen des Ziels gefragt statt nur nachgehakt. */
export const HEAVY_FROM = 3;

export function needsTypedConfirm(trip: Trip): boolean {
  return tripWeight(trip) >= HEAVY_FROM;
}
