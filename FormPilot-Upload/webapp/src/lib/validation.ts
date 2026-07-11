import { z } from "zod";

/**
 * Gemeinsame Eingabe-Validierung für Auth-Formulare.
 * Fehlertexte folgen der Brand-Guideline: Ursache + Lösung, keine Schuldzuweisung.
 */

export const MIN_PASSWORD_LENGTH = 10;

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Bitte gib deine E-Mail-Adresse ein.")
  .email("Das sieht nicht nach einer E-Mail-Adresse aus. Bitte prüfe die Eingabe.");

export const passwordSchema = z
  .string()
  .min(
    MIN_PASSWORD_LENGTH,
    `Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen haben.`,
  )
  .max(128, "Das Passwort darf höchstens 128 Zeichen haben.");

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Bitte gib deinen Namen ein (mindestens 2 Zeichen).")
  .max(80, "Der Name darf höchstens 80 Zeichen haben.");

export const registerSchema = z
  .object({
    displayName: displayNameSchema,
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Die Passwörter stimmen nicht überein. Bitte gib beide gleich ein.",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Bitte gib dein Passwort ein."),
});

export const resetRequestSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Die Passwörter stimmen nicht überein. Bitte gib beide gleich ein.",
  });

/** Erste Fehlermeldung eines Zod-Ergebnisses — für einfache Formular-Anzeige. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Bitte prüfe deine Eingaben.";
}

/** Nur Pfade unterhalb der eigenen App zulassen (Open-Redirect-Schutz für ?next=). */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return "/app";
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/app";
  return next;
}

/** Geschützte Bereiche der App (Middleware + Layout nutzen dieselbe Definition). */
export function isProtectedPath(pathname: string): boolean {
  return pathname === "/app" || pathname.startsWith("/app/");
}

/** Seiten, die angemeldete Nutzer nicht mehr sehen sollen. */
export function isAuthOnlyPath(pathname: string): boolean {
  return ["/login", "/registrieren", "/passwort-vergessen"].includes(pathname);
}
