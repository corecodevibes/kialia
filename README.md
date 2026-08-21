# kialia

Reisen gemeinsam planen — Route, Budget, Ideen und Reisetagebuch in einer App.
Web, iOS und Android aus einer Codebasis.

## Produktidee

Der Nutzer startet mit *„Wohin geht die naechste Reise?"* und waehlt die Art der
Reise (Rundreise, All Inclusive, Staedtetrip, Strand). Daraus entstehen vier
Bereiche:

1. **Plan** — Karte mit Stationen; wahlweise KI-Vorschlag anhand von Reisedauer
   und Zeitbudget oder manuelles Setzen der Punkte. Teilbar mit Partner/Familie,
   damit gemeinsam geplant werden kann.
2. **Ideen** — Sammelstelle fuer alles, was noch nicht terminiert ist.
3. **Budget** — Fortbewegung, Unterkunft, Essen pro Tag, Aktivitaeten. Dazu die
   monatliche Sparrate bis zur Abreise bzw. Abgleich mit bereits Gespartem.
4. **Tagebuch** — pro Reisetag Highlights, optional als Sprachnachricht
   diktiert und automatisch verschriftlicht. Ausgaben fliessen gegen das Budget.
   Export als PDF fuers Fotoalbum.

## Entwicklung

    bun install
    cp .env.example .env    # eigene Supabase-Credentials eintragen
    bun run dev             # http://localhost:8080

## Dokumentation

- `AGENTS.md` — Arbeitsregeln fuer die Codebasis
- `docs/MIGRATION.md` — Stand der Ablösung von Lovable, offene Schritte
