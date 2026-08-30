import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Download, Upload, Plus, Trash2, Users, MapPin, ShieldAlert } from "lucide-react";
import {
  AppShell,
  Card,
  CardTitle,
  Stat,
  Field,
  FieldRow,
  PrimaryButton,
  dateInputClass,
  inputClass,
  Money,
  NumberField,
  PersonColors,
} from "@/components/app/AppShell";
import { AiFeatures } from "@/components/app/ai-features";
import { inviteUrl } from "@/lib/pending-invite";
import { leaveTrip, syncTrips } from "@/lib/trip-sync";
import { needsTypedConfirm } from "@/lib/trip-weight";
import { useMyName } from "@/lib/auth";
import { loadHomeCurrency } from "@/lib/home-currency";
import { flagFor } from "@/lib/country";
import { countMembers, joinTrip } from "@/lib/trip-sync";
import { COMMON_CURRENCIES, fetchRate } from "@/lib/currency";
import {
  downloadAllTrips,
  downloadTrip,
  readTripFile,
  tripDays,
  tripTotals,
  useTrip,
  formatDateLong,
  type Trip,
  otherTravellers,
  rosterFromOthers,
  missingSelf,
} from "@/lib/trip-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "kialia – Reisen planen, Budget & Reisetagebuch" },
      {
        name: "description",
        content:
          "kialia: mehrere Reisen planen, Ideen mit Links sammeln, Budget kalkulieren, Packliste teilen und ein Reisetagebuch mit Sprachmemo führen.",
      },
      { property: "og:title", content: "kialia – Reisen planen & festhalten" },
      {
        property: "og:description",
        content: "Mehrere Reiseziele planen, Kosten im Blick behalten und jeden Tag festhalten.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeTab,
});

/** Woran man zwei gleichnamige Reisen auseinanderhaelt: am Inhalt. */
function tripSummary(t: Trip): string {
  const teile: string[] = [];
  const n = (t.transports?.length ?? 0) + (t.stays?.length ?? 0);
  if (n) teile.push(`${n} Station${n === 1 ? "" : "en"}`);
  const a = t.activities?.length ?? 0;
  if (a) teile.push(`${a} Programmpunkt${a === 1 ? "" : "e"}`);
  const i = t.ideas?.length ?? 0;
  if (i) teile.push(`${i} Idee${i === 1 ? "" : "n"}`);
  const d = (t.diary ?? []).filter((e) => e.text?.trim()).length;
  if (d) teile.push(`${d} Tagebuchtag${d === 1 ? "" : "e"}`);
  return teile.length ? `· ${teile.join(" · ")}` : "· noch leer";
}

