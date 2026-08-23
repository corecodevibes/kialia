/**
 * Orte in der Karten-App des Geräts öffnen.
 *
 * Bewusst ohne Karten-SDK: eingebettete Karten kosten pro Aufruf, brauchen
 * Schlüssel und funktionieren ohne Netz nicht — für eine Reise-App ist das der
 * wunde Punkt. Ein Link in die installierte Karten-App ist kostenlos, öffnet
 * die vertraute Oberfläche und bringt Navigation, Bewertungen und
 * Offline-Karten mit, die der Nutzer dort ohnehin hat.
 */

/**
 * Baut die Suchanfrage.
 *
 * Das Reiseziel kommt hinten dran, wenn es nicht ohnehin schon in der Angabe
 * steckt: "Taverne am Hafen" findet weltweit hunderte Treffer, "Taverne am
 * Hafen, Kreta" den gemeinten.
 */
export function mapsQuery(name: string, address: string, destination: string): string {
  const parts: string[] = [];
  const a = (address ?? "").trim();
  const n = (name ?? "").trim();
  const d = (destination ?? "").trim();

  // Eine Adresse ist genauer als ein Name — steht sie da, führt sie.
  if (a) parts.push(a);
  else if (n) parts.push(n);

  const sofar = parts.join(" ").toLowerCase();
  if (d && !sofar.includes(d.toLowerCase())) parts.push(d);

  return parts.join(", ");
}

/**
 * Die passende Karten-Adresse für die Plattform.
 *
 * Auf Apple-Geräten öffnet maps.apple.com direkt Apple Maps, überall sonst
 * führt der Google-Link ans Ziel. Beide funktionieren auch im Browser, falls
 * keine App installiert ist — deshalb kein `maps://`, das ins Leere liefe.
 */
export function mapsUrl(query: string, userAgent = ""): string {
  const q = encodeURIComponent(query.trim());
  if (!q) return "";
  const isApple = /iPhone|iPad|iPod|Macintosh/i.test(userAgent);
  return isApple
    ? `https://maps.apple.com/?q=${q}`
    : `https://www.google.com/maps/search/?api=1&query=${q}`;
}
