import { useEffect, useState } from "react";
import logo from "@/assets/kialia-logo.png";

/**
 * Kurzer Markenmoment beim Kaltstart: das Fernglas dreht sich einmal um die
 * eigene Achse, der Schriftzug steigt darunter auf, danach blendet die ganze
 * Flaeche weg. Zusammen 1,3 Sekunden.
 *
 * Warum ueberhaupt: zwischen Antippen des Symbols und dem ersten Bildschirm
 * liegt ohnehin eine Lade-Luecke. Die kann man weiss lassen oder fuer die
 * Marke nutzen — teuer wirkende Apps tun Letzteres. Wichtig ist nur, dass es
 * die Luecke fuellt und nicht verlaengert: nach 1,3 Sekunden ist Schluss,
 * unabhaengig davon, ob jemand hinsieht.
 *
 * Wird schon beim Server-Rendern ausgegeben, damit beim ersten Bild nicht kurz
 * die Anmeldemaske aufblitzt und dann der Splash darueberfaellt.
 *
 * Bei `prefers-reduced-motion` gibt es weder Drehung noch Aufstieg noch
 * Blende — die Marke erscheint und verschwindet. Eine halb respektierte
 * Einstellung ist unangenehmer als gar keine.
 */
export function SplashScreen() {
  const [phase, setPhase] = useState<"visible" | "leaving" | "done">("visible");

  useEffect(() => {
    const leave = setTimeout(() => setPhase("leaving"), 950);
    const done = setTimeout(() => setPhase("done"), 1300);
    return () => {
      clearTimeout(leave);
      clearTimeout(done);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      className={`acrylic-page fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
        phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      // Ohne Perspektive wirkt rotateY wie ein Zusammenklappen statt wie eine
      // Drehung im Raum — das ist der Unterschied zwischen billig und teuer.
      style={{ perspective: "900px" }}
    >
      <img
        src={logo}
        alt=""
        width={112}
        height={112}
        className="splash-mark size-28 rounded-3xl shadow-sm"
      />
      <div className="splash-word flex flex-col items-center gap-1.5">
        <span className="text-3xl font-extrabold tracking-tight text-foreground">
          kialia · κιάλια
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-foreground/50">
          See more. travel further.
        </span>
      </div>
    </div>
  );
}
