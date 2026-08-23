/**
 * Sprachmemo verschriftlichen.
 *
 * Audio ist kein Freitext — es gibt hier keinen Weg, über den ein Nutzer
 * Anweisungen an ein Modell schmuggeln könnte. Deshalb ist das die sicherste
 * KI-Funktion der App, und sie darf die einzige sein, die roh Eingegebenes
 * verarbeitet.
 *
 * Grenzen bewusst eng: 10 MB und 25 Sekunden. Ein Reisetag lässt sich in einer
 * Minute erzählen; wer länger spricht, wartet sonst auf ein Ergebnis, das er
 * schneller getippt hätte.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_BYTES = 10 * 1024 * 1024;
const TIMEOUT_MS = 25_000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return json({ error: "Die Sprachfunktion ist noch nicht eingerichtet." }, 503);

  try {
    const { audioBase64, mimeType } = await req.json();
    if (!audioBase64) return json({ error: "Keine Aufnahme mitgeschickt." }, 400);

    // Auch data-URLs annehmen. Der Client soll reines base64 schicken, aber
    // wenn er es einmal nicht tut, darf daraus kein stiller Totalausfall
    // werden — genau das ist hier schon passiert.
    const raw = String(audioBase64);
    const comma = raw.indexOf(",");
    const clean = raw.startsWith("data:") && comma !== -1 ? raw.slice(comma + 1) : raw;

    let bin: Uint8Array;
    try {
      bin = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));
    } catch {
      return json({ error: "Die Aufnahme kam beschädigt an. Bitte nochmal sprechen." }, 400);
    }
    if (bin.byteLength > MAX_BYTES) {
      return json({ error: "Die Aufnahme ist zu lang. Sprich kürzer und öfter." }, 413);
    }

    const form = new FormData();
    form.append("model", "whisper-1");
    form.append("language", "de");
    form.append("file", new Blob([bin], { type: mimeType ?? "audio/wav" }), "memo.wav");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: form,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`Whisper ${res.status}: ${body.slice(0, 300)}`);
      return json(
        {
          error:
            res.status === 429
              ? "Gerade zu viele Anfragen. Gleich nochmal."
              : "Die Aufnahme konnte nicht verschriftlicht werden.",
        },
        502,
      );
    }

    const data = await res.json();
    const text = String(data?.text ?? "").trim();
    return json({ text });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    if (!aborted) console.error(err);
    return json(
      {
        error: aborted
          ? "Das hat zu lange gedauert. Sprich einen kürzeren Abschnitt."
          : "Die Aufnahme konnte nicht verschriftlicht werden.",
      },
      aborted ? 504 : 500,
    );
  }
});
