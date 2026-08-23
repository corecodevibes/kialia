import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { writeOnboardedCache } from "@/lib/onboarding-gate";

export type Profile = {
  id: string;
  name: string;
  companions: string;
  has_kids: boolean;
  has_pets: boolean;
  onboarding_done: boolean;
};

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, ready };
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setProfile(null);
      setFailed(false);
      setLoadedFor(undefined);
      setReady(true);
      return;
    }
    setReady(false);
    setFailed(false);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        // postgrest-js wirft bei Netzfehlern nicht, sondern loest mit `error`
        // auf. Ohne diese Unterscheidung sieht "offline" aus wie "kein Profil".
        setFailed(!!error);
        setProfile((data as Profile) ?? null);
        if (!error && data) writeOnboardedCache(userId, !!(data as Profile).onboarding_done);
        setLoadedFor(userId);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Erst "ready", wenn die Daten wirklich zum aktuellen Nutzer gehören.
  const inSync = loadedFor === userId;

  return { profile, failed, ready: ready && inSync };
}

export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * Der eigene Anzeigename.
 *
 * Faellt auf "Ich" zurueck, solange kein Profilname gesetzt ist — aber nur
 * dann. In einer geteilten Reise ist "Ich" mehrdeutig, deshalb soll ueberall
 * der echte Name stehen.
 */
export function useMyName(): string {
  const { session } = useSession();
  const { profile } = useProfile(session?.user.id);
  return (profile?.name ?? "").trim() || "Ich";
}
