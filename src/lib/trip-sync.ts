import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Eng begrenzte Umgehung an genau einer Stelle: der generierte Typ in
 * `integrations/supabase/types.ts` kennt nur `profiles`, weil er vor dieser
 * Migration erzeugt wurde. Sobald `supabase gen types typescript` gelaufen ist,
 * faellt diese Zeile weg und die Aufrufe unten sind wieder voll typisiert.
 */
const db = supabase as unknown as SupabaseClient;
import { currentStore, loadStore, saveStore, subscribeStore, type Trip } from "@/lib/trip-store";
import { mergeTrips } from "@/lib/trip-merge";

/**
 * Reisen zwischen Gerät und Supabase abgleichen.
 *
 * DIE REISE IST EIN DOKUMENT. Sie liegt als ein JSONB-Feld in der Tabelle,
 * nicht als zehn verknüpfte Tabellen. Eine Reise wird von wenigen Menschen
 * gemeinsam bearbeitet, es gibt keine Abfragen über einzelne Posten — ein
 * Dokument spart das gesamte Beziehungsmodell und hält Client und Datenbank in
 * derselben Form.
 *
 * KONFLIKTE: Bei gleichzeitiger Bearbeitung gewinnt die zuletzt gespeicherte
 * Fassung. Für zwei Menschen, die zusammen eine Reise planen, ist das
 * vertretbar — es ist aber eine bewusste Entscheidung, keine Auslassung. Wer
 * gleichzeitig im selben Feld tippt, verliert die ältere Eingabe.
 *
 * OFFLINE: Schlägt der Abgleich fehl, bleibt der lokale Stand unangetastet und
 * gilt weiter. Die Reise muss unterwegs funktionieren, auch wenn Supabase
 * nicht erreichbar ist.
 */

type Row = {
  id: string;
  owner_id: string;
  invite_code: string;
  data: Trip;
  updated_at: string;
};

/** Das Dokument, das hochgeladen wird — ohne die Felder, die der Server führt. */
function payload(trip: Trip): Trip {
  const { remoteId: _r, inviteCode: _c, updatedAt: _u, ...rest } = trip;
  return rest as Trip;
}

function fromRow(row: Row): Trip {
  return {
    ...row.data,
    remoteId: row.id,
    inviteCode: row.invite_code,
    updatedAt: row.updated_at,
  };
}

/**
 * Holt alle Reisen, in denen der Nutzer Mitglied ist, und führt sie mit dem
 * lokalen Stand zusammen.
 *
 * Lokale Reisen ohne remoteId werden hochgeladen — so wandert alles, was vor
 * dem Anmelden entstanden ist, beim ersten Abgleich mit.
 */
let lastSync = 0;

/**
 * Abgleich, hoechstens alle 20 Sekunden.
 *
 * AppShell wird von JEDER Route gerendert, also bei jedem Tab-Wechsel neu
 * eingehaengt — ohne Drosselung liefe bei fuenf Tabs fuenfmal ein voller
 * Abgleich. Das kostet nicht nur Netz: jeder Abgleich schreibt den lokalen
 * Speicher neu und koennte eine gerade laufende Eingabe ueberholen.
 */
export async function syncTripsThrottled(): Promise<{ ok: boolean; error?: string }> {
  const now = Date.now();
  // Uebersprungen ist kein Fehler — sonst blinkte bei jedem Bildschirmwechsel
  // innerhalb der Sperrfrist eine Warnung auf.
  if (now - lastSync < 20_000) return { ok: true };
  lastSync = now;
  return syncTrips();
}

