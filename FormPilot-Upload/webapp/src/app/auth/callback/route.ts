import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/env";
import { safeNextPath } from "@/lib/validation";

/**
 * PKCE-Callback: E-Mail-Bestätigung und Passwort-Reset-Links landen hier
 * mit ?code=… und werden gegen eine Session getauscht.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${env.NEXT_PUBLIC_SITE_URL}${next}`);
    }
  }

  return NextResponse.redirect(
    `${env.NEXT_PUBLIC_SITE_URL}/login?fehler=link-ungueltig`,
  );
}
