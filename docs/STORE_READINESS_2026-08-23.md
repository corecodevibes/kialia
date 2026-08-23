# Store-Bereitschaft — Stand 23.08.2026

Geprüft für einen späteren Build via Capacitor (iOS App Store, Google Play).
Der Web-Stand auf kialia.app ist davon unberührt und läuft.

## Lovable: vollständig gelöst

| Geprüft | Ergebnis |
| --- | --- |
| Quelltext (`src/`, `supabase/`) | Kein Treffer außer einer historischen Notiz in `transcribe.ts` |
| Abhängigkeiten (`package.json`) | Kein Lovable-Paket |
| **Lockfile (`bun.lock`)** | **8 Supabase-Pakete kamen über Lovables npm-Proxy — behoben** |
| Gebautes Bundle (`.output/`) | Kein Treffer |
| Netzwerkaufrufe der Live-App | **Null externe Aufrufe** (nachgemessen im Browser) |
| Transkription | Eigene Edge Function, Gateway abgelöst |

Der Lockfile-Fund war der einzige echte: Wer das Repo frisch klont — CI, ein neuer
Rechner, ein Build-Server für die Store-Builds — hätte weiter Lovables
Infrastruktur gebraucht. Prüfsummen waren identisch, am laufenden Code ändert
sich nichts. Mit leerem Cache verifiziert.

Bewusst **nicht** angefasst: der localStorage-Schlüssel `travelivibes.trips.v3`
und der Dateiname `travelivibes-logo.png`. Beide stammen aus einem Vorprojekt,
nicht aus Lovable. Der Schlüssel ist tragend — ihn umzubenennen würde alle
bereits erfassten Reisen verwaisen lassen. Der Dateiname ist kosmetisch, taucht
aber in den Netzwerkaufrufen auf; falls das stört, braucht es eine Umbenennung
plus die vier Importe.

## Blocker vor einer Einreichung

1. **SMTP nicht eingerichtet.** Niemand außer euch beiden kann sich registrieren —
   die Bestätigungsmail geht nicht raus. Blockiert jeden Tester und jeden Review,
   weil Apple und Google einen funktionierenden Demo-Zugang verlangen. Brevo-Daten
   liegen bei dir.
2. **Keine Datenschutzerklärung.** Pflicht in beiden Stores, unabhängig vom Preis.
   Muss benennen: E-Mail und Name (Supabase, EU/Frankfurt), Reiseinhalte,
   und — wichtig — dass Belegfotos, Sprachaufnahmen und das Reiseziel zur
   Verarbeitung an OpenAI gehen. Braucht eine öffentliche URL und einen Link
   in der App.
3. **Impressum.** Für einen Anbieter in der DACH-Region Pflicht, sobald die App
   öffentlich verfügbar ist.
4. **App-Identität.** `package.json` heißt `tanstack_start_ts` und hat keine
   Version. Vor dem ersten Build braucht es Bundle-ID (z. B. `app.kialia.app`),
   Versions- und Build-Nummer.

## Vorbereitet

- Kontolöschung in der App (`delete_own_account`) — Apple 5.1.1(v) erfüllt.
- Nur E-Mail-Login, kein Google/Facebook — „Sign in with Apple" ist damit
  **nicht** verpflichtend.
- Icons: 180/192/512/maskable/**1024** liegen unter `public/icons/`.
- Manifest vollständig (Name, Farben, Ausrichtung, maskable Icon).
- HTTPS, eigene Domain, EU-Datenhaltung.
- Schrift mitgeliefert — die App rendert offline korrekt und ruft keinen
  Dritten auf.

## Wenn die native Hülle gebaut wird

- **Berechtigungstexte.** Zwei Stellen greifen auf Hardware zu:
  `use-voice-memo.ts` auf das Mikrofon, `attachments.tsx` auf Fotos/Dateien.
  iOS braucht `NSMicrophoneUsageDescription` und
  `NSPhotoLibraryUsageDescription`; Android `RECORD_AUDIO` und Medienzugriff.
  Fehlt der Text, stürzt iOS beim ersten Zugriff ab — nicht theoretisch.
- **Datensicherheits-Formulare.** Play „Data safety" und Apples Nutzungslabels
  müssen den Weg zu OpenAI abbilden. Falschangaben führen zur Entfernung.
- **Apple 4.2 (Mindestfunktionalität).** Eine Capacitor-Hülle um eine Website
  ist ein bekannter Ablehnungsgrund. Kialia hat Gegenargumente — offline
  nutzbar, Mikrofon, Kamera, lokale Daten. Sie tragen stärker, wenn die native
  Fassung mindestens eine Sache kann, die die Website nicht kann. Kandidat:
  eine Erinnerung am Reisetag.
- **Verschlüsselungserklärung.** `ITSAppUsesNonExemptEncryption` auf `false`
  setzen, sonst hängt jeder Upload in der Warteschleife.

## Bekannte Lücken, die kein Blocker sind

- Anhänge werden nicht geteilt: Reisedaten synchronisieren, die Dateien liegen
  lokal in IndexedDB. Fällt zu zweit sofort auf.
- Keine Nutzungsmessung — es gibt keine Zahl dazu, ob jemand die App behält.