function HomeTab() {
  const myName = useMyName();
  const {
    trip,
    trips,
    hasTrip,
    activeId,
    update,
    addTrip,
    removeTrip,
    selectTrip,
    importTrip,
    ready,
  } = useTrip();
  const fileInput = useRef<HTMLInputElement>(null);
  const [ioMsg, setIoMsg] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [typedName, setTypedName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [sharePrep, setSharePrep] = useState<string>("idle");
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinMsg, setJoinMsg] = useState<string | null>(null);
  const [members, setMembers] = useState<number | null>(null);
  const [draftColors, setDraftColors] = useState<Record<string, string>>({});
  const [rateMsg, setRateMsg] = useState<string | null>(null);

  // Bestaetigt sichtbar, dass das Teilen wirkt — sonst weiss niemand, ob der
  // Code angekommen ist.
  useEffect(() => {
    let cancelled = false;
    if (!trip.remoteId) {
      setMembers(null);
      return;
    }
    void countMembers(trip.remoteId).then((n) => !cancelled && setMembers(n));
    return () => {
      cancelled = true;
    };
  }, [trip.remoteId, trip.updatedAt]);
  const [newDest, setNewDest] = useState("");
  const [draft, setDraft] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    companions: "",
    people: 2,
  });

  /**
   * Legt die erste Reise mit allem an, was schon bekannt ist.
   *
   * Bewusst erst beim Absenden: eine Reise entsteht, wenn jemand sie anlegt —
   * nicht schon, weil die App gestartet wurde.
   */
  function createTrip(e: React.FormEvent) {
    e.preventDefault();
    const dest = draft.destination.trim();
    if (!dest) return;
    addTrip(dest);
    update({
      // Die Rechenwaehrung als Zweitwaehrung: dann laesst sich von Anfang an
      // umrechnen, ohne dass jemand daran denken muss.
      secondCurrency: loadHomeCurrency(),
      startDate: draft.startDate,
      endDate: draft.endDate,
      companions: draft.companions.trim(),
      travellers: draft.people || 1,
      personColors: draftColors,
    });
    setDraft({ destination: "", startDate: "", endDate: "", companions: "", people: 2 });
    setDraftColors({});
    // Sofort hochladen, nicht beim naechsten Abgleich.
    //
    // Der laufende Abgleich hat eine Sperrfrist von 20 Sekunden, und das
    // automatische Hochschieben ueberspringt Reisen ohne Server-Kennung —
    // eine frische Reise lag also im Zweifel minutenlang nur lokal. Wer in
    // dieser Zeit die App vom Homescreen entfernt, verliert sie: iOS loescht
    // dabei den Speicher der Web-App.
    void syncTrips();
  }
  // Bestehende Reisen wurden angelegt, bevor die volle Runde gespeichert
  // wurde. Jedes Geraet traegt sich selbst nach; danach ist die Liste auf
  // beiden Seiten vollstaendig. `missingSelf` gibt null zurueck, sobald nichts
  // mehr zu tun ist — sonst liefe bei jedem Abgleich eine Aenderung los.
  useEffect(() => {
    if (!hasTrip || !myName) return;
    const ergaenzt = missingSelf(trip, myName);
    if (ergaenzt !== null) update({ companions: ergaenzt });
  }, [hasTrip, myName, trip, update]);

  const days = tripDays(trip);
  const totals = tripTotals(trip);

  function handleExportTrip() {
    downloadTrip(trip);
    setIoMsg(`„${trip.destination || "Reise"}“ als Datei gespeichert.`);
  }

  function handleBackup() {
    downloadAllTrips(trips);
    setIoMsg(
      `Sicherung mit ${trips.length} ${trips.length === 1 ? "Reise" : "Reisen"} gespeichert.`,
    );
  }

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const incoming = await readTripFile(file);
      incoming.forEach((t) => importTrip(t));
      setIoMsg(`${incoming.length} ${incoming.length === 1 ? "Reise" : "Reisen"} importiert.`);
    } catch (err) {
      setIoMsg(err instanceof Error ? err.message : "Import fehlgeschlagen.");
    }
  }

  if (!ready) return <div className="min-h-screen bg-background" />;

  // Noch keine Reise: eine Einladung und ein vollstaendiges Formular. Vorher
  // stand hier eine namenlose Platzhalter-Reise "ohne Datum" — das Erste, was
  // ein neuer Nutzer sah, sah aus wie ein Fehler.
  if (!hasTrip) {
    return (
      <AppShell title="" subtitle="">
        <div className="pt-2">
          <h2 className="text-[1.75rem] font-extrabold leading-[1.15] tracking-[-0.02em]">
            Let&rsquo;s start a new adventure
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sag uns, wohin es geht. Plan, Budget, Packliste und Tagebuch gehören danach zu genau
            dieser Reise.
          </p>

          <form onSubmit={createTrip} className="mt-6 space-y-4">
            <Card>
              <Field label="Wohin geht die Reise?">
                <input
                  value={draft.destination}
                  onChange={(e) => setDraft({ ...draft, destination: e.target.value })}
                  placeholder="z. B. Griechenland, Vietnam, Norwegen …"
                  autoFocus
                  className={inputClass}
                />
              </Field>

              <div className="mt-3">
                <FieldRow>
                  <Field label="Von">
                    <input
                      type="date"
                      value={draft.startDate}
                      onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                      className={dateInputClass}
                    />
                  </Field>
                  <Field label="Bis">
                    <input
                      type="date"
                      value={draft.endDate}
                      min={draft.startDate || undefined}
                      onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                      className={dateInputClass}
                    />
                  </Field>
                </FieldRow>
              </div>

              <div className="mt-3">
                <FieldRow>
                  <Field label="Mit wem?">
                    <input
                      value={draft.companions}
                      onChange={(e) => setDraft({ ...draft, companions: e.target.value })}
                      placeholder="Partner, Familie …"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Personen">
                    <NumberField
                      value={draft.people}
                      onChange={(n) => setDraft({ ...draft, people: n })}
                      className={inputClass}
                    />
                  </Field>
                </FieldRow>

                <div className="mt-3">
                  <PersonColors trip={trip} onChange={(c) => update({ personColors: c })} />
                </div>
              </div>

              {draft.companions.trim() && (
                <div className="mt-3">
                  <PersonColors
                    trip={{ ...trip, companions: draft.companions, personColors: draftColors }}
                    onChange={setDraftColors}
                  />
                </div>
              )}
            </Card>

            <PrimaryButton type="submit" disabled={!draft.destination.trim()}>
              <Plus className="size-4" /> Reise anlegen
            </PrimaryButton>
            <p className="text-center text-xs text-muted-foreground">
              Nur das Ziel ist nötig. Alles andere kannst du später ergänzen.
            </p>
          </form>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Übersicht" subtitle={tripSubtitle(trip, days)}>
      <div className="space-y-4">
        {/* Der Reisewechsel lebt nur hier. In allen anderen Tabs gilt genau
            diese eine Reise — sonst weiss niemand, worauf sich ein Budget
            oder ein Tagebucheintrag bezieht. */}
        <Card>
          <CardTitle>{trips.length === 1 ? "Reise wechseln" : "Reisen wechseln"}</CardTitle>
          <div className="mt-3 space-y-2">
            {trips.map((t) => {
              const active = t.id === activeId;
              const f = flagFor(t.destination);
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition ${
                    active ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectTrip(t.id)}
                    className="flex flex-1 items-center gap-2.5 text-left"
                  >
                    {f ? (
                      <span className="text-xl leading-none" aria-hidden>
                        {f}
                      </span>
                    ) : (
                      <MapPin
                        className={`size-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
                      />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{t.destination}</span>
                      <span className="block text-xs text-muted-foreground">
                        {t.startDate
                          ? `${formatDateLong(t.startDate)}${t.endDate ? ` – ${formatDateLong(t.endDate)}` : ""}`
                          : "Zeitraum offen"}
                      </span>
                      {/* Zwei Angaben, die es vorher nicht gab und die genau
                          dann fehlen, wenn man sie braucht:

                          1. Liegt die Reise auf dem Server? Wer die App vom
                             Homescreen loescht und neu hinzufuegt, verliert den
                             lokalen Speicher. Was nicht oben liegt, ist dann
                             weg — und das sieht man vorher nirgends.
                          2. Wie viel steckt drin? Drei Reisen namens "Kreta"
                             sind sonst nicht auseinanderzuhalten. */}
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                        <span
                          className={
                            t.remoteId && !t.orphan ? "text-muted-foreground" : "text-destructive"
                          }
                        >
                          {t.remoteId && !t.orphan
                            ? "Auf dem Server gesichert"
                            : "Nur auf diesem Gerät"}
                        </span>
                        <span className="text-muted-foreground">{tripSummary(t)}</span>
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Reise ${t.destination || "ohne Namen"} entfernen`}
                    onClick={() => {
                      setPendingDelete(t.id);
                      setTypedName("");
                      setDeleteError(null);
                    }}
                    className="text-muted-foreground transition hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <details className="mt-3">
            <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 rounded-2xl border border-dashed border-foreground/25 bg-card/70 py-3 text-sm font-semibold text-foreground transition hover:bg-card">
              <Plus className="size-4" /> Weitere Reise
            </summary>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const v = newDest.trim();
                if (!v) return;
                addTrip(v);
                setNewDest("");
              }}
              className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2"
            >
              <input
                value={newDest}
                onChange={(e) => setNewDest(e.target.value)}
                placeholder="Nächstes Reiseziel …"
                className={inputClass}
              />
              <button
                type="submit"
                className="acrylic-warm grid size-11 shrink-0 place-items-center rounded-xl text-background"
                aria-label="Reise hinzufügen"
              >
                <Plus className="size-4" />
              </button>
            </form>
          </details>

          {/* Beitreten gehoert hierher, nicht neben den eigenen Code: wer eine
              Reise anlegt, soll seinen eigenen Code nicht eingeben muessen. */}
          <details className="mt-2">
            <summary className="cursor-pointer list-none text-center text-xs font-semibold text-muted-foreground">
              Einer geteilten Reise beitreten
            </summary>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setJoinMsg(null);
                const res = await joinTrip(joinCode);
                setJoinMsg(res.ok ? "Reise übernommen." : (res.error ?? "Hat nicht geklappt."));
                if (res.ok) setJoinCode("");
              }}
              className="mt-2"
            >
              <Field label="Einer Reise beitreten">
                <div className="flex items-center gap-2">
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Code eingeben"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    className={`${inputClass} tracking-[0.14em]`}
                  />
                  <button
                    type="submit"
                    disabled={joinCode.trim().length < 4}
                    className="acrylic-warm shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-50"
                  >
                    Beitreten
                  </button>
                </div>
              </Field>
              {joinMsg && <p className="mt-2 text-xs font-medium">{joinMsg}</p>}
            </form>
          </details>
        </Card>

        {trip.orphan && (
          <div
            role="status"
            className="rounded-2xl bg-destructive/10 px-4 py-3 text-xs text-destructive"
          >
            <p className="font-semibold">Diese Reise ist nicht mehr geteilt</p>
            <p className="mt-0.5">
              Der Server kennt sie nicht mehr — vielleicht wurde sie gelöscht oder deine
              Mitgliedschaft ist weg. Sie bleibt auf diesem Gerät vollständig lesbar, wird aber
              nicht mehr abgeglichen. Über den Einladungscode könnt ihr sie neu verbinden.
            </p>
          </div>
        )}

        <AiFeatures />

        <Card>
          <CardTitle>Währungen</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Beträge werden nie umgerechnet gespeichert — was du in Euro einträgst, bleibt Euro.
            Umgerechnet wird nur die Anzeige.
          </p>

          <div className="mt-3">
            <FieldRow>
              <Field label="Hauptwährung">
                <select
                  value={trip.currency || "EUR"}
                  onChange={(e) => update({ currency: e.target.value })}
                  className={`${inputClass} appearance-none`}
                >
                  {COMMON_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Zweitwährung">
                <select
                  value={trip.secondCurrency || ""}
                  onChange={(e) => update({ secondCurrency: e.target.value })}
                  className={`${inputClass} appearance-none`}
                >
                  <option value="">keine</option>
                  {COMMON_CURRENCIES.filter((c) => c.code !== (trip.currency || "EUR")).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </Field>
            </FieldRow>
          </div>

          {trip.secondCurrency && (
            <div className="mt-3 rounded-2xl bg-secondary/50 p-3">
              <Field label={`1 ${trip.secondCurrency} entspricht … ${trip.currency || "EUR"}`}>
                <input
                  inputMode="decimal"
                  value={trip.rate?.value ?? ""}
                  placeholder="z. B. 0,95"
                  onChange={(e) => {
                    const v = Number(e.target.value.replace(",", "."));
                    update({
                      rate:
                        Number.isFinite(v) && v > 0
                          ? {
                              value: v,
                              at: new Date().toISOString().slice(0, 10),
                              source: "manual",
                            }
                          : undefined,
                    });
                  }}
                  className={inputClass}
                />
              </Field>

              <button
                type="button"
                onClick={async () => {
                  setRateMsg("Wird geholt …");
                  const r = await fetchRate(trip.secondCurrency!, trip.currency || "EUR");
                  if (r) {
                    update({ rate: r });
                    setRateMsg(null);
                  } else {
                    setRateMsg("Kurs nicht erreichbar — trag ihn von Hand ein.");
                  }
                }}
                className="mt-2 w-full rounded-xl bg-card px-3 py-2.5 text-xs font-semibold"
              >
                Tageskurs holen
              </button>

              {trip.rate && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Kurs vom {formatDateLong(trip.rate.at) || trip.rate.at}
                  {trip.rate.source === "manual" ? " · von dir eingetragen" : " · EZB-Referenzkurs"}
                  . Eine Umrechnung ist immer eine Schätzung.
                </p>
              )}
              {rateMsg && <p className="mt-2 text-xs font-medium">{rateMsg}</p>}
            </div>
          )}
        </Card>

        {/* Teilen nach dem Muster eines Haushalts: ein Code, den man
            vorliest. Kein Konto-Suchen, keine E-Mail-Einladung — beides
            scheitert unterwegs an fehlendem Netz oder Tippfehlern. */}
        {/* Loeschen mit Reibung, die zum Inhalt passt. Bei einem leeren
            Geruest waere eine Sicherheitsfrage nur Erziehung zum Wegklicken;
            bei einer durchgeplanten Reise ist ein Fehlgriff nicht zu
            reparieren. */}
        {pendingDelete && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 px-4 pb-6 pt-16 backdrop-blur-sm sm:items-center"
            onClick={() => setPendingDelete(null)}
          >
            <div
              className="w-full max-w-md rounded-3xl bg-card p-5"
              onClick={(ev) => ev.stopPropagation()}
            >
              {(() => {
                const t = trips.find((x) => x.id === pendingDelete);
                if (!t) return null;
                const schwer = needsTypedConfirm(t);
                const name = t.destination.trim();
                const passt = !schwer || typedName.trim().toLowerCase() === name.toLowerCase();
                return (
                  <>
                    <p className="text-lg font-bold tracking-tight">
                      „{name || "Reise ohne Namen"}" entfernen?
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Sie verschwindet von deinen Geräten.{" "}
                      {t.remoteId
                        ? "Wer sonst noch mitplant, behält sie unverändert — erst wenn niemand mehr dabei ist, wird sie endgültig gelöscht."
                        : "Diese Reise war nie auf dem Server, sie ist danach weg."}
                    </p>

                    {schwer && (
                      <div className="mt-4">
                        <p className="text-sm">
                          Hier steckt Arbeit drin. Tippe zur Bestätigung{" "}
                          <span className="font-semibold text-foreground">{name}</span>:
                        </p>
                        <input
                          value={typedName}
                          onChange={(ev) => setTypedName(ev.target.value)}
                          autoComplete="off"
                          placeholder={name}
                          className={`${inputClass} mt-2`}
                        />
                      </div>
                    )}

                    {deleteError && (
                      <p role="status" className="mt-3 text-xs text-destructive">
                        {deleteError}
                      </p>
                    )}

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingDelete(null)}
                        className="flex-1 rounded-2xl bg-secondary py-3 text-sm font-semibold"
                      >
                        Behalten
                      </button>
                      <button
                        type="button"
                        disabled={!passt || deleting}
                        onClick={async () => {
                          setDeleting(true);
                          setDeleteError(null);
                          const r = await leaveTrip(t);
                          setDeleting(false);
                          if (!r.ok) {
                            // Lokal NICHT entfernen, wenn der Server nicht
                            // mitgezogen hat — sonst holt der naechste Abgleich
                            // sie zurueck und es sieht aus, als sei das Loeschen
                            // wirkungslos.
                            setDeleteError(
                              `Der Server hat nicht mitgezogen: ${r.error ?? "unbekannt"}. Ohne Netz geht es nicht.`,
                            );
                            return;
                          }
                          removeTrip(t.id);
                          setPendingDelete(null);
                        }}
                        className="flex-1 rounded-2xl bg-destructive py-3 text-sm font-semibold text-background disabled:opacity-50"
                      >
                        {deleting ? "Wird entfernt …" : "Entfernen"}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        <Card>
          <CardTitle>Gemeinsam planen</CardTitle>

          {trip.inviteCode ? (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                Gib diesen Code weiter — wer ihn eingibt, sieht und bearbeitet dieselbe Reise. Das
                gilt für <span className="font-medium text-foreground">alles</span>: Plan, Budget,
                Packliste und auch die Tagebucheinträge.
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-2xl bg-secondary/60 px-3 py-3">
                <span className="min-w-0 flex-1 truncate text-xl font-bold tracking-[0.18em] tabular-nums">
                  {trip.inviteCode}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(trip.inviteCode ?? "");
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="shrink-0 rounded-xl bg-card px-3 py-2 text-xs font-semibold"
                >
                  {copied ? "Kopiert" : "Kopieren"}
                </button>
              </div>

              {/* Verschicken statt vorlesen: das Teilen-Menue des Geraets
                  erreicht WhatsApp, Nachrichten und Mail, ohne dass wir
                  irgendetwas davon einbauen muessen. */}
              <button
                type="button"
                onClick={async () => {
                  // Der Link traegt den Code. Vorher stand die Adresse und
                  // der Code getrennt darin — der Empfaenger musste ihn
                  // abtippen, und wer die App noch nicht hat, wusste nicht
                  // wohin damit. Jetzt genuegt Antippen: wer schon angemeldet
                  // ist, landet direkt in der Reise; wer nicht, legt ein Konto
                  // an und die Reise ist danach da.
                  const link = inviteUrl(trip.inviteCode ?? "", window.location.origin);
                  const text = `Plane mit mir die Reise nach ${trip.destination} in kialia:\n${link}\n\nFalls du den Code von Hand brauchst: ${trip.inviteCode}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: "kialia", text });
                    } catch {
                      /* abgebrochen — kein Fehler */
                    }
                  } else {
                    await navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="acrylic-warm mt-3 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-background"
              >
                Einladung senden
              </button>
              {members !== null && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {members === 1 ? "Bisher planst nur du mit." : `${members} Personen planen mit.`}
                </p>
              )}
            </>
          ) : (
            <>
              {/* Vorher stand hier nur, dass man warten soll — ohne zu sagen,
                  worauf, und ohne etwas tun zu koennen. Wer teilen will, will
                  jetzt teilen. */}
              <p className="mt-1 text-xs text-muted-foreground">
                Diese Reise liegt noch nur auf diesem Gerät. Zum Teilen muss sie einmal auf den
                Server — danach steht hier ein Link.
              </p>
              <PrimaryButton
                onClick={async () => {
                  setSharePrep("busy");
                  const r = await syncTrips();
                  if (!r.ok) {
                    setSharePrep(r.error ?? "Abgleich fehlgeschlagen");
                    return;
                  }
                  // Nach Erfolg erscheint der Code direkt darueber. Ohne diesen
                  // Hinweis sah es aus, als sei nichts passiert: der Knopf ging
                  // in den Ruhezustand zurueck und die Karte blieb sonst
                  // gleich, bis man neu lud.
                  setSharePrep("fertig");
                }}
                disabled={sharePrep === "busy"}
                className="mt-3"
              >
                {sharePrep === "busy" ? "Wird abgeglichen …" : "Jetzt zum Teilen freigeben"}
              </PrimaryButton>
              {sharePrep === "fertig" && (
                <p role="status" className="mt-2 text-xs font-medium">
                  Freigegeben — der Link steht jetzt hier.
                </p>
              )}
              {sharePrep !== "idle" && sharePrep !== "busy" && sharePrep !== "fertig" && (
                <p role="status" className="mt-2 text-xs text-destructive">
                  Das hat nicht geklappt: {sharePrep}. Ohne Netz geht es nicht — die Reise selbst
                  bleibt aber vollständig auf dem Gerät.
                </p>
              )}
            </>
          )}
        </Card>

        <Card>
          <CardTitle>Eure Reise</CardTitle>
          <div className="mt-3 space-y-3">
            <Field label="Wohin geht die Reise?">
              <input
                value={trip.destination}
                onChange={(e) => update({ destination: e.target.value })}
                placeholder="z. B. Portugal, Vietnam, Norwegen …"
                className={inputClass}
              />
            </Field>
            <FieldRow>
              <Field label="Von">
                <input
                  type="date"
                  value={trip.startDate}
                  onChange={(e) => update({ startDate: e.target.value })}
                  className={dateInputClass}
                />
              </Field>
              <Field label="Bis">
                <input
                  type="date"
                  value={trip.endDate}
                  onChange={(e) => update({ endDate: e.target.value })}
                  className={dateInputClass}
                />
              </Field>
            </FieldRow>
            <FieldRow>
              {/* Getippt werden die ANDEREN, gespeichert wird die ganze Runde.
                  Vorher stand hier woertlich, was der Anlegende getippt hatte —
                  auf Annalinas Geraet also ihr eigener Name, und Steffen kam
                  gar nicht vor. Wer hinsieht, sieht jetzt immer die anderen. */}
              <Field label={myName ? `Mit wem? (ausser ${myName})` : "Mit wem?"}>
                <input
                  value={otherTravellers(trip, myName).join(", ")}
                  onChange={(e) => update({ companions: rosterFromOthers(e.target.value, myName) })}
                  placeholder="Partner, Familie …"
                  className={inputClass}
                />
              </Field>
              <Field label="Personen">
                <NumberField
                  value={trip.travellers}
                  onChange={(n) => update({ travellers: n })}
                  className={inputClass}
                />
              </Field>
            </FieldRow>
          </div>
        </Card>

        <Card>
          <Stat
            label="Reisedauer"
            value={days > 0 ? `${days} Tage` : "–"}
            hint={
              <>
                <Users className="mr-1 inline size-4" />
                {trip.travellers} Personen · bisher geplant <Money value={totals.total} />
              </>
            }
          />
        </Card>

        <Card>
          <CardTitle>Sichern & weitergeben</CardTitle>
          <p className="mt-1 flex items-start gap-2 text-xs leading-snug text-muted-foreground">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              {trip.remoteId
                ? "Diese Reise liegt auf dem Server und kommt auf jedes angemeldete Gerät. Eine Datei zusätzlich zu haben, schadet trotzdem nicht — sie liegt dann bei dir und braucht kein Konto."
                : "Diese Reise liegt nur auf diesem Gerät. Wer die Website-Daten löscht, verliert sie. Gib sie oben zum Teilen frei oder lege eine Sicherung an."}
            </span>
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <PrimaryButton onClick={handleExportTrip}>
              <Download className="size-4" /> Diese Reise exportieren
            </PrimaryButton>
            <PrimaryButton onClick={() => fileInput.current?.click()}>
              <Upload className="size-4" /> Reise importieren
            </PrimaryButton>
          </div>
          <button
            type="button"
            onClick={handleBackup}
            className="mt-2 w-full rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground underline-offset-2 transition hover:underline"
          >
            {trips.length === 1 ? "Auch als Datei sichern" : `Alle ${trips.length} Reisen sichern`}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            className="hidden"
          />
          {ioMsg && <p className="mt-2 text-center text-xs font-medium">{ioMsg}</p>}
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Zum gemeinsamen Planen brauchst du das hier nicht — dafür gibt es oben den
            Einladungs­link. Die Datei ist die Kopie für dich: sie funktioniert ohne Konto und ohne
            Netz.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}

/** Kopfzeile der Reise: Zeitraum und Dauer, sobald bekannt. */
function tripSubtitle(trip: Trip, days: number): string {
  if (!trip.startDate) return "Zeitraum noch offen";
  const range = `${formatDateLong(trip.startDate)}${trip.endDate ? ` – ${formatDateLong(trip.endDate)}` : ""}`;
  return days > 0 ? `${range} · ${days} ${days === 1 ? "Tag" : "Tage"}` : range;
}
