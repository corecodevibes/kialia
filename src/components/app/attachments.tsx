import { useEffect, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Paperclip, Trash2 } from "lucide-react";
import {
  addAttachment,
  deleteAttachment,
  formatBytes,
  getAttachmentBlob,
  listAttachments,
  type AttachmentInfo,
} from "@/lib/attachments";

/**
 * Belege an einem Reiseposten.
 *
 * Der Beleg liegt auf dem Gerät, nicht im Netz: am Flughafen ohne Empfang ist
 * die Buchungsbestätigung genau dann wichtig, wenn nichts lädt. Geöffnet wird
 * über eine Objekt-URL, die danach wieder freigegeben wird — sonst hält der
 * Browser jede angesehene Datei im Speicher.
 */
export function Attachments({ ownerId, label }: { ownerId: string; label: string }) {
  const [items, setItems] = useState<AttachmentInfo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    listAttachments(ownerId)
      .then((a) => !cancelled && setItems(a))
      .catch(() => !cancelled && setError("Belege konnten nicht geladen werden."));
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    setError(null);
    try {
      for (const f of files) await addAttachment(ownerId, f);
      setItems(await listAttachments(ownerId));
    } catch {
      setError("Speichern hat nicht geklappt. Ist der Gerätespeicher voll?");
    } finally {
      setBusy(false);
    }
  }

  async function open(a: AttachmentInfo) {
    const blob = await getAttachmentBlob(a.id);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function remove(id: string) {
    await deleteAttachment(id);
    setItems(await listAttachments(ownerId));
  }

  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>

      {items.length > 0 && (
        <ul className="mt-1.5 space-y-1.5">
          {items.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded-xl bg-secondary/50 px-3 py-2">
              {a.type.startsWith("image/") ? (
                <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <FileText className="size-4 shrink-0 text-muted-foreground" />
              )}
              <button
                type="button"
                onClick={() => open(a)}
                className="min-w-0 flex-1 truncate text-left text-sm font-medium underline-offset-2 hover:underline"
              >
                {a.name}
              </button>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatBytes(a.size)}
              </span>
              <button
                type="button"
                onClick={() => remove(a.id)}
                aria-label={`${a.name} entfernen`}
                className="shrink-0 text-muted-foreground transition hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-foreground/25 py-2.5 text-xs font-semibold transition hover:bg-secondary/60 disabled:opacity-60"
      >
        <Paperclip className="size-3.5" />
        {busy ? "Wird gespeichert …" : items.length ? "Weiteren Beleg" : "Beleg anhängen"}
      </button>

      <input
        ref={input}
        type="file"
        multiple
        accept="image/*,application/pdf"
        onChange={onPick}
        className="hidden"
      />

      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
