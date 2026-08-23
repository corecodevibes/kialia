import { createFileRoute } from "@tanstack/react-router";
import { AnbieterBlock, H2, LegalPage } from "@/components/app/legal";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({ meta: [{ title: "Datenschutz – kialia" }] }),
  component: PrivacyPage,
});

/**
 * Der Inhalt beschreibt, was die App tatsaechlich tut — abgeglichen mit den
 * Migrationen, den Edge Functions und den ausgehenden Aufrufen, nicht aus
 * einer Vorlage uebernommen. Was hier steht, laesst sich im Code nachsehen.
 *
 * Zwei Angaben kann nur Steffen machen: Verantwortlicher und Kontaktadresse.
 * Sie sind sichtbar markiert statt still erfunden.
 */
function PrivacyPage() {
  return (
    <LegalPage title="Datenschutzerklärung">
      <p className="text-xs">Stand: 23. August 2026</p>

      <H2>Verantwortlicher</H2>
      <AnbieterBlock />

      <H2>Was gespeichert wird — und wo</H2>
      <p>
        <strong className="text-foreground">Auf eurem Gerät.</strong> Reisen, Pläne, Ideen,
        Packliste, Tagebuch und euer Reiseprofil liegen zunächst lokal im Browser. Angehängte
        Dateien — Fotos, Screenshots, Buchungsbestätigungen — bleiben ausschließlich lokal und
        werden nicht hochgeladen.
      </p>
      <p>
        <strong className="text-foreground">Bei Supabase (Frankfurt, EU).</strong> Für Konto und
        gemeinsames Planen: E-Mail-Adresse und ein Passwort-Hash, euer Name sowie die Angaben aus
        dem Onboarding (Mitreisende, Kinder, Haustiere), und — sobald ihr eine Reise teilt — die
        Reise selbst als Dokument samt Einladungscode und wer zuletzt gespeichert hat. Zugriff haben
        nur Konten, die Mitglied der jeweiligen Reise sind; das wird in der Datenbank selbst
        erzwungen, nicht erst in der App.
      </p>
      <p>
        <strong className="text-foreground">Beim Hoster.</strong> Die App wird über Cloudflare
        ausgeliefert. Dabei fallen wie bei jedem Webserver technische Zugriffsdaten an, unter
        anderem die IP-Adresse.
      </p>

      <H2>Wann Daten das Gerät verlassen</H2>
      <p>
        Vier Funktionen nutzen OpenAI. Sie laufen nur, wenn ihr sie ausdrücklich auslöst — nichts
        davon geschieht im Hintergrund:
      </p>
      <ul className="ml-4 list-disc space-y-1">
        <li>
          <strong className="text-foreground">Beleg auslesen:</strong> das von euch gewählte Bild.
        </li>
        <li>
          <strong className="text-foreground">Reisetag einsprechen:</strong> die Tonaufnahme.
        </li>
        <li>
          <strong className="text-foreground">Vorschläge fürs Ziel:</strong> das Reiseziel, die Art
          der Reise und die Dauer — und, falls hinterlegt, euer Reiseprofil aus den Einstellungen.
        </li>
        <li>
          <strong className="text-foreground">Kosten schätzen:</strong> das Reiseziel, die Art der
          Reise und die Personenzahl.
        </li>
      </ul>
      <p>
        Der Aufruf läuft über unseren eigenen Server; der Schlüssel liegt nie auf eurem Gerät.
        OpenAI verwendet über die Programmierschnittstelle übermittelte Daten nach eigenen Angaben
        nicht zum Training seiner Modelle.
      </p>
      <p>
        Für Währungsumrechnung wird der Tageskurs bei frankfurter.app abgerufen (Daten der
        Europäischen Zentralbank). Dabei werden nur zwei Währungskürzel übertragen, keine
        persönlichen Angaben.
      </p>

      <H2>Was nicht passiert</H2>
      <p>
        Keine Analyse-Werkzeuge, keine Werbung, kein Weiterverkauf, keine Weitergabe an Dritte über
        das oben Genannte hinaus. Beim Laden der App wird kein einziger fremder Server kontaktiert —
        auch die Schrift wird mitgeliefert statt nachgeladen.
      </p>

      <H2>Wie lange</H2>
      <p>
        Bis ihr löscht. In den Einstellungen könnt ihr euer Konto selbst löschen; damit gehen
        Profil, eigene Reisen und Mitgliedschaften unwiderruflich. Lokale Daten löscht ihr, indem
        ihr die Daten der Website im Browser entfernt oder die App deinstalliert.
      </p>

      <H2>Welches Recht gilt</H2>
      <p>
        Der Anbieter sitzt in der Schweiz, es gilt das Schweizer Datenschutzgesetz (DSG). Weil sich
        die App auch an Nutzerinnen und Nutzer in der EU richtet, gilt zusätzlich die
        Datenschutz-Grundverordnung. Die Daten liegen in Frankfurt, also innerhalb der EU.
      </p>

      <H2>Eure Rechte</H2>
      <p>
        Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch. Für
        Auskunft und Export genügt eine Nachricht an die oben genannte Adresse; das Löschen geht
        direkt in der App. Beschweren könnt ihr euch beim Eidgenössischen Datenschutz- und
        Öffentlichkeitsbeauftragten (EDÖB) oder, wenn ihr in der EU wohnt, bei der
        Datenschutzbehörde eures Landes.
      </p>

      <H2>Rechtsgrundlagen</H2>
      <p>
        Konto und Synchronisierung: Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO). Die
        KI-Funktionen und die Kursabfrage: euer Auslösen der jeweiligen Funktion (Art. 6 Abs. 1 lit.
        a und b DSGVO). Betrieb und Sicherheit der Auslieferung: berechtigtes Interesse (Art. 6 Abs.
        1 lit. f DSGVO). Nach Schweizer Recht stützt sich die Bearbeitung auf euer Einverständnis
        und auf die Erfüllung des Nutzungsverhältnisses.
      </p>

      <H2>Änderungen</H2>
      <p>
        Ändert sich, was die App mit Daten tut, wird diese Seite mitgeändert. Das Datum oben sagt,
        welcher Stand gilt.
      </p>
    </LegalPage>
  );
}
