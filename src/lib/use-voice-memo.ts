import { useCallback, useRef, useState } from "react";

type Recorder = {
  stream: MediaStream;
  ctx: AudioContext;
  source: MediaStreamAudioSourceNode;
  node: ScriptProcessorNode;
  chunks: Float32Array[];
};

function encodeWav(chunks: Float32Array[], sampleRate: number) {
  const length = chunks.reduce((s, c) => s + c.length, 0);
  const merged = new Float32Array(length);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }
  const target = 16000;
  const ratio = sampleRate / target;
  const outLength = Math.floor(merged.length / ratio);
  const buffer = new ArrayBuffer(44 + outLength * 2);
  const view = new DataView(buffer);
  const writeStr = (pos: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(pos + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + outLength * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, target, true);
  view.setUint32(28, target * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, outLength * 2, true);
  // Mittelwert ueber das Fenster statt einer einzelnen Stichprobe.
  //
  // Von 48 kHz auf 16 kHz einfach jeden dritten Wert zu nehmen erzeugt
  // Aliasing: hohe Anteile falten sich als Zischen in den hoerbaren Bereich.
  // Fuer das Ohr klingt beides aehnlich, fuer die Spracherkennung nicht —
  // und genau davon haengt hier alles ab. Der Mittelwert ist ein simpler
  // Tiefpass und kostet nichts.
  for (let i = 0; i < outLength; i++) {
    const from = Math.floor(i * ratio);
    const to = Math.min(merged.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    let count = 0;
    for (let j = from; j < to; j++) {
      sum += merged[j] ?? 0;
      count++;
    }
    const sample = count > 0 ? sum / count : (merged[from] ?? 0);
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Schneidet den Kopf einer data-URL ab.
 *
 * `readAsDataURL` liefert "data:audio/wav;base64,UklGR…". Der Server steckt
 * den Wert direkt in `atob()`, und die Zeichen ":" und ";" sind kein gueltiges
 * base64 — die Umwandlung scheiterte also immer, und zwar mit einer Meldung,
 * die nach einem Netzproblem aussah. Genau die Art Fehler, die man nicht
 * findet, wenn man nur prueft, ob der Knopf reagiert.
 */
export function stripDataUrl(value: string): string {
  const comma = value.indexOf(",");
  return value.startsWith("data:") && comma !== -1 ? value.slice(comma + 1) : value;
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(stripDataUrl(String(reader.result)));
    reader.onerror = () => reject(new Error("Aufnahme konnte nicht gelesen werden."));
    reader.readAsDataURL(blob);
  });
}

export function useVoiceMemo() {
  const rec = useRef<Recorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      // Auf iOS startet der Kontext haeufig im Zustand "suspended", auch
      // innerhalb einer Nutzeraktion. Dann laeuft onaudioprocess nie und man
      // haelt eine stumme Aufnahme in der Hand, ohne dass irgendetwas meldet.
      if (ctx.state === "suspended") await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createScriptProcessor(4096, 1, 1);
      const chunks: Float32Array[] = [];
      node.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      source.connect(node);
      node.connect(ctx.destination);
      rec.current = { stream, ctx, source, node, chunks };
      setRecording(true);
    } catch {
      setError("Kein Zugriff aufs Mikrofon.");
    }
  }, []);

  const stop = useCallback(async (): Promise<string | null> => {
    const r = rec.current;
    rec.current = null;
    setRecording(false);
    if (!r) return null;
    r.stream.getTracks().forEach((t) => t.stop());
    r.node.disconnect();
    r.source.disconnect();
    const blob = encodeWav(r.chunks, r.ctx.sampleRate);
    await r.ctx.close();
    if (blob.size < 4096) {
      setError("Die Aufnahme war zu kurz – bitte nochmal sprechen.");
      return null;
    }
    return blobToBase64(blob);
  }, []);

  const cancel = useCallback(() => {
    const r = rec.current;
    rec.current = null;
    setRecording(false);
    if (!r) return;
    r.stream.getTracks().forEach((t) => t.stop());
    r.node.disconnect();
    r.source.disconnect();
    void r.ctx.close();
  }, []);

  return { recording, error, setError, start, stop, cancel };
}
