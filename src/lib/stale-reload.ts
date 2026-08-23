/**
 * Selbstheilung, wenn das Geraet eine veraltete Seite festhaelt.
 *
 * Die Dateien unter /assets tragen einen Hash im Namen. Nach einer neuen
 * Auslieferung heissen sie anders — die alten liefern 404. Haelt ein Browser
 * die alte HTML fest (iOS tut das bei einer zum Homescreen hinzugefuegten App
 * besonders hartnaeckig), fragt er nach Dateien, die es nicht mehr gibt. Die
 * App startet dann gar nicht: kein Fehler, kein Hinweis, nur eine Seite, die
 * nichts tut. Von aussen sieht das aus wie "ich kann mich nicht anmelden".
 *
 * Genau das ist Steffen und Annalina passiert, nachdem ich an einem Tag
 * fuenfzehnmal ausgeliefert habe.
 *
 * Vite meldet einen solchen Fehlschlag als `vite:preloadError`. Wir laden dann
 * einmal neu — hart, damit die HTML wirklich neu geholt wird. Ein Merker in
 * sessionStorage verhindert eine Schleife: klappt es auch nach dem Neuladen
 * nicht, liegt es an etwas anderem und wir hoeren auf.
 */
const KEY = "kialia.staleReload";

export function watchForStaleBuild(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("vite:preloadError", (event) => {
    // Ohne preventDefault wirft Vite den Fehler weiter und die Seite bleibt
    // ohnehin kaputt — wir wollen stattdessen den Neuladeversuch.
    event.preventDefault();

    try {
      if (window.sessionStorage.getItem(KEY)) return;
      window.sessionStorage.setItem(KEY, "1");
    } catch {
      // Kein sessionStorage: dann lieber gar nicht neu laden als in einer
      // Schleife zu landen.
      return;
    }
    window.location.reload();
  });

  // Ist die App einmal durchgestartet, ist der Merker erledigt. Sonst wuerde
  // ein spaeterer, echter Fehlschlag in derselben Sitzung nicht mehr geheilt.
  window.setTimeout(() => {
    try {
      window.sessionStorage.removeItem(KEY);
    } catch {
      /* egal */
    }
  }, 5000);
}
