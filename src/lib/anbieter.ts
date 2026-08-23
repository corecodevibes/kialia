/**
 * Anbieterangaben — die einzige Stelle, an der sie stehen.
 *
 * Impressum und Datenschutzerklaerung lesen beide von hier. Solange ein Feld
 * leer ist, zeigt die jeweilige Seite einen rot markierten Hinweis statt einer
 * erfundenen Angabe; sobald es ausgefuellt ist, verschwindet der Hinweis von
 * selbst. So kann keine der beiden Seiten vergessen werden.
 */
export type Anbieter = {
  /** Vor- und Nachname, oder der Firmenname. */
  name: string;
  /** Strasse und Hausnummer. */
  strasse: string;
  /** Postleitzahl und Ort. */
  ort: string;
  /** Land — bei einer Schweizer Adresse "Schweiz". */
  land: string;
  /** Adresse fuer Datenschutzanfragen und Impressum. */
  email: string;
  /** Nur bei einer Firma: Rechtsform, Register, Vertretung. Sonst leer lassen. */
  firmenangaben?: string;
  /** Nur bei Umsatzsteuerpflicht. Sonst leer lassen. */
  ustId?: string;
};

export const ANBIETER: Anbieter = {
  name: "Steffen Leier",
  strasse: "Neptunstrasse 42",
  ort: "8032 Zürich",
  land: "Schweiz",
  email: "code_n_core@gmx.ch",
  // Privat betrieben, kein Handelsregistereintrag, keine Umsatzsteuerpflicht.
  firmenangaben: "",
  ustId: "",
};

/** Sind die Pflichtangaben da? Danach richtet sich, was die Seiten zeigen. */
export function anbieterVollstaendig(a: Anbieter = ANBIETER): boolean {
  return Boolean(a.name && a.strasse && a.ort && a.land && a.email);
}
