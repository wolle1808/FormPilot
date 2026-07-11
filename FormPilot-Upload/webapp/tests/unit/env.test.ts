import { describe, expect, it } from "vitest";
import { parseClientEnv, parseServerEnv } from "@/env";

const valid = {
  NEXT_PUBLIC_APP_ENV: "development",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "a".repeat(40),
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
};

describe("env.ts — Zod-Validierung", () => {
  it("akzeptiert eine vollständige, gültige Konfiguration", () => {
    const env = parseClientEnv(valid);
    expect(env.NEXT_PUBLIC_APP_ENV).toBe("development");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("http://127.0.0.1:54321");
  });

  it("nutzt development als Default für NEXT_PUBLIC_APP_ENV", () => {
    const env = parseClientEnv({ ...valid, NEXT_PUBLIC_APP_ENV: undefined });
    expect(env.NEXT_PUBLIC_APP_ENV).toBe("development");
  });

  it("lehnt unbekannte Umgebungsnamen ab", () => {
    expect(() =>
      parseClientEnv({ ...valid, NEXT_PUBLIC_APP_ENV: "staging" }),
    ).toThrow(/NEXT_PUBLIC_APP_ENV/);
  });

  it("lehnt eine fehlende Supabase-URL mit lesbarer Meldung ab", () => {
    expect(() =>
      parseClientEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: undefined }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("lehnt eine ungültige SITE_URL ab", () => {
    expect(() =>
      parseClientEnv({ ...valid, NEXT_PUBLIC_SITE_URL: "localhost ohne schema" }),
    ).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("lehnt einen zu kurzen Anon-Key ab", () => {
    expect(() =>
      parseClientEnv({ ...valid, NEXT_PUBLIC_SUPABASE_ANON_KEY: "kurz" }),
    ).toThrow(/ANON_KEY/);
  });

  it("Server-Schema: Service-Role-Key ist optional", () => {
    const env = parseServerEnv({ ...valid });
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    const env2 = parseServerEnv({
      ...valid,
      SUPABASE_SERVICE_ROLE_KEY: "b".repeat(40),
    });
    expect(env2.SUPABASE_SERVICE_ROLE_KEY).toBe("b".repeat(40));
  });
});
