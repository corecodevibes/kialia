import type { Trip } from "@/lib/trip-store";

/**
 * Zwei Fassungen derselben Reise zusammenfuehren.
 *
 * WARUM: Bisher gewann beim Abgleich eine ganze Fassung — "last write wins"
 * auf dem kompletten Dokument. Wer zuletzt hochschob, ueberschrieb alles vom
 * anderen. Auf Kreta hiess das: Steffen sieht Annalinas Eintraege nicht und
 * sie seine nicht, weil jedes Geraet dem anderen dauernd sein eigenes
 * Dokument darueberlegte. Ein gemeinsames Tagebuch, in dem gemeinsam nichts
 * ankommt.
 *
 * WIE: Die Reise besteht fast nur aus Listen mit stabilen ids. Die lassen sich
 * vereinigen, statt sie gegeneinander auszuspielen:
 *   - Was nur eine Seite hat, bleibt. Genau das fehlte.
 *   - Was beide haben, kommt von der juengeren Fassung.
 *   - Einzelwerte (Ziel, Daten, Waehrung, Budget) kommen komplett von der
 *     juengeren Fassung — sie einzeln zu mischen ergaebe Kraut und Rueben.
 *
 * DER PREIS: Loeschen ist schwaecher als Anlegen. Loescht eine Seite einen
 * Eintrag, den die andere noch hat, kommt er zurueck. Das ist die bewusste
 * Abwaegung: einen wieder auftauchenden Eintrag loescht man nochmal, einen
 * verlorenen Reisetag schreibt niemand neu.
 */

type WithId = { id: string };

function unionById<T extends WithId>(newer: T[], older: T[]): T[] {
  const out: T[] = [];
  const gesehen = new Set<string>();
  // Die juengere Fassung gibt Inhalt UND Reihenfolge vor.
  for (const item of newer ?? []) {
    if (!item?.id || gesehen.has(item.id)) continue;
    gesehen.add(item.id);
    out.push(item);
  }
  for (const item of older ?? []) {
    if (!item?.id || gesehen.has(item.id)) continue;
    gesehen.add(item.id);
    out.push(item);
  }
  return out;
}

export function mergeTrips(local: Trip, remote: Trip, localIsNewer: boolean): Trip {
  const newer = localIsNewer ? local : remote;
  const older = localIsNewer ? remote : local;

  return {
    // Einzelwerte von der juengeren Fassung.
    ...newer,
    // Die Server-Kennungen kommen immer von der Fassung, die sie hat.
    ...(local.remoteId || remote.remoteId ? { remoteId: local.remoteId || remote.remoteId } : {}),
    ...(local.inviteCode || remote.inviteCode
      ? { inviteCode: local.inviteCode || remote.inviteCode }
      : {}),
    // Listen vereinigt.
    transports: unionById(newer.transports ?? [], older.transports ?? []),
    stays: unionById(newer.stays ?? [], older.stays ?? []),
    activities: unionById(newer.activities ?? [], older.activities ?? []),
    ideas: unionById(newer.ideas ?? [], older.ideas ?? []),
    diary: unionById(newer.diary ?? [], older.diary ?? []),
    packing: unionById(newer.packing ?? [], older.packing ?? []).map((kat) => {
      // Auch INNERHALB einer Kategorie vereinigen: sonst verliert man die
      // Haken der anderen Person, sobald beide dieselbe Kategorie anfassen.
      const gegen = (older.packing ?? []).find((k) => k.id === kat.id);
      const vorn = (newer.packing ?? []).find((k) => k.id === kat.id);
      if (!gegen || !vorn) return kat;
      return { ...kat, items: unionById(vorn.items ?? [], gegen.items ?? []) };
    }),
  };
}
