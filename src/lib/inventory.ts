import { loadForOwners, formatBytes } from "@/lib/attachments";
import { formatDateLong, type Trip } from "@/lib/trip-store";

/**
 * Inventar der Packliste als eine einzelne Datei.
 *
 * WARUM NICHT die vorhandene Sicherung: die exportiert nur die Reisedaten als
 * JSON. Die Fotos liegen in IndexedDB und blieben zurueck — also genau auf dem
 * Geraet, dessen Verlust der Grund fuer die Meldung waere. Ein Beweis, der mit
 * dem Beweisstueck verschwindet, ist keiner.
 *
 * WARUM HTML und kein ZIP: eine Versicherung will ein Dokument, keinen Ordner
 * mit Dateinamen. Ein HTML mit eingebetteten Bildern oeffnet sich auf jedem
 * Geraet ohne Programm, laesst sich per Mail schicken und im Browser als PDF
 * drucken. Dafuer braucht es keine Bibliothek.
 *
 * Die Bilder werden als base64 eingebettet, was sie um rund ein Drittel
 * vergroessert. Das ist der Preis fuer die Eigenstaendigkeit der Datei und
 * hier richtig herum entschieden.
 */

export function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export type InventoryResult = { items: number; photos: number; bytes: number };

export async function downloadInventory(trip: Trip): Promise<InventoryResult> {
  const items = trip.packing.flatMap((c) => c.items.map((i) => ({ category: c.name, ...i })));
  const files = await loadForOwners(items.map((i) => i.id));

  const byOwner = new Map<string, { name: string; addedAt: string; url: string }[]>();
  for (const f of files) {
    if (!f.type.startsWith("image/")) continue;
    const url = await blobToDataUrl(f.blob);
    const list = byOwner.get(f.ownerId) ?? [];
    list.push({ name: f.name, addedAt: f.addedAt, url });
    byOwner.set(f.ownerId, list);
  }

  const withPhotos = items.filter((i) => (byOwner.get(i.id)?.length ?? 0) > 0);
  const stamp = new Date();
  const dateStr = stamp.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const rows = withPhotos
    .map((i) => {
      const photos = byOwner.get(i.id) ?? [];
      const imgs = photos
        .map(
          (p) =>
            `<figure><img src="${p.url}" alt=""><figcaption>${esc(p.name)} · aufgenommen ${esc(
              new Date(p.addedAt).toLocaleDateString("de-DE"),
            )}</figcaption></figure>`,
        )
        .join("");
      return `<section>
  <h2>${esc(i.text || "Ohne Bezeichnung")}</h2>
  <p class="meta">${esc(i.category)}${i.qty ? ` · Menge: ${esc(i.qty)}` : ""}${
    i.who ? ` · ${esc(i.who)}` : ""
  }</p>
  <div class="shots">${imgs}</div>
</section>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Inventar – ${esc(trip.destination || "Reise")}</title>
<style>
  body{font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
       max-width:52rem;margin:0 auto;padding:2rem 1.25rem;color:#3A342C}
  h1{font-size:1.6rem;margin:0 0 .25rem}
  .lead{color:#6C6480;margin:0 0 2rem}
  section{border-top:1px solid #EFE8E2;padding:1.25rem 0}
  h2{font-size:1.05rem;margin:0}
  .meta{color:#6C6480;font-size:.85rem;margin:.15rem 0 .75rem}
  .shots{display:flex;flex-wrap:wrap;gap:.75rem}
  figure{margin:0;width:13rem}
  /* Feste Kachel mit object-fit: sonst springt jede Zeile in einer anderen
     Hoehe und die Liste wirkt zusammengewuerfelt statt wie ein Dokument. */
  img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:.6rem;display:block;background:#F0EAE4}
  figcaption{font-size:.72rem;color:#6C6480;margin-top:.25rem}
  footer{margin-top:2.5rem;border-top:1px solid #EFE8E2;padding-top:1rem;
         font-size:.78rem;color:#6C6480}
  @media print{section{break-inside:avoid}}
</style></head><body>
<h1>Inventar – ${esc(trip.destination || "Reise")}</h1>
<p class="lead">Erstellt am ${esc(dateStr)}${
    trip.startDate ? ` · Reise ab ${esc(formatDateLong(trip.startDate))}` : ""
  } · ${withPhotos.length} Gegenstände mit Foto</p>
${rows || "<p>Keine Fotos hinterlegt.</p>"}
<footer>
  Erstellt mit kialia aus der Packliste dieser Reise. Die Aufnahmedaten stammen
  aus dem Zeitpunkt, an dem das Foto in der App hinterlegt wurde. Diese Datei
  enthält alle Bilder — sie ist ohne die App und ohne Internet vollständig lesbar.
</footer>
</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const slug = (trip.destination || "reise").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  a.download = `kialia-inventar-${slug}-${stamp.toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return {
    items: withPhotos.length,
    photos: [...byOwner.values()].reduce((n, l) => n + l.length, 0),
    bytes: blob.size,
  };
}

export { formatBytes };
