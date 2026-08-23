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
      // Auf dem Server nicht mehr vorhanden: jemand hat sie gelöscht oder uns
      // entfernt. Wir behalten sie NICHT — sonst taucht sie beim nächsten
      // Abgleich immer wieder auf.
      continue;
    }
    seen.add(row.id);
    const localNewer = (trip.updatedAt ?? "") > row.updated_at;
    merged.push(localNewer ? trip : fromRow(row));
  }

  // 2. Reisen, die es nur auf dem Server gibt — etwa nach einem Beitritt.
  for (const row of remote) {
    if (!seen.has(row.id)) merged.push(fromRow(row));
  }

  const activeId = merged.some((t) => t.id === local.activeId)
    ? local.activeId
    : (merged[0]?.id ?? "");
  saveStore({ trips: merged, activeId });
  return { ok: true };
}

/** Schiebt eine einzelne Reise hoch. Ohne remoteId passiert nichts. */
export async function pushTrip(trip: Trip): Promise<void> {
  if (!trip.remoteId) return;
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
