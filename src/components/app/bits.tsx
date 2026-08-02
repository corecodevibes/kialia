import { useState } from "react";
import { ExternalLink, Link2, Plus, Trash2 } from "lucide-react";
import { normalizeUrl, statusLabels, uid, type LinkItem, type PayStatus } from "@/lib/trip-store";
import { inputClass } from "./AppShell";

export function LinkList({
  links,
  onChange,
  placeholder = "Link speichern (z. B. GetYourGuide, Restaurant …)",
}: {
  links: LinkItem[];
  onChange: (links: LinkItem[]) => void;
  placeholder?: string;
}) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  function add() {
    const clean = normalizeUrl(url);
    if (!clean) return;
    onChange([...links, { id: uid(), label: label.trim() || clean.replace(/^https?:\/\//, ""), url: clean }]);
    setUrl("");
    setLabel("");
  }

  return (
    <div className="space-y-2">
      {links.map((l) => (
        <div key={l.id} className="flex items-center gap-2 rounded-xl bg-secondary/50 px-3 py-2">
          <Link2 className="size-4 shrink-0 text-primary" />
          <a
            href={l.url}
            target="_blank"
            rel="noreferrer noopener"
            className="min-w-0 flex-1 truncate text-sm font-medium underline-offset-2 hover:underline"
          >
            {l.label}
          </a>
          <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
          <button
            type="button"
            aria-label="Link entfernen"
            onClick={() => onChange(links.filter((x) => x.id !== l.id))}
          >
            <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Name"
          className={`${inputClass} w-28 shrink-0`}
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={placeholder}
          className={inputClass}
        />
        <button
          type="button"
          onClick={add}
          aria-label="Link hinzufügen"
          className="shrink-0 rounded-xl bg-primary px-3 text-primary-foreground"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function StatusPicker({
  value,
  onChange,
}: {
  value: PayStatus;
  onChange: (v: PayStatus) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {(Object.keys(statusLabels) as PayStatus[]).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`flex-1 rounded-full border px-2 py-1.5 text-xs font-medium transition ${
            value === s ? "border-primary bg-primary/10" : "border-border text-muted-foreground"
          }`}
        >
          {statusLabels[s]}
        </button>
      ))}
    </div>
  );
}
