/**
 * Offline-Betrieb.
 *
 * Der Anlass: die App laed ohne Netz gar nicht. Auf einer Reise ist das der
 * schlechteste denkbare Moment — Packliste, Adressen und Uhrzeiten liegen zwar
 * im Geraet, aber die Huelle, die sie anzeigt, kommt aus dem Netz.
 *
 * DIE ENTSCHEIDENDE REGEL ist "network-first" fuer Seitenaufrufe. Ein Service
 * Worker, der HTML aus dem Cache bevorzugt, friert eine Fassung ein: nach dem
 * naechsten Deploy zeigt das Geraet altes HTML, das auf Asset-Namen verweist,
 * die es nicht mehr gibt — die App startet dann gar nicht mehr. Genau dieser
 * Fehler ist hier schon einmal passiert, ohne Service Worker, nur ueber
 * Cache-Header. Mit dieser Reihenfolge kann er nicht wiederkehren: solange
 * Netz da ist, gewinnt immer der Server. Der Cache ist ausschliesslich das
 * Netz darunter.
 *
 * Assets duerfen umgekehrt aus dem Cache kommen: ihre Namen enthalten einen
 * Inhalts-Hash, eine geaenderte Datei heisst also anders und wird ohnehin neu
 * geholt.
 */

const VERSION = "kialia-v1";
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;

// Nur die Huelle. Die Reisedaten liegen in localStorage und IndexedDB und
// haben mit dem Cache nichts zu tun.
const START = "/";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.add(new Request(START, { cache: "reload" })))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((namen) =>
        Promise.all(namen.filter((n) => !n.startsWith(VERSION)).map((n) => caches.delete(n))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Notausstieg: eine Nachricht aus der Seite raeumt alles ab. */
self.addEventListener("message", (e) => {
  if (e.data === "kialia:sw-abschalten") {
    e.waitUntil(
      caches
        .keys()
        .then((n) => Promise.all(n.map((k) => caches.delete(k))))
        .then(() => self.registration.unregister()),
    );
  }
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Alles, was zum Server MUSS, nie anfassen: Anmeldung, Abgleich, Sprache.
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/auth/v1")) return;

  const istSeite = req.mode === "navigate";
  const istAsset = url.pathname.startsWith("/assets/") || url.pathname.startsWith("/fonts/");

  if (istSeite) {
    // Netz zuerst. Nur wenn es nicht antwortet, die letzte gesehene Fassung.
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const kopie = res.clone();
            void caches.open(SHELL).then((c) => c.put(START, kopie));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(START)
            .then(
              (treffer) =>
                treffer ??
                new Response(
                  "<!doctype html><meta charset=utf-8><title>kialia offline</title>" +
                    '<body style="font-family:system-ui;background:#EFE7D9;color:#3A342C;' +
                    'padding:40px;line-height:1.5">' +
                    "<h1>Keine Verbindung</h1><p>kialia konnte nicht geladen werden. " +
                    "Deine Reisedaten liegen weiterhin auf diesem Gerät — sobald du wieder " +
                    "online bist, sind sie da.</p>",
                  { headers: { "content-type": "text/html; charset=utf-8" } },
                ),
            ),
        ),
    );
    return;
  }

  if (istAsset) {
    // Der Name traegt den Inhalts-Hash, also ist der Cache immer richtig.
    e.respondWith(
      caches.match(req).then(
        (treffer) =>
          treffer ??
          fetch(req).then((res) => {
            if (res && res.ok) {
              const kopie = res.clone();
              void caches.open(ASSETS).then((c) => c.put(req, kopie));
            }
            return res;
          }),
      ),
    );
  }
});
