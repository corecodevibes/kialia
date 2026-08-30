/**
 * Beleg auslesen.
 *
 * Läuft serverseitig, weil der API-Schlüssel nicht in eine App gehört: alles,
 * was im Bundle liegt, ist öffentlich. Die Funktion nimmt ein Bild oder einen
 * Text entgegen und gibt strukturierte Felder zurück — mehr nicht.
 *
 * SIE ENTSCHEIDET NICHTS. Was hier herauskommt, wird dem Nutzer zur
 * Bestätigung vorgelegt, Feld für Feld. Ein Modell, das Daten still in eine
 * Buchung schreibt, ist eine Fehlerquelle mit Ansage.
 *
 * WAS NICHT ERKANNT WIRD, BLEIBT LEER. Das Modell wird ausdrücklich
 * angewiesen, null zurückzugeben statt zu raten — eine erfundene Abflugzeit
 * ist schlimmer als eine fehlende.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    kind: {
      type: ["string", "null"],
      enum: ["flug", "unterkunft", "aktivitaet", "sonstiges", null],
      description: "Art des Belegs",
    },
    title: { type: ["string", "null"], description: "Name: Hotel, Fluglinie, Anbieter" },
    address: { type: ["string", "null"], description: "Adresse oder Ort, falls angegeben" },
    startDate: { type: ["string", "null"], description: "Beginn als YYYY-MM-DD" },
    endDate: { type: ["string", "null"], description: "Ende als YYYY-MM-DD" },
    startTime: { type: ["string", "null"], description: "Uhrzeit als HH:MM, falls angegeben" },
    amount: { type: ["number", "null"], description: "Gesamtbetrag als Zahl" },
    currency: { type: ["string", "null"], description: "Währungscode, z.B. EUR" },
    bookingRef: { type: ["string", "null"], description: "Buchungsnummer" },
  },
  required: [
    "kind", "title", "address", "startDate", "endDate",
    "startTime", "amount", "currency", "bookingRef",
  ],
} as const;

const SYSTEM = `Du liest Reisebelege: Buchungsbestätigungen, Tickets, Hotelreservierungen.
Gib ausschliesslich die Felder zurück, die im Beleg WIRKLICH stehen.

Regeln, die über allem stehen:
- Was du nicht sicher erkennst, ist null. Rate nie.
- Datumsangaben immer als YYYY-MM-DD. Steht nur "27. Aug", ergänze das Jahr NICHT — dann ist es null.
- Beträge ohne Währungszeichen, die Währung kommt separat.
- Bei mehreren Beträgen: der Gesamtbetrag, nicht Teilbeträge.
- Antworte auf Deutsch, wo Text gefragt ist.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) {
    return new Response(
      JSON.stringify({ error: "Die Scan-Funktion ist noch nicht eingerichtet." }),
      { status: 503, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }

  try {
    const { imageBase64, mimeType } = await req.json();

    // Der Text-Weg ist bewusst geschlossen: er war der einzige Pfad, über den
    // ein Nutzer frei formulierte Anweisungen an das Modell hätte schicken
    // können. Ein Beleg ist ein Bild — mehr braucht es nicht.
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Kein Beleg mitgeschickt." }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const bytes = Math.ceil((imageBase64.length * 3) / 4);
    if (bytes > 6 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "Der Beleg ist zu groß." }), {
        status: 413,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const content = [
      { type: "text", text: "Lies diesen Reisebeleg aus." },
      {
        type: "image_url",
        image_url: { url: `data:${mimeType ?? "image/jpeg"};base64,${imageBase64}` },
      },
    ];

    // Zeitgrenze wie bei den anderen drei Funktionen. Ohne sie wartet ein
    // haengender Aufruf unbegrenzt, und der Nutzer sieht einen Knopf, der
    // nicht mehr zurueckkommt.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      signal: controller.signal,
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "beleg", strict: true, schema: SCHEMA },
        },
        max_tokens: 400,
      }),
    });

    clearTimeout(timer);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`OpenAI ${res.status}: ${body.slice(0, 400)}`);
      // Der Grund bleibt im Log — nach draussen geht eine Meldung, mit der man
      // etwas anfangen kann, ohne Interna preiszugeben.
      const message =
        res.status === 429
          ? "Gerade zu viele Anfragen. Versuch es in einer Minute nochmal."
          : res.status === 401
            ? "Die Scan-Funktion ist nicht richtig eingerichtet."
            : "Der Beleg konnte nicht gelesen werden.";
      return new Response(JSON.stringify({ error: message }), {
        status: 502,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content;
    const fields = typeof raw === "string" ? JSON.parse(raw) : raw;

    return new Response(JSON.stringify({ fields }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    // Abbruch durch die Zeitgrenze bekommt eine eigene Meldung: "konnte nicht
    // gelesen werden" klingt nach einem schlechten Foto, dabei war es das Netz.
    if (err instanceof Error && err.name === "AbortError") {
      return new Response(
        JSON.stringify({ error: "Das hat zu lange gedauert. Versuch es nochmal." }),
        { status: 504, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }
    console.error(err);
    return new Response(JSON.stringify({ error: "Der Beleg konnte nicht gelesen werden." }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
