import { describe, expect, it } from "vitest";
import {
  isAuthOnlyPath,
  isProtectedPath,
  loginSchema,
  registerSchema,
  safeNextPath,
  updatePasswordSchema,
} from "@/lib/validation";

describe("Routen-Klassifizierung (Middleware-Logik)", () => {
  it("schützt /app und alle Unterrouten", () => {
    expect(isProtectedPath("/app")).toBe(true);
    expect(isProtectedPath("/app/profil")).toBe(true);
    expect(isProtectedPath("/app/safe/dokument-1")).toBe(true);
  });

  it("schützt öffentliche Routen nicht", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/apple")).toBe(false); // kein Präfix-Treffer auf /app
  });

  it("erkennt Auth-Seiten für die Umleitung angemeldeter Nutzer", () => {
    expect(isAuthOnlyPath("/login")).toBe(true);
    expect(isAuthOnlyPath("/registrieren")).toBe(true);
    expect(isAuthOnlyPath("/passwort-zuruecksetzen")).toBe(false); // braucht Session
  });
});

describe("safeNextPath — Open-Redirect-Schutz", () => {
  it("erlaubt interne Pfade", () => {
    expect(safeNextPath("/app/profil")).toBe("/app/profil");
  });
  it("blockt externe und protokollrelative Ziele", () => {
    expect(safeNextPath("https://boese.example")).toBe("/app");
    expect(safeNextPath("//boese.example")).toBe("/app");
    expect(safeNextPath("/\\boese")).toBe("/app");
  });
  it("fällt ohne Angabe auf /app zurück", () => {
    expect(safeNextPath(null)).toBe("/app");
    expect(safeNextPath("")).toBe("/app");
  });
});

describe("Auth-Formular-Validierung", () => {
  it("Registrierung: gültige Eingaben passieren", () => {
    const r = registerSchema.safeParse({
      displayName: "Maurice Wollmer",
      email: "test@example.de",
      password: "korrektes-pferd-batterie",
      passwordConfirm: "korrektes-pferd-batterie",
    });
    expect(r.success).toBe(true);
  });

  it("Registrierung: zu kurzes Passwort wird mit Lösungs-Hinweis abgelehnt", () => {
    const r = registerSchema.safeParse({
      displayName: "Maurice",
      email: "test@example.de",
      password: "kurz",
      passwordConfirm: "kurz",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.message).toMatch(/mindestens 10 Zeichen/);
    }
  });

  it("Registrierung: nicht übereinstimmende Passwörter werden abgelehnt", () => {
    const r = registerSchema.safeParse({
      displayName: "Maurice",
      email: "test@example.de",
      password: "korrektes-pferd-batterie",
      passwordConfirm: "anderes-passwort-123",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.path).toContain("passwordConfirm");
    }
  });

  it("Login: leere Eingaben liefern deutsche Meldungen", () => {
    const r = loginSchema.safeParse({ email: "", password: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.message).toMatch(/E-Mail/);
    }
  });

  it("Passwort ändern: Wiederholung muss übereinstimmen", () => {
    const r = updatePasswordSchema.safeParse({
      password: "neues-sicheres-passwort",
      passwordConfirm: "neues-sicheres-passwort",
    });
    expect(r.success).toBe(true);
  });
});