export async function syncTrips(): Promise<{ ok: boolean; error?: string }> {
  const { data: session } = await supabase.auth.getSession();
  const user = session.session?.user;
  if (!user) return { ok: false, error: "nicht angemeldet" };

  const local = loadStore();

  const { data: rows, error } = await db
    .from("trips")
    .select("id, owner_id, invite_code, data, updated_at");

  if (error) return { ok: false, error: error.message };

  const remote = (rows ?? []) as unknown as Row[];
  const byRemoteId = new Map(remote.map((r) => [r.id, r]));
  const merged: Trip[] = [];
  const seen = new Set<string>();
  /** Reisen, die nicht hochgeladen werden konnten — samt Grund. */
  const fehlgeschlagen: string[] = [];

  // 1. Lokale Reisen: hochladen oder mit der Serverfassung vergleichen.
  for (const trip of local.trips) {
    if (!trip.remoteId) {
      // Erst nachsehen, ob diese Reise oben schon existiert. Ohne diese
      // Prüfung entsteht bei jedem fehlgeschlagenen Zurücklesen eine weitere
      // Kopie — genau das ist am 23.08. passiert, weil die SELECT-Policy den
      // Eigentümer im Moment des Anlegens noch nicht kannte.
      const existing = remote.find((r) => (r.data as Trip)?.id === trip.id);
      if (existing) {
        merged.push(fromRow(existing));
        seen.add(existing.id);
        continue;
      }

      const { data: created, error: insErr } = await db
        .from("trips")
        .insert({ owner_id: user.id, data: payload(trip) as never })
        .select("id, owner_id, invite_code, data, updated_at")
        .single();

      if (insErr || !created) {
        // Zurücklesen ging schief. Die Zeile kann trotzdem angelegt worden
        // sein — deshalb einmal gezielt nachfragen statt blind erneut
        // einzufügen.
        const { data: found } = await db
          .from("trips")
          .select("id, owner_id, invite_code, data, updated_at")
          .eq("owner_id", user.id)
          .eq("data->>id", trip.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (found) {
          const row = found as unknown as Row;
          merged.push({
            ...trip,
            remoteId: row.id,
            inviteCode: row.invite_code,
            updatedAt: row.updated_at,
          });
          seen.add(row.id);
        } else {
          // Weder angelegt noch auffindbar. Frueher wurde die Reise hier
          // einfach unveraendert uebernommen und der Abgleich meldete Erfolg —
          // der Nutzer druckte auf "Jetzt zum Teilen freigeben", es passierte
          // nichts, und nichts sagte warum. Ein stiller Fehlschlag ist
          // schlimmer als ein lauter.
          fehlgeschlagen.push(insErr?.message ?? "Anlegen auf dem Server hat nicht geklappt.");
          merged.push(trip);
        }
        continue;
      }
      const row = created as unknown as Row;
      merged.push({
        ...trip,
        remoteId: row.id,
        inviteCode: row.invite_code,
        updatedAt: row.updated_at,
      });
      seen.add(row.id);
      continue;
    }

    const row = byRemoteId.get(trip.remoteId);
    if (!row) {
      // Auf dem Server nicht auffindbar. Frueher wurde die Reise hier lokal
      // verworfen, um zu verhindern, dass eine geloeschte Reise immer wieder
      // auftaucht. Das war die falsche Abwaegung: die Antwort kann auch leer
      // sein, weil eine Mitgliedschaft fehlt oder eine Regel gerade nicht
      // greift — und dann loescht ein Abgleich wortlos eine ganze Reise vom
      // Geraet. Genau dieses Bild ("war da, ist weg") hat Annalina gesehen.
      //
      // Jetzt bleibt sie liegen und wird nur abgekoppelt: sie wird nicht mehr
      // hochgeschoben, taucht also auch nicht als Kopie wieder auf, und die
      // Oberflaeche kann sagen, dass sie nicht mehr geteilt ist.
      merged.push({ ...trip, orphan: true });
      seen.add(trip.remoteId);
      continue;
    }
    seen.add(row.id);
    const localNewer = (trip.updatedAt ?? "") > row.updated_at;
    // Zusammenfuehren statt eine Fassung zu verwerfen.
    //
    // Vorher gewann hier eine ganze Fassung. Wer zuletzt hochschob,
    // ueberschrieb alles vom anderen — auf Kreta hiess das, dass keiner die
    // Eintraege des anderen zu sehen bekam. Jetzt bleiben Eintraege, die nur
    // eine Seite hat, und nur bei gleicher id entscheidet das Alter.
    const next = mergeTrips(trip, fromRow(row), localNewer);
    merged.push({ ...next, orphan: false });
  }

  // 2. Reisen, die es nur auf dem Server gibt — etwa nach einem Beitritt.
  for (const row of remote) {
    if (!seen.has(row.id)) merged.push(fromRow(row));
  }

  const activeId = merged.some((t) => t.id === local.activeId)
    ? local.activeId
    : (merged[0]?.id ?? "");
  saveStore({ trips: merged, activeId });

  // Gespeichert wird trotzdem — was hochgeladen werden konnte, soll es auch
  // bleiben. Gemeldet wird der Fehlschlag aber, sonst sucht der Nutzer ihn
  // bei sich.
  if (fehlgeschlagen.length > 0) {
    return { ok: false, error: fehlgeschlagen[0] ?? "Unbekannter Fehler" };
  }
  return { ok: true };
}

/** Schiebt eine einzelne Reise hoch. Ohne remoteId passiert nichts. */
export async function pushTrip(trip: Trip): Promise<void> {
  // Abgekoppelte Reisen nicht hochschieben — sonst legt der naechste Abgleich
  // eine zweite Fassung an und das Problem kehrt als Dublette zurueck.
  if (!trip.remoteId || trip.orphan) return;
  await db
    .from("trips")
    .update({ data: payload(trip) as never })
    .eq("id", trip.remoteId);
}

/** Einer geteilten Reise über den Code beitreten. */
export async function joinTrip(code: string): Promise<{ ok: boolean; error?: string }> {
  const clean = code.trim().toUpperCase();
  if (clean.length < 4) return { ok: false, error: "Der Code sieht unvollständig aus." };

  const { error } = await db.rpc("join_trip", { p_code: clean });
  if (error) {
    return {
      ok: false,
      error: error.message.includes("keiner Reise")
        ? "Zu diesem Code gibt es keine Reise."
        : "Beitreten hat nicht geklappt.",
    };
  }
  return syncTrips();
}

/* ---------------------------------------------------------------------------
 * Automatischer Abgleich
 * ------------------------------------------------------------------------ */

let stopAuto: (() => void) | null = null;

/**
 * Startet das Hochladen bei Änderungen.
 *
 * Gebündelt mit Verzögerung: beim Tippen ändert sich der Speicher bei jedem
 * Anschlag. Ohne Bündelung entstünde ein Schreibvorgang pro Buchstabe — das
 * belastet die Verbindung, verbraucht Akku und produziert Konflikte, wo keine
 * sind.
 */
export function startAutoSync(): () => void {
  if (stopAuto) return stopAuto;

  let timer: ReturnType<typeof setTimeout> | null = null;

  const unsubscribe = subscribeStore(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const store = currentStore();
      for (const trip of store.trips) void pushTrip(trip);
    }, 1200);
  });

  stopAuto = () => {
    if (timer) clearTimeout(timer);
    unsubscribe();
    stopAuto = null;
  };
  return stopAuto;
}

