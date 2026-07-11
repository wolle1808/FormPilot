"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/env";
import {
  firstError,
  loginSchema,
  registerSchema,
  resetRequestSchema,
  safeNextPath,
  updatePasswordSchema,
} from "@/lib/validation";

export type AuthActionState = {
  error?: string;
  ok?: boolean;
};

/**
 * Fehlertexte: bewusst keine Nutzer-Enumeration — bei Login und Passwort-Reset
 * verrät die Antwort nie, ob eine E-Mail-Adresse registriert ist.
 */

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/app`,
    },
  });

  if (error) {
    if (error.code === "weak_password") {
      return { error: "Das Passwort ist zu leicht zu erraten. Bitte wähle ein längeres, unüblicheres Passwort." };
    }
    if (error.code === "over_email_send_rate_limit") {
      return { error: "Zu viele Versuche in kurzer Zeit. Bitte warte einen Moment und versuche es erneut." };
    }
    /* user_already_exists wird absichtlich NICHT gesondert gemeldet (keine Enumeration).
       Supabase antwortet bei bestehender Adresse ohnehin neutral. */
    return { error: "Die Registrierung hat nicht geklappt. Bitte versuche es in ein paar Minuten erneut." };
  }

  redirect("/registrieren/bestaetigen");
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Deine E-Mail-Adresse ist noch nicht bestätigt. Bitte öffne den Link aus der Bestätigungs-Mail." };
    }
    return { error: "E-Mail-Adresse oder Passwort stimmen nicht. Bitte prüfe beide Eingaben." };
  }

  redirect(safeNextPath(formData.get("next") as string | null));
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  /* Antwort ist absichtlich immer gleich — ob die Adresse existiert, wird nicht verraten. */
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/passwort-zuruecksetzen`,
  });

  return { ok: true };
}

export async function updatePasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Der Link ist abgelaufen oder wurde schon verwendet. Bitte fordere einen neuen Link an." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") {
      return { error: "Das neue Passwort muss sich vom bisherigen unterscheiden." };
    }
    return { error: "Das Passwort konnte nicht gespeichert werden. Bitte versuche es erneut." };
  }

  redirect("/app");
}
