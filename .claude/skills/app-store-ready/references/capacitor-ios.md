# Von der Web-App zum iOS-Build

Der Pfad fuer dieses Projekt. Der Stand der Voraussetzungen steht in
`docs/MIGRATION.md` — dort nachsehen, nicht hier annehmen.

## Voraussetzung: statisches Bundle

Capacitor verpackt **statische Dateien**. TanStack Start rendert serverseitig
und baut ueber nitro zu einem Cloudflare Worker — das passt nicht zusammen,
solange die App einen Server braucht.

Reihenfolge, die Doppelarbeit vermeidet:

1. **Serverseitiges aufloesen.** Jede `createServerFn` muss verschwinden oder
   in eine Supabase Edge Function wandern. Solange eine uebrig ist, ist der
   Rest verfrueht.
2. **SSR abschalten**, statisches Bundle erzeugen, im Browser gegenpruefen.
3. **Erst dann** Capacitor hinzufuegen.

Wer in umgekehrter Reihenfolge arbeitet, baut die Huelle zweimal.

## Was im Web laeuft, laeuft nicht automatisch nativ

Alles, was das Betriebssystem meldet, verhaelt sich nativ anders. Kapsle es
hinter eine eigene Schnittstelle, die im Web ein No-op ist — sonst verteilt
sich Plattformlogik ueber die ganze Oberflaeche:

- **Geoeffnete Links** (Bestaetigungsmails, geteilte Plaene). Der schwierige
  Fall ist der Kaltstart: Das Ereignis kommt, bevor jemand zuhoert. Pruef nie
  "springt die App auf?", sondern "ist danach wirklich passiert, was passieren
  sollte?"
- **Rueckkehr aus dem Hintergrund** — Sitzung noch gueltig? Daten veraltet?
- **Berechtigungen** fuer Mikrofon, Fotos, Standort, Mitteilungen. Nativ
  braucht jede einen Zweck-Text in der `Info.plist`. Fehlt er, stuerzt die App
  beim Zugriff ab — nicht als Fehlermeldung, sondern hart.
- **Sichere Bereiche.** `env(safe-area-inset-*)` liefert nur mit
  `viewport-fit=cover` echte Werte. Nativ faellt eine falsch positionierte
  Leiste sofort auf.

## Auth-Rueckleitungen

Bestaetigungs- und Ruecksetzlinks muessen die App oeffnen, nicht Safari. Das
verlangt drei Dinge, die zusammenpassen:

1. Ein eigenes Schema oder Universal Links konfiguriert.
2. Dieselbe Adresse in der Supabase-Redirect-Liste (`supabase/config.toml`).
3. Code, der die geoeffnete Adresse **auswertet** und die Sitzung herstellt.

Punkt 3 wird am haeufigsten vergessen. Ohne ihn springt die App auf,
verschluckt den Link und tut nichts — schlimmer als gar keine Konfiguration,
weil der Nutzer glaubt, es haette funktioniert.

## Versionierung

- **Version** (`CFBundleShortVersionString`) ist die sichtbare Nummer.
- **Build** (`CFBundleVersion`) muss bei jedem Upload steigen — auch bei
  gleicher Version. Ein nicht erhoehter Build wird abgelehnt, bevor die
  Pruefung ueberhaupt beginnt.

Die Werte gehoeren in eine Quelle, aus der beide Plattformen lesen. Zwei
gepflegte Stellen driften garantiert auseinander.

## TestFlight

Interne Tester (bis 100, eigenes Team) bekommen Builds ohne Pruefung. Externe
Gruppen brauchen eine eigene, kuerzere Beta-Pruefung.

**Vor der ersten Einreichung auf einem echten Geraet testen, nicht nur im
Simulator.** Der Simulator hat kein Mobilfunknetz, keine echten
Berechtigungsdialoge, keinen Akku und keine Kamera. Genau dort liegen die
Fehler, die eine Reise-App unterwegs unbrauchbar machen.

## Bekannte Fallen dieses Projekts

- **iCloud-Verdraengung**: Builds, die bei 0 % CPU haengen, sind meist
  dateilose Platzhalter. Vor langem Debuggen pruefen, ob die Dateien lokal
  vorliegen.
- **Zeitzonen beim Deploy**: Aus dem Buildtag abgeleitete Datumswerte liegen
  abends gegenueber UTC in der Zukunft. Feste Werte verwenden.
