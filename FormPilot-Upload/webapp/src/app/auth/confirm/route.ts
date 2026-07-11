import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/env";
import { safeNextPath } from "@/lib/validation";

/**
 * Token-Hash-Bestätigung (alternative E-Mail-Template-Konfiguration):
 * /auth/confirm?token_hash=…&type=email|recovery[&next=/pfad]
 * Beide Wege (callback + confirm) werden unterstützt, damit die
 * Supabase-Projektkonfiguration nicht zum stillen Bruch führen kann.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const fallbackNext = type === "recovery" ? "/passwort-zuruecksetzen" : "/app";
  const next = safeNextPath(searchParams.get("next") ?? fallbackNext);

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(`${env.NEXT_PUBLIC_SITE_URL}${next}`);
    }
  }

  return NextResponse.redirect(
    `${env.NEXT_PUBLIC_SITE_URL}/login?fehler=link-ungueltig`,
  );
}
