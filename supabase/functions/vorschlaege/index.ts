/**
 * Vorschläge und Kostenspannen für ein Reiseziel.
 *
 * ZWEI REGELN, DIE DEN AUSSCHLAG GEBEN:
 *
 * 1. Ein Sprachmodell WEISS nicht, ob eine Taverne gut ist — es erzeugt eine
 *    plausibel klingende Meinung. Deshalb gibt es hier keine Bewertungen,
 *    keine Sterne, keine "Geheimtipps". Es gibt Vorschläge, die der Nutzer
 *    prüft, und die Oberfläche sagt genau das.
 *
 * 2. Kosten kommen als SPANNE, nie als Centbetrag. "62,40 € pro Tag" wäre
 *    erfunden; "55–85 € pro Person und Tag" ist eine ehrliche Größenordnung,
 *    die beim Planen tatsächlich hilft.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const IDEAS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    ideas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string", description: "Ort oder Aktivität, konkret benannt" },
          why: { type: "string", description: "Ein kurzer Satz, warum es sich lohnt" },
          category: { type: "string", enum: ["essen", "natur", "kultur", "aktivitaet", "ort"] },
        },
        required: ["title", "why", "category"],
      },
    },
  },
  required: ["ideas"],
} as const;

const COSTS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    currency: { type: "string", description: "Währungscode des Ziels" },
    perDay: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          category: { type: "string", enum: ["fruehstueck", "mittag", "abend", "snacks", "unterkunft", "transport", "aktivitaet"] },
          min: { type: "number" },
          max: { type: "number" },
        },
        required: ["category", "min", "max"],
      },
    },
    note: { type: "string", description: "Ein Satz zur Einordnung, etwa Saison oder Niveau" },
  },
  required: ["currency", "perDay", "note"],
} as const;

const IDEAS_SYSTEM = `Du schlägst Orte und Aktivitäten für eine Reise vor.

Regeln:
- Konkrete, bekannte Orte und Aktivitäten. Keine erfundenen Namen.
- KEINE Bewertungen, keine Sterne, keine Superlative wie "das beste" oder
  "Geheimtipp". Du kennst die aktuelle Qualität nicht.
- "why" ist ein sachlicher Satz, was einen dort erwartet — kein Werbetext.
- Antworte auf Deutsch.
- 8 Vorschläge, gemischt über die Kategorien.`;

const COSTS_SYSTEM = `Du schätzt Reisekosten als Größenordnung.

Regeln:
- IMMER Spannen, nie Punktwerte. Die Spanne darf breit sein.
- Beträge pro Person und Tag, in der Landeswährung des Ziels.
- Unterkunft pro Nacht und Zimmer, nicht pro Person.
- "note" nennt in einem Satz, worauf sich die Schätzung bezieht
  (Reisestil, Saison), damit klar ist, was sie NICHT abdeckt.
- Antworte auf Deutsch.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "Die Funktion ist noch nicht eingerichtet." }), {
      status: 503,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const { kind, destination, tripKind, travellers, days } = await req.json();
    const dest = String(destination ?? "").trim();
    if (!dest) {
      return new Response(JSON.stringify({ error: "Kein Reiseziel angegeben." }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const wantIdeas = kind !== "kosten";
    const prompt = wantIdeas
      ? `Reiseziel: ${dest}${tripKind ? `, Art: ${tripKind}` : ""}${days ? `, ${days} Tage` : ""}.`
      : `Reiseziel: ${dest}${tripKind ? `, Art: ${tripKind}` : ""}${
          travellers ? `, ${travellers} Personen` : ""
        }. Schätze die Kosten pro Person und Tag.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: wantIdeas ? IDEAS_SYSTEM : COSTS_SYSTEM },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: wantIdeas ? "ideen" : "kosten",
            strict: true,
            schema: wantIdeas ? IDEAS_SCHEMA : COSTS_SCHEMA,
          },
        },
        max_tokens: 900,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`OpenAI ${res.status}: ${body.slice(0, 400)}`);
      const message =
        res.status === 429
          ? "Gerade zu viele Anfragen. Versuch es in einer Minute nochmal."
          : "Die Vorschläge konnten nicht geholt werden.";
      return new Response(JSON.stringify({ error: message }), {
        status: 502,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content;
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    return new Response(JSON.stringify({ data }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Die Vorschläge konnten nicht geholt werden." }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