/**
 * Horcht auf Änderungen der anderen Mitglieder.
 *
 * Ohne das müsste man die App neu laden, um zu sehen, was der Partner gerade
 * eingetragen hat — bei gemeinsamem Planen der halbe Sinn der Sache.
 */
export function watchRemote(onChange: () => void): () => void {
  const channel = supabase
    .channel("trips-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, () => onChange())
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Wie viele Menschen an dieser Reise mitplanen.
 *
 * Nur die Anzahl, keine Namen: die Policy auf `profiles` gibt jedem nur das
 * eigene Profil frei — und das ist richtig so. Für die Rückmeldung "sie ist
 * beigetreten" reicht die Zahl.
 */
export async function countMembers(remoteId: string): Promise<number | null> {
  const { count, error } = await db
    .from("trip_members")
    .select("user_id", { count: "exact", head: true })
    .eq("trip_id", remoteId);
  return error ? null : (count ?? null);
}

/**
 * Eine Reise fuer sich selbst entfernen.
 *
 * Auf dem Server heisst das: Mitgliedschaft aufloesen. Sind danach noch andere
 * dabei, behalten die sie unveraendert — sie haben mitgeplant, und dass eine
 * Person aufraeumt, ist kein Grund, ihnen die Reise wegzunehmen. Ist niemand
 * mehr dabei, verschwindet sie ganz.
 *
 * Ohne `remoteId` war sie nie oben; dann gibt es nichts zu tun und das lokale
 * Entfernen genuegt.
 */
export async function leaveTrip(
  trip: Trip,
): Promise<{ ok: boolean; outcome?: "left" | "deleted"; error?: string }> {
  if (!trip.remoteId) return { ok: true, outcome: "deleted" };

  const { data, error } = await db.rpc("leave_trip", { p_trip: trip.remoteId });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, outcome: data === "left" ? "left" : "deleted" };
}
