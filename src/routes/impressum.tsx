import { createFileRoute } from "@tanstack/react-router";
import { AnbieterBlock, H2, LegalPage } from "@/components/app/legal";

export const Route = createFileRoute("/impressum")({
  head: () => ({ meta: [{ title: "Impressum – kialia" }] }),
  component: ImprintPage,
});

function ImprintPage() {
  return (
    <LegalPage title="Impressum">
      <H2>Angaben zum Anbieter</H2>
      <AnbieterBlock mitFirma />

      <H2>Verantwortlich für den Inhalt</H2>
      <AnbieterBlock />

      <H2>Haftung für Inhalte und Links</H2>
      <p>
        Die Inhalte dieser App werden mit Sorgfalt erstellt, für ihre Richtigkeit und
        Vollständigkeit wird jedoch keine Gewähr übernommen. Das gilt ausdrücklich auch für
        Vorschläge und Kostenschätzungen, die maschinell erzeugt werden: sie sind Anregungen und
        Größenordnungen, keine geprüften Angaben.
      </p>
      <p>
        Für Inhalte hinter Links, die ihr selbst hinterlegt oder die in Vorschlägen genannt werden,
        sind die jeweiligen Anbieter verantwortlich.
      </p>

      <H2>Streitbeilegung</H2>
      <p>
        Der Anbieter betreibt kialia privat und nimmt an keinem Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teil. Bei Problemen genügt eine Nachricht an die oben genannte
        Adresse — das ist der schnellere Weg.
      </p>
    </LegalPage>
  );
}
