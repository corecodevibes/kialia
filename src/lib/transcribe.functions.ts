import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  audio: z.string().min(100),
  mimeType: z.string().default("audio/wav"),
});

function base64ToBytes(b64: string) {
  const clean = b64.includes(",") ? b64.slice(b64.indexOf(",") + 1) : b64;
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export const transcribeMemo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Sprach-Funktion ist nicht konfiguriert.");

    const bytes = base64ToBytes(data.audio);
    const form = new FormData();
    form.append("model", "openai/gpt-4o-mini-transcribe");
    form.append("file", new Blob([bytes], { type: data.mimeType }), "memo.wav");
    form.append("language", "de");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`Transcription failed [${res.status}]: ${body}`);
      if (res.status === 429) throw new Error("Zu viele Anfragen – bitte kurz warten.");
      if (res.status === 402) throw new Error("Kein Guthaben mehr für die Sprachfunktion.");
      throw new Error(`Transkription fehlgeschlagen (${res.status}).`);
    }

    const json = (await res.json()) as { text?: string };
    return { text: json.text ?? "" };
  });
