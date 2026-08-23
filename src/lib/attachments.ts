/**
 * Belege an Reiseposten hängen — Buchungsbestätigungen, Tickets, Screenshots.
 *
 * WARUM NICHT localStorage: dort liegen heute alle Reisedaten, und der
 * Gesamtspeicher liegt bei etwa 5 MB. Ein einziges Handyfoto sprengt das.
 * Schlimmer noch: läuft der Speicher voll, schlägt auch das Speichern der
 * Reise selbst fehl — ein Beleg würde die Reisedaten mit in den Abgrund
 * ziehen.
 *
 * IndexedDB hat je nach Gerät hunderte MB, speichert Blobs ohne Umweg über
 * base64 (das jede Datei um ein Drittel aufbläht) und funktioniert offline.
 * Genau das ist die Anforderung: Was am Reisetag gebraucht wird —
 * Buchungsnummer, Adresse, Uhrzeit — muss ohne Netz auf dem Gerät liegen.
 */

const DB = "kialia-files";
const STORE = "attachments";
const VERSION = 1;

export type Attachment = {
  id: string;
  /** Der Posten, an dem der Beleg hängt (Transport, Unterkunft, Aktivität). */
  ownerId: string;
  name: string;
  type: string;
  size: number;
  addedAt: string;
  blob: Blob;
};

/** Was das UI braucht — ohne den Blob, damit Listen leicht bleiben. */
export type AttachmentInfo = Omit<Attachment, "blob">;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("ownerId", "ownerId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB nicht verfügbar"));
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

export async function addAttachment(ownerId: string, file: File): Promise<AttachmentInfo> {
  const item: Attachment = {
    id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    ownerId,
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    addedAt: new Date().toISOString(),
    blob: file,
  };
  await tx("readwrite", (s) => s.put(item));
  const { blob: _blob, ...info } = item;
  return info;
}

export async function listAttachments(ownerId: string): Promise<AttachmentInfo[]> {
  const all = await tx<Attachment[]>("readonly", (s) => s.index("ownerId").getAll(ownerId));
  return all
    .map(({ blob: _blob, ...info }) => info)
    .sort((a, b) => (a.addedAt < b.addedAt ? -1 : 1));
}

export async function getAttachmentBlob(id: string): Promise<Blob | null> {
  const item = await tx<Attachment | undefined>("readonly", (s) => s.get(id));
  return item?.blob ?? null;
}

export async function deleteAttachment(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}

/** Menschenlesbare Groesse — "2,4 MB" statt 2517483. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1).replace(".", ",")} MB`;
}

/**
 * Anzahl der Anhaenge fuer viele Posten auf einmal.
 *
 * Die Packliste hat schnell 60 Eintraege. Pro Eintrag einzeln zu fragen
 * hiesse 60 Transaktionen beim Oeffnen der Seite; einmal alles lesen und
 * zaehlen ist eine.
 */
export async function countByOwners(ownerIds: string[]): Promise<Record<string, number>> {
  if (ownerIds.length === 0) return {};
  const wanted = new Set(ownerIds);
  const all = await tx<Attachment[]>("readonly", (s) => s.getAll());
  const out: Record<string, number> = {};
  for (const a of all) {
    if (wanted.has(a.ownerId)) out[a.ownerId] = (out[a.ownerId] ?? 0) + 1;
  }
  return out;
}

/** Alle Anhaenge mehrerer Posten samt Blob — fuer den Inventar-Export. */
export async function loadForOwners(ownerIds: string[]): Promise<Attachment[]> {
  if (ownerIds.length === 0) return [];
  const wanted = new Set(ownerIds);
  const all = await tx<Attachment[]>("readonly", (s) => s.getAll());
  return all.filter((a) => wanted.has(a.ownerId)).sort((a, b) => (a.addedAt < b.addedAt ? -1 : 1));
}

/**
 * Bittet den Browser, diesen Speicher nicht zu verdraengen.
 *
 * Ohne das gilt IndexedDB als "best effort": wird der Geraetespeicher knapp,
 * loescht der Browser ihn ohne Rueckfrage. Fuer Belege waere das aergerlich,
 * fuer eine Inventarliste, die im Schadensfall zaehlen soll, waere es fatal —
 * und man merkte es genau dann, wenn man sie braucht.
 *
 * Die Antwort ist eine Bitte, keine Garantie. Safari knuepft sie an das
 * Hinzufuegen zum Homescreen, Chrome an die bisherige Nutzung. Deshalb wird
 * das Ergebnis zurueckgegeben statt verschluckt: die Oberflaeche kann sagen,
 * woran man ist.
 */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
