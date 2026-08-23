import { createFileRoute } from "@tanstack/react-router";
import { H2, LegalPage, Todo } from "@/components/app/legal";

export const Route = createFileRoute("/impressum")({
  head: () => ({ meta: [{ title: "Impressum – kialia" }] }),
  component: ImprintPage,
});

function ImprintPage() {
  return (
    <LegalPage title="Impressum">
      <H2>Angaben zum Anbieter</H2>
      <Todo>
        Name, Anschrift und E-Mail-Adresse des Betreibers. Bei einer Firma zusätzlich Rechtsform,
        Registereintrag und Vertretungsberechtigte, bei Umsatzsteuerpflicht die
        Umsatzsteuer-Identifikationsnummer.
      </Todo>

      <H2>Verantwortlich für den Inhalt</H2>
      <Todo>Name und Anschrift — in der Regel dieselben Angaben wie oben.</Todo>

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
        Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>
    </LegalPage>
  );
}
