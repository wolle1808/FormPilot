import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env";
import { isAuthOnlyPath, isProtectedPath, safeNextPath } from "@/lib/validation";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Session-Refresh + Routenschutz in der Middleware.
 *
 * - Erneuert ablaufende Supabase-Sessions (Cookies) bei jedem Request.
 * - Leitet nicht angemeldete Nutzer von /app/* nach /login?next=… um.
 * - Leitet angemeldete Nutzer von Login/Registrierung nach /app um.
 *
 * Wichtig (Supabase-Vorgabe): zwischen createServerClient und
 * auth.getUser() darf kein weiterer Code laufen, und die Antwort muss
 * die gesetzten Cookies unverändert weitertragen.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options ?? {}),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", safeNextPath(pathname + search));
    return NextResponse.redirect(url);
  }

  if (user && isAuthOnlyPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
