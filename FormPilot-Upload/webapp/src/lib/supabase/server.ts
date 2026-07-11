import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Supabase-Client für Server-Komponenten, Server-Actions und Route-Handler.
 * Sessions liegen in httpOnly-Cookies; @supabase/ssr übernimmt das Lesen/Schreiben.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Aufruf aus einer Server-Komponente: Cookies können dort nicht
               gesetzt werden. Die Middleware übernimmt das Session-Refresh. */
          }
        },
      },
    },
  );
}
