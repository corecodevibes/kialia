import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
  const [loadedFor, setLoadedFor] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setProfile(null);
      setLoadedFor(undefined);
      setReady(true);
      return;
    }
    setReady(false);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setProfile((data as Profile) ?? null);
        setLoadedFor(userId);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Erst "ready", wenn die Daten wirklich zum aktuellen Nutzer gehören.
  const inSync = loadedFor === userId;

  return { profile, ready: ready && inSync };
}

export async function signOut() {
  await supabase.auth.signOut();
}
