import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { personColor, travellerNames, useTrip, PERSON_COLORS, type Trip } from "@/lib/trip-store";
import { countryCodeFor } from "@/lib/country";
import { takeInvite } from "@/lib/pending-invite";
import { money } from "@/lib/currency";
import { mapsQuery, mapsUrl } from "@/lib/maps";
import {
  joinTrip,
  startAutoSync,
  syncTrips,
  syncTripsThrottled,
  watchRemote,
} from "@/lib/trip-sync";
import { Home, Lightbulb, Wallet, BookOpen, Backpack, MapPin, Settings } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import logo from "@/assets/kialia-logo.png";
import { useProfile, useSession, useMyName } from "@/lib/auth";
import { onboardingGate, readOnboardedCache } from "@/lib/onboarding-gate";
import { FlagMark } from "@/components/app/bits";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/ideen", label: "Ideen", icon: Lightbulb },
  { to: "/plan", label: "Plan", icon: Wallet },
  { to: "/packliste", label: "Packen", icon: Backpack },
  { to: "/tagebuch", label: "Tagebuch", icon: BookOpen },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, ready } = useSession();
  const { profile, failed, ready: profileReady } = useProfile(session?.user.id);
  const { trip } = useTrip();

  // Abgleich läuft für alle Bildschirme an einer Stelle: einmal holen, danach
  // bei eigenen Änderungen hochladen und auf fremde horchen.
  const [syncError, setSyncError] = useState<string | null>(null);
  const [joined, setJoined] = useState<string | null>(null);

  // Einen ueber den Link mitgebrachten Code einloesen, sobald eine Anmeldung
  // besteht. Genau hier — nicht auf der Anmeldeseite — weil zwischen Klick und
  // fertigem Konto eine Bestaetigungsmail liegen kann.
  useEffect(() => {
    if (!session) return;
    const code = takeInvite();
    if (!code) return;
    void (async () => {
      const r = await joinTrip(code);
      if (r.ok) {
        setJoined(code);
        await syncTrips();
      } else {
        // Der Code wird bewusst nicht zurueckgelegt: ein ungueltiger Code
        // wuerde sonst bei jedem Start erneut scheitern.
        setSyncError(r.error ?? "Beitreten hat nicht geklappt.");
      }
    })();
  }, [session]);

  useEffect(() => {
    if (!session) return;
    // Das Ergebnis wurde frueher verworfen. Schlug der Abgleich fehl, sah das
    // exakt aus wie "es gibt keine Reise" — kein Hinweis, kein Unterschied.
    // Wer nicht weiss, dass etwas schiefging, sucht den Fehler bei sich.
    const report = (r: { ok: boolean; error?: string }) =>
      setSyncError(r.ok ? null : (r.error ?? "unbekannt"));

    void syncTripsThrottled().then(report);

    // Beim Zurueckkommen in die App abgleichen.
    //
    // Bisher lief der Abgleich beim Laden und wenn Realtime etwas meldete.
    // Auf einer Reise liegt das Telefon aber die meiste Zeit in der Tasche:
    // man kommt zurueck, sieht den Stand von vorhin und schreibt darauf los.
    // Genau so entstehen zwei Fassungen, die sich gegenseitig ueberholen.
    const beimZurueckkommen = () => {
      if (document.visibilityState === "visible") void syncTrips().then(report);
    };
    document.addEventListener("visibilitychange", beimZurueckkommen);
    const stopPush = startAutoSync((msg) =>
      setSyncError(msg === null ? null : `Änderungen konnten nicht gespeichert werden: ${msg}`),
    );
    const stopWatch = watchRemote(() => {
      void syncTrips().then(report);
    });
    return () => {
      document.removeEventListener("visibilitychange", beimZurueckkommen);
      stopPush();
      stopWatch();
    };
  }, [session]);
  // Die Flagge zeichnen wir selbst (bits.tsx) — Emoji-Flaggen sind knallige
  // Systemgrafik und der eine Fremdkoerper in der gedaempften Palette.
  const flagCode = countryCodeFor(trip.destination);

  // "Profil nicht abrufbar" ist keine Aussage darueber, ob jemand das
  // Onboarding erledigt hat. Ohne diese Unterscheidung landet offline jeder
  // zurueck im Onboarding — und von dort per fehlgeschlagenem Speichern
  // wieder hierher.
  const gate = onboardingGate({
    profileDone: profile ? !!profile.onboarding_done : null,
    loadFailed: failed,
    cachedDone: readOnboardedCache(session?.user.id),
  });

  useEffect(() => {
    if (ready && !session && pathname !== "/auth") navigate({ to: "/auth", replace: true });
  }, [ready, session, pathname, navigate]);

  useEffect(() => {
    if (session && profileReady && gate === "onboarding" && pathname !== "/onboarding") {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [session, profileReady, gate, pathname, navigate]);

  if (!ready || !session || !profileReady) {
    return <div className="acrylic-page min-h-screen" />;
  }

  // Kein Kontakt und kein lokaler Merker: nicht raten, sondern sagen was ist.
  // Eine leere Flaeche waere hier das Schlimmste — sie sieht aus wie ein
  // Absturz und nennt keinen naechsten Schritt.
  if (gate === "offline-unknown") {
    return (
      <div className="acrylic-page flex min-h-screen items-center justify-center px-6">
        <div className="relative z-10 max-w-sm rounded-3xl bg-card p-5 text-center">
          <h1 className="text-lg font-bold">Keine Verbindung</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Wir konnten dein Konto nicht laden. Sobald du wieder online bist, geht es weiter — deine
            Reisen auf diesem Gerät bleiben unberührt.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-warm mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  if (gate !== "app") {
    return <div className="acrylic-page min-h-screen" />;
  }

  return (
    <div className="acrylic-page min-h-screen">
      {/* Der obere Sicherheitsabstand fehlte.
          `viewport-fit=cover` im Meta-Tag laesst den Inhalt bewusst unter die
          Statusleiste laufen — damit der Verlauf bis zum Rand geht. Dann muss
          man den Abstand aber selbst zurueckgeben, sonst liegen Uhrzeit, WLAN
          und Akku ueber der ersten Zeile. Unten am Tab-Balken war das schon
          beruecksichtigt, oben nicht; im Browser faellt es nicht auf, weil
          dort die Adressleiste den Platz einnimmt — nur in der installierten
          App. */}
      <header
        className="relative z-30 px-5 pb-6 pt-6 print:hidden"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          {/* Die Landesflagge ist auf jedem Bildschirm der Anker: sie sagt in
              einem Zeichen, um welche Reise es hier geht. Ohne erkanntes Land
              bleibt das Logo stehen — eine falsche Flagge waere schlimmer als
              keine. Der `key` sorgt dafuer, dass der Auftritt beim Wechsel der
              Reise erneut laeuft. */}
          {/* Das Logo bleibt der Anker der Marke — die Flagge sitzt als
              Abzeichen darauf. Vorher ersetzte die Flagge das Logo, damit war
              die Marke auf jedem Bildschirm mit erkanntem Land verschwunden. */}
          <div className="relative shrink-0">
            <img
              src={logo}
              alt="kialia"
              width={64}
              height={64}
              className="size-11 rounded-2xl shadow-sm"
            />
          </div>
          <div className="min-w-0 flex-1">
            {/* Der Bildschirmname ist die Nebensache, die Reise die Identitaet.
                Vorher stand im Plan-Tab "Plan" und auf Home "Kreta" — zwei
                verschiedene Dinge an derselben Stelle. */}
            <p className="kicker truncate text-foreground/60">{title || "kialia · κιάλια"}</p>
            {/* Die Flagge steht NEBEN dem Namen, nicht auf der Marke.
                Auf dem Logo lag sie halb darueber und verdeckte ein Glas —
                und inhaltlich gehoert sie ohnehin zur Reise, nicht zur Marke.
                `shrink-0` und `min-w-0` am Namen sorgen dafuer, dass bei langen
                Zielen der Name gekuerzt wird und nicht die Flagge wegfaellt. */}
            <div className="flex items-baseline gap-2">
              {flagCode && (
                <span key={flagCode} aria-hidden className="hero-flag shrink-0 text-[1.15rem]">
                  <FlagMark code={flagCode} />
                </span>
              )}
              <h1 className="display min-w-0 truncate text-[1.55rem]">
                {trip.destination || "kialia"}
              </h1>
            </div>
          </div>
          {/* Zahnrad statt Abmelden: ein versehentlicher Klick soll nicht
              mitten in der Planung die Sitzung beenden. Abmelden liegt jetzt
              in den Einstellungen, zusammen mit der Kontoverwaltung. */}
          <Link
            to="/einstellungen"
            aria-label="Einstellungen"
            className="shrink-0 rounded-full p-2.5 text-foreground/70 transition hover:bg-foreground/8"
          >
            <Settings className="size-5" />
          </Link>
        </div>
        {subtitle && (
          <p className="mx-auto mt-2 max-w-lg font-serif text-[15px] italic leading-snug text-foreground/70">
            {subtitle}
          </p>
        )}
      </header>

      <main className="relative z-10 mx-auto max-w-lg px-4 pb-28 pt-1 print:pb-0 print:pt-0">
        {joined && (
          <div
            role="status"
            className="mx-auto mb-3 max-w-md rounded-[var(--radius)] border border-border bg-secondary px-4 py-2.5 text-xs"
          >
            <p className="font-semibold">Reise übernommen</p>
            <p className="mt-0.5 text-muted-foreground">
              Ihr plant jetzt gemeinsam — Plan, Budget, Packliste und Tagebuch.
            </p>
          </div>
        )}
        {syncError && (
          <div
            role="status"
            className="mx-auto mb-3 max-w-md rounded-[var(--radius)] border border-destructive/25 bg-[var(--no-soft)] px-4 py-2.5 text-xs text-destructive"
          >
            <p className="font-semibold">Abgleich fehlgeschlagen</p>
            <p className="mt-0.5">
              Was du hier siehst, kann veraltet sein — und eine geteilte Reise kann fehlen. Deine
              Eingaben bleiben auf dem Gerät.
            </p>
          </div>
        )}
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card print:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-1 pb-[env(safe-area-inset-bottom)]">
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="group flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition"
            >
              <Icon className="size-5" strokeWidth={1.6} />
              {label}
              {/* Der aktive Tab traegt einen Punkt in der Markenfarbe statt
                  einer gefuellten Flaeche. Fuenf gefaerbte Flaechen
                  nebeneinander ergeben eine Ampel; ein Punkt ordnet ein. */}
              <span className="h-1 w-1 rounded-full bg-[var(--sage)] opacity-0 transition-opacity group-[.text-primary]:opacity-100" />
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function Card({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`rounded-[var(--radius)] border border-border bg-card p-4 shadow-[var(--sh-1)] ${className}`}
    >
      {children}
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="block truncate text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1 min-w-0">{children}</div>
    </label>
  );
}

/** Zwei Felder nebeneinander – auf sehr schmalen Displays untereinander. */
export function FieldRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[340px]:grid-cols-2 [&>*]:min-w-0">{children}</div>
  );
}

/**
 * Ein Geldbetrag.
 *
 * Tabellarische Ziffern sind hier nicht Kosmetik: Beträge stehen in dieser App
 * untereinander und ändern sich beim Tippen. Mit proportionalen Ziffern
 * springt die Spalte bei jeder Eingabe, weil eine 1 schmaler ist als eine 8.
 *
 * Bewusst als Komponente statt als Klasse an jeder Fundstelle — so ist auch
 * jeder künftige Betrag richtig gesetzt, ohne dass jemand daran denken muss.
 */
export function Money({
  value,
  currency,
  className = "",
}: {
  value: number;
  /** Ohne Angabe die Hauptwaehrung der aktiven Reise. */
  currency?: string | undefined;
  className?: string;
}) {
  const { trip } = useTrip();
  return (
    <span className={`amount ${className}`.trim()}>
      {money(value, currency || trip.currency || "EUR")}
    </span>
  );
}

/**
 * Betrag mit Waehrungswahl.
 *
 * Die Waehrung steht direkt am Betrag, nicht in einer Einstellung weit weg:
 * beim Eintragen eines Hotels weiss man, in welcher Waehrung die Rechnung
 * kam — zehn Minuten spaeter nicht mehr.
 */
export function AmountField({
  value,
  currency,
  onChange,
  onCurrencyChange,
}: {
  value: number;
  currency?: string | undefined;
  onChange: (n: number) => void;
  onCurrencyChange: (c: string) => void;
}) {
  const { trip } = useTrip();
  const main = trip.currency || "EUR";
  const options = [
    main,
    ...(trip.secondCurrency && trip.secondCurrency !== main ? [trip.secondCurrency] : []),
  ];
  const active = currency || main;

  return (
    // min-w-0 auf Behaelter UND Betragsfeld: ohne das gibt das Zahlenfeld seine
    // Mindestbreite nicht her, die Zeile wird breiter als die Spalte und der
    // Betrag schrumpft auf einen Streifen — auf dem iPhone war davon nichts
    // mehr lesbar. Die Waehrung ist der schmale, feste Teil.
    <div className="flex min-w-0 items-center gap-2">
      <NumberField value={value} onChange={onChange} className={`${inputClass} min-w-0 flex-1`} />
      {options.length > 1 ? (
        <select
          value={active}
          aria-label="Währung"
          onChange={(e) => onCurrencyChange(e.target.value)}
          className={`${inputClass} w-[4.25rem] shrink-0 appearance-none px-1 text-center text-xs font-semibold`}
        >
          {options.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      ) : (
        <span className="w-[4.25rem] shrink-0 text-center text-xs font-semibold text-muted-foreground">
          {main}
        </span>
      )}
    </div>
  );
}

/**
 * Zustand fuer alle Tabs ausser Home, solange keine Reise existiert.
 *
 * Vorher zeigten Plan, Ideen, Packliste und Tagebuch ein vollstaendiges
 * Formular fuer eine Reise, die es nicht gab — man konnte ein Budget fuer
 * nichts pflegen. Jeder Tab gehoert zu genau einer Reise; ohne die gibt es
 * hier nichts zu tun.
 */
export function NoTripYet({ what }: { what: string }) {
  return (
    <AppShell title="Noch keine Reise" subtitle="">
      <div className="flex min-h-[50vh] flex-col justify-center">
        <h2 className="text-xl font-extrabold leading-tight tracking-tight">Zuerst die Reise</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {what} gehört immer zu einer bestimmten Reise. Lege sie auf der Startseite an — danach ist
          dieser Bereich für sie da.
        </p>
        <Link
          to="/"
          className="btn-warm mt-5 w-full rounded-2xl px-4 py-3.5 text-center text-sm font-semibold"
        >
          Reise anlegen
        </Link>
      </div>
    </AppShell>
  );
}

/**
 * Zahlenfeld.
 *
 * Bewusst `type="text"` mit `inputMode="decimal"` statt `type="number"`:
 * React aktualisiert bei Zahlenfeldern das DOM nicht, wenn der neue Wert
 * NUMERISCH gleich dem angezeigten ist. "01" und 1 sind numerisch gleich —
 * die fuehrende Null blieb also stehen und der naechste Anschlag machte
 * daraus "010". Der Wert stimmte, die Anzeige nicht, und das fuehlt sich an
 * wie ein kaputtes Feld.
 *
 * `inputMode="decimal"` behaelt die Zifferntastatur auf dem Telefon.
 * Waehrend des Tippens gilt der Entwurf, damit man das Feld auch leeren kann,
 * ohne dass sofort eine 0 zurueckspringt.
 */
export function NumberField({
  value,
  onChange,
  className = inputClass,
  placeholder = "0",
  ariaLabel,
}: {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === 0 ? "" : String(value));

  return (
    <input
      type="text"
      inputMode="decimal"
      value={shown}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={className}
      onChange={(e) => {
        const raw = e.target.value
          .replace(/[^\d.,]/g, "")
          .replace(",", ".")
          .replace(/^0+(?=\d)/, "");
        setDraft(raw);
        const n = Number(raw);
        onChange(raw === "" || !Number.isFinite(n) ? 0 : n);
      }}
      onBlur={() => setDraft(null)}
    />
  );
}

/**
 * Ortsangabe mit Sprung in die Karten-App.
 *
 * Bewusst keine eingebettete Karte: die kostet pro Aufruf, braucht einen
 * Schluessel und funktioniert ohne Netz nicht — fuer eine Reise-App der wunde
 * Punkt. Der Sprung in die installierte Karten-App ist kostenlos und bringt
 * Navigation und Offline-Karten mit, die dort ohnehin liegen.
 */
export function PlaceField({
  name,
  address,
  destination,
  onChange,
}: {
  name: string;
  address: string;
  destination: string;
  onChange: (v: string) => void;
}) {
  const query = mapsQuery(name, address, destination);
  const href = mapsUrl(query, typeof navigator === "undefined" ? "" : navigator.userAgent);

  return (
    <Field label="Adresse oder Ort">
      <div className="flex items-center gap-2">
        <input
          value={address}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Straße, Ort — oder einfach der Name"
          className={inputClass}
        />
        <a
          href={href || undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!href}
          aria-label={query ? `${query} in Karten öffnen` : "Erst einen Ort eintragen"}
          className={`grid size-11 shrink-0 place-items-center rounded-xl transition ${
            href
              ? "bg-secondary text-foreground hover:bg-secondary/70"
              : "pointer-events-none bg-secondary/40 text-muted-foreground"
          }`}
        >
          <MapPin className="size-4" />
        </a>
      </div>
    </Field>
  );
}

/**
 * Farben der Mitreisenden.
 *
 * Jede Person bekommt sofort eine Farbe aus der Position in der Gruppe —
 * niemand muss etwas einstellen, damit es funktioniert. Wer will, tippt einen
 * Namen an und waehlt eine andere.
 *
 * Der Sinn liegt nicht in der Kosmetik: in Packliste und Tagebuch steht sonst
 * nur ein Name in grauer Schrift, und man muss ihn lesen. Eine Farbe erkennt
 * man im Vorbeiscrollen.
 */
export function PersonColors({
  trip,
  onChange,
}: {
  trip: Trip;
  onChange: (colors: Record<string, string>) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const myName = useMyName();
  const people = travellerNames(trip, myName);

  if (people.length <= 1) return null;

  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground">Farben der Mitreisenden</span>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {people.map((name) => (
          <button
            key={name}
            type="button"
            aria-expanded={editing === name}
            onClick={() => setEditing(editing === name ? null : name)}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-foreground"
            style={{ background: personColor(trip, name) }}
          >
            {name}
          </button>
        ))}
      </div>

      {editing && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-secondary/50 p-2">
          <span className="text-xs text-muted-foreground">Farbe für {editing}:</span>
          {PERSON_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-label={c.label}
              onClick={() => {
                onChange({ ...(trip.personColors ?? {}), [editing]: c.key });
                setEditing(null);
              }}
              className="size-6 rounded-full ring-1 ring-foreground/15"
              style={{ background: c.hex }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* Felder liegen eingesenkt im Papier: Creme-Grund statt Seitenfarbe, damit
   sichtbar ist, wo man schreiben kann, ohne dass ein Rahmen laut werden muss.
   16 px erzwingt die Regel weiter unten fuer Touch-Geraete — darunter zoomt
   iOS beim Fokus hinein und bleibt so. */
export const inputClass =
  "block w-full min-w-0 max-w-full rounded-[14px] border border-border bg-secondary px-3.5 py-2.5 text-sm text-foreground transition placeholder:text-muted-foreground/70 focus:border-[var(--ring)] focus:bg-card focus:outline-none";

/** Datums-Felder: gleiches Aussehen, aber kompakter, damit nichts abgeschnitten wird. */
export const dateInputClass = `${inputClass} box-border appearance-none px-2.5 text-[13px] [&::-webkit-date-and-time-value]:text-left [&::-webkit-calendar-picker-indicator]:ml-0`;

export const selectClass = `${inputClass} appearance-none bg-secondary pr-8`;

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="kicker mb-2.5 mt-7 px-1">{children}</h2>;
}

/** Einheitliche Überschrift innerhalb einer Karte – überall gleich.
 *
 * In der Serif, nicht in fetter Grotesk. Vorher war ein Kartentitel von
 * hervorgehobenem Fließtext nicht zu unterscheiden — beide waren dieselbe
 * Schrift, nur eine Stufe fetter. Die Serif macht daraus eine eigene Ebene,
 * ohne dass Größe oder Farbe lauter werden müssen. */
export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="display text-[1.12rem]">{children}</h2>;
}

/** Einheitlicher Kennzahl-Block (z. B. Reisedauer, Gesamtkosten). */
export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="text-center">
      <CardTitle>{label}</CardTitle>
      <p className="mt-1 text-3xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  className = "",
  type = "button",
  disabled,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`btn-warm flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="btn-warm grid size-11 shrink-0 place-items-center rounded-xl transition active:scale-95"
    >
      {children}
    </button>
  );
}

export function DeleteButton({
  onClick,
  ariaLabel = "Eintrag löschen",
}: {
  onClick: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
    >
      <span className="sr-only">{ariaLabel}</span>
      {/* Icon wird von der aufrufenden Seite gestellt */}
      <TrashIcon />
    </button>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-foreground/25 bg-card/70 py-3 text-sm font-semibold text-foreground backdrop-blur-sm transition hover:bg-card"
    >
      <span className="text-base leading-none">+</span> {label}
    </button>
  );
}

export function chipClass(active: boolean) {
  return `inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition ${
    active
      ? "border-primary bg-primary/10 text-primary"
      : "border-border bg-background text-muted-foreground"
  }`;
}
