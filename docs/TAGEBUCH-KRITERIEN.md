# Tagebuch: Erfolgskriterien aus der Recherche und ihr Stand

**Stand:** 01.11.2026 · **Quellen:** Such-Recherche (Marktübersichten, Herstellerseiten,
Nutzerstudien zu Journaling-Apps). Die Quellen sind überwiegend Vergleichsseiten
und Herstellerangaben; Retention-Zahlen gibt es in den öffentlichen Quellen nicht.

## Was die Recherche als erfolgsrelevant benennt

| Kriterium                              | Quelle (Kurzform)                                                                                     | Stand in kialia                                                                                                |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Schnelles Festhalten, wenig Reibung    | Studie zu einer Dankbarkeits-App: schnelles Festhalten fördert regelmäßige Nutzung (arXiv 2404.17698) | **vorhanden:** Eingabe in einem Feld, "Ein Satz reicht."                                                       |
| Einstimmung per Stimmung in zwei Tipps | Daylio, Zweitipp-Stimmung                                                                             | **vorhanden:** sechs Stimmungs-Wörter, aufklappbar                                                             |
| Schreibimpuls gegen die leere Seite    | mehrere Vergleiche: Vorlagen und Impulse gegen Schreibhemmung                                         | **vorhanden:** Tagesfrage je Reisetag                                                                          |
| Erinnerungen und Impulse               | Day One, Studie zu Dankbarkeit: geplante Hinweise helfen beim Dranbleiben                             | **nicht umgesetzt:** Web-Erinnerungen sind auf iOS unzuverlässig. Erst mit nativer Hülle (Capacitor) sinnvoll. |
| Fotos je Eintrag                       | Reisetagebücher: Foto- und Videoanhänge als Grundfunktion                                             | **jetzt umgesetzt:** Fotoleiste je Reisetag                                                                    |
| Suche über alle Einträge               | Day One: Suche und Schlagworte für schnelles Finden                                                   | **jetzt umgesetzt:** Suche über Text, Höhepunkt, Notizen, Stimmung                                             |
| Rückblick "An diesem Tag"              | Day One: als Alleinstellungsmerkmal genannt                                                           | **offen:** auf Reisen mit festen Tagen wenig Sinn; später prüfen                                               |
| Ausgelassener Tag ist kein Bruch       | Hinweise zu Onboarding und Retention                                                                  | **vorhanden:** Tage lassen sich jederzeit nachtragen; keine Strafe, kein Zähler                                |
| Export und Buch                        | Day One: Buchdruck; Reisedienste: Fotobuch                                                            | **vorhanden:** PDF in drei Formaten                                                                            |

## Was bewusst nicht übernommen wurde

- **Verschlüsselung mit Schloss** (Bonjournal): der Datenschutz liegt bei Supabase
  mit Zugriffsregeln, nicht im Gerät. Ein Schloss ohne Ende-zu-Ende-Verschlüsselung
  wäre eine Scheinsicherheit.
- **Soziale Funktionen** (Kommentare, Reaktionen): die Reise ist privat für zwei
  Menschen. Das Versprechen der App ist Ruhe, nicht Reichweite.

## Offen

1. Erinnerungen: sinnvoll erst mit nativer Hülle; dann abends eine Nachfrage, nicht stündlich.
2. Rückblick "An diesem Tag": nur für eine zweite Reise oder ein Jahresarchiv.
3. Nutzungsdaten: ohne Analytics ist Retention nicht messbar. Entscheidung nötig, ob
   anonyme Zählung (Schwelle: keine personenbezogenen Daten) gewünscht ist.
