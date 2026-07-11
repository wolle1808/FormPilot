import { z } from "zod";

/**
 * Zentrale, validierte Umgebungskonfiguration.
 *
 * Regeln:
 * - Alles, was der Browser sieht, heißt NEXT_PUBLIC_* und steht im clientSchema.
 * - Server-Geheimnisse (Service-Role-Key) sind optional und werden nur von
 *   Tests/Skripten gebraucht — die App-Laufzeit kommt ohne sie aus.
 * - Bei ungültiger Konfiguration bricht der Start mit einer lesbaren Liste ab.
 */

export const APP_ENVS = ["development", "demo", "preview", "production"] as const;
export type AppEnv = (typeof APP_ENVS)[number];

const clientSchema = z.object({
  NEXT_PUBLIC_APP_ENV: z.enum(APP_ENVS).default("development"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: "NEXT_PUBLIC_SUPABASE_URL muss eine gültige URL sein (z. B. http://127.0.0.1:54321).",
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, {
    message: "NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt oder ist zu kurz.",
  }),
  NEXT_PUBLIC_SITE_URL: z.string().url({
    message: "NEXT_PUBLIC_SITE_URL muss eine absolute URL sein (z. B. http://localhost:3000).",
  }),
});

const serverSchema = clientSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
});

export type ClientEnv = z.infer<typeof clientSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
    .join("\n");
}

/**
 * NEXT_PUBLIC_*-Variablen werden von Next.js zur Buildzeit per statischer
 * Ersetzung eingebettet — deshalb müssen sie hier einzeln referenziert werden
 * (kein dynamischer Zugriff über process.env[name]).
 */
const rawClient = {
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
};

export function parseClientEnv(raw: Record<string, string | undefined> = rawClient): ClientEnv {
  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Ungültige Umgebungskonfiguration (Client):\n${formatIssues(parsed.error)}\n` +
        `Vorlage: .env.example → Kopie als .env.local anlegen.`,
    );
  }
  return parsed.data;
}

export function parseServerEnv(
  raw: Record<string, string | undefined> = { ...rawClient, SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY },
): ServerEnv {
  const parsed = serverSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Ungültige Umgebungskonfiguration (Server):\n${formatIssues(parsed.error)}`,
    );
  }
  return parsed.data;
}

/** Validierte Client-Umgebung — überall in der App hierüber zugreifen, nie direkt process.env. */
export const env: ClientEnv = parseClientEnv();

export const isProduction = env.NEXT_PUBLIC_APP_ENV === "production";
export const isDemo = env.NEXT_PUBLIC_APP_ENV === "demo";

/** Kennzeichnung nicht-produktiver Umgebungen (Banner, robots). */
export const ENV_LABEL: Record<AppEnv, string | null> = {
  development: "Entwicklungsumgebung",
  demo: "Demo-Umgebung — Beispieldaten, bitte keine echten sensiblen Daten eingeben",
  preview: "Vorschau-Umgebung — Stand kann jederzeit zurückgesetzt werden",
  production: null,
};
