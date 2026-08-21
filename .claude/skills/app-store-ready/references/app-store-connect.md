# App Store Connect — was einzurichten ist

Alles Regulatorische gegen die aktuelle Fassung pruefen. Diese Datei sagt, was
zu erledigen ist und in welcher Reihenfolge — nicht, wie die Regel heute lautet.

## Was Vorlauf braucht (Wochen, nicht Stunden)

Diese Punkte blockieren still, wenn man sie zu spaet angeht:

- **Apple Developer Program** — kostenpflichtige Jahresmitgliedschaft. Bei
  Einzelpersonen dauert die Identitaetspruefung teils Tage. Fuer eine
  Organisation braucht es eine D-U-N-S-Nummer; deren Beantragung dauert
  laenger als alles andere in dieser Liste.
- **Vertraege, Steuern, Bankverbindung** unter *Business*. Ohne
  vollstaendigen Vertrag laesst sich nichts Kostenpflichtiges verkaufen — und
  bei kostenlosen Apps blockiert ein unvollstaendiges Steuerformular
  gelegentlich trotzdem die Freigabe.
- **Datenschutzerklaerung unter einer erreichbaren URL.** Pflichtfeld. Sie
  muss beschreiben, was tatsaechlich passiert — nicht, was ueblich ist.
- **Support-URL** und eine erreichbare Kontaktadresse.

## Identitaet der App

- **Bundle-ID** — unveraenderlich, sobald sie mit einer App verknuepft ist.
  Umgekehrte Domain, z. B. `app.kialia.ios`. Vorher entscheiden.
- **SKU** — nur intern, frei waehlbar.
- **Name (30 Zeichen)** und **Untertitel (30 Zeichen)** tragen zusammen die
  Auffindbarkeit. Der Untertitel ist kein Slogan, sondern der zweite
  Suchbegriff-Traeger.
- **Keyword-Feld (100 Zeichen)** — kommagetrennt, ohne Leerzeichen nach dem
  Komma (die zaehlen mit). Woerter aus Name und Untertitel nicht wiederholen,
  sie sind bereits indiziert.
- **Primaere Kategorie** entscheidet mit, gegen wen man in der Rangliste
  antritt. Eine kleinere passende Kategorie schlaegt eine grosse unpassende.

## Datenschutz-Angaben

Das Formular (*App Privacy*) fragt pro Datenart: erhoben, verknuepft mit der
Person, zum Tracking verwendet. Zwei Dinge gehen dabei regelmaessig schief:

- **Drittanbieter werden vergessen.** Analyse-, Absturz- und
  Werbe-Bibliotheken erheben Daten, auch wenn der eigene Code das nicht tut.
  Was ein SDK sammelt, gehoert ins Formular.
- **Die Angabe passt nicht zum Verhalten.** Das ist ein Ablehnungsgrund und
  ein Vertrauensbruch. Vor dem Ausfuellen den tatsaechlichen Netzverkehr
  ansehen, nicht die Absicht.

Fuer kialia heute relevant: E-Mail-Adresse (Konto), Nutzerinhalte (Reisen,
Tagebuch), grobe Diagnosedaten. Wenn Standort, Fotos oder Mikrofon dazukommen,
das Formular **im selben Zug** nachziehen.

## Account-Loeschung

Wenn die App Kontoerstellung anbietet, muss sie **in der App** einen Weg zur
vollstaendigen Loeschung des Kontos bieten — nicht nur zum Abmelden, nicht nur
per E-Mail an den Support. Das ist einer der haeufigsten Ablehnungsgruende bei
Erstinreichungen und betrifft kialia direkt.

Serverseitig heisst das: Nutzerzeile und alle abhaengigen Daten wirklich
loeschen. Ein `ON DELETE CASCADE` auf `auth.users` erledigt den Datenteil; das
Loeschen des Auth-Nutzers selbst braucht eine privilegierte Funktion
(Edge Function mit Service-Role), nicht den Client.

## Screenshots

Die ersten drei tragen die Konversion — die meisten Menschen wischen nicht
weiter.

- Pro Bildschirm **ein Ergebnis in Textform**, nicht die nackte Oberflaeche.
  "Sieh, was die Reise wirklich kostet" schlaegt einen abfotografierten
  Budget-Screen ohne Text.
- Lesbar als Daumennagel. Wenn die Bildunterschrift bei 25 % Groesse
  unleserlich ist, ist sie zu lang oder zu klein.
- In der Sprache des Zielmarkts. Eine deutschsprachige App mit englischen
  Screenshots verliert genau die Nutzer, die sie sucht.
- Groessen und Pflichtformate aendern sich; die aktuell geforderten Geraete
  in App Store Connect nachsehen statt aus dem Gedaechtnis zu rendern.

## Reviewer-Zugang

Alles hinter einem Login braucht ein **Demokonto** mit Zugangsdaten in den
Review-Notizen — sonst sieht die Pruefung eine Anmeldemaske und lehnt ab. Das
Konto muss echte Beispieldaten enthalten: Eine leere App wirkt unfertig.

Bei kialia: ein Konto mit einer vollstaendig geplanten Reise, Budget und ein
paar Tagebucheintraegen. Vor jeder Einreichung pruefen, dass es noch
funktioniert.

## Vor dem Absenden

- **Version** (sichtbar, z. B. 1.0.0) und **Build** (fortlaufend) — jede
  Einreichung braucht eine neue Build-Nummer, auch wenn die Version bleibt.
- **Exportbestimmungen** — die Verschluesselungsfrage wird bei jedem Build
  gestellt.
- **Freigabe**: manuell oder automatisch. Manuell ist bei der ersten Version
  ruhiger — man will den Moment selbst waehlen.
