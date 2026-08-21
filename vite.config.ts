import { defineConfig, loadEnv } from "vite";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ mode }) => {
  // Load-bearing: VITE_* Variablen werden explizit als `define` eingebacken.
  // Ohne das greift die Injektion im nitro-Server-Bundle nicht zuverlaessig und
  // die App startet in Produktion mit leeren Supabase-Credentials.
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const envDefine = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  );

  return {
    define: envDefine,
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      // server.entry -> src/server.ts: unser SSR-Error-Wrapper, der von h3
      // verschluckte 500er in eine echte Fehlerseite uebersetzt.
      tanstackStart({ server: { entry: "server" } }),
      nitro({ preset: "cloudflare-module" }),
      viteReact(),
    ],
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      // Doppelte React-/Query-Instanzen fuehren zu Hook-Fehlern zur Laufzeit.
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    server: { host: true, port: 8080 },
  };
});
