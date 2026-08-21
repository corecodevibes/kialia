/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID: string;
  /** "true" schaltet die Sprachmemo-Transkription frei (braucht ein Backend). */
  readonly VITE_VOICE_ENABLED: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
