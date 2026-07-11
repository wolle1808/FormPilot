/**
 * Row-Level-Security-Test: Nutzer A gegen Nutzer B.
 *
 * Läuft gegen eine ECHTE Supabase-Instanz (lokal: `supabase start`).
 * Benötigte Umgebungsvariablen (z. B. via .env.local + `npm run test:rls`):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *
 * Ohne diese Variablen überspringt sich die Suite selbst (CI ohne DB bleibt grün);
 * das Skip wird im Report ausgewiesen.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configured = Boolean(url && anonKey && serviceKey);

const PASSWORD = "rls-test-passwort-123";

function anonClient(): SupabaseClient {
  return createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

describe.skipIf(!configured)("RLS: Nutzer A gegen Nutzer B", () => {
  const admin = configured
    ? createClient(url!, serviceKey!, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : (null as unknown as SupabaseClient);

  let userAId = "";
  let userBId = "";
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let personAId = "";

  beforeAll(async () => {
    const stamp = Date.now();
    const mkUser = async (label: string) => {
      const { data, error } = await admin.auth.admin.createUser({
        email: `rls-${label}-${stamp}@example.com`,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: `RLS ${label.toUpperCase()}` },
      });
      if (error || !data.user) throw new Error(`createUser ${label}: ${error?.message}`);
      return data.user.id;
    };

    userAId = await mkUser("a");
    userBId = await mkUser("b");

    clientA = anonClient();
    clientB = anonClient();
    const a = await clientA.auth.signInWithPassword({
      email: `rls-a-${stamp}@example.com`,
      password: PASSWORD,
    });
    const b = await clientB.auth.signInWithPassword({
      email: `rls-b-${stamp}@example.com`,
      password: PASSWORD,
    });
    if (a.error || b.error) throw new Error("Login der Testnutzer fehlgeschlagen.");
  });

  afterAll(async () => {
    if (!configured) return;
    if (userAId) await admin.auth.admin.deleteUser(userAId);
    if (userBId) await admin.auth.admin.deleteUser(userBId);
  });

  it("Registrierungs-Trigger: beide Nutzer haben Profil und Ich-Person", async () => {
    const { data: profileA } = await clientA.from("profiles").select("*");
    expect(profileA).toHaveLength(1);
    expect(profileA![0]!.id).toBe(userAId);

    const { data: personsA } = await clientA.from("persons").select("*");
    expect(personsA).toHaveLength(1);
    expect(personsA![0]!.relation).toBe("self");
    personAId = personsA![0]!.id;
  });

  it("A sieht nur das eigene Profil — nie das von B", async () => {
    const { data } = await clientA.from("profiles").select("id");
    expect(data?.map((r) => r.id)).toEqual([userAId]);
    expect(data?.map((r) => r.id)).not.toContain(userBId);
  });

  it("B kann A's Profil nicht ändern (0 betroffene Zeilen)", async () => {
    const { data } = await clientB
      .from("profiles")
      .update({ display_name: "GEHACKT" })
      .eq("id", userAId)
      .select();
    expect(data).toEqual([]);

    const { data: check } = await clientA
      .from("profiles")
      .select("display_name")
      .single();
    expect(check?.display_name).toBe("RLS A");
  });

  it("A kann eine weitere Person anlegen, B sieht sie nicht", async () => {
    const { data: created, error } = await clientA
      .from("persons")
      .insert({ owner_user_id: userAId, display_name: "Heinz Test", relation: "grandparent" })
      .select()
      .single();
    expect(error).toBeNull();
    expect(created?.display_name).toBe("Heinz Test");

    const { data: seenByB } = await clientB.from("persons").select("id");
    const idsB = (seenByB ?? []).map((r) => r.id);
    expect(idsB).not.toContain(created!.id);
    expect(idsB).not.toContain(personAId);
  });

  it("B kann keine Person im Namen von A anlegen (with check)", async () => {
    const { error } = await clientB
      .from("persons")
      .insert({ owner_user_id: userAId, display_name: "Eingeschleust", relation: "other" });
    expect(error).not.toBeNull();
    expect(error!.code).toBe("42501"); // row-level security violation
  });

  it("B kann A's Person weder ändern noch löschen", async () => {
    const { data: upd } = await clientB
      .from("persons")
      .update({ display_name: "GEHACKT" })
      .eq("id", personAId)
      .select();
    expect(upd).toEqual([]);

    const { data: del } = await clientB
      .from("persons")
      .delete()
      .eq("id", personAId)
      .select();
    expect(del).toEqual([]);

    const { data: still } = await clientA
      .from("persons")
      .select("display_name")
      .eq("id", personAId)
      .single();
    expect(still?.display_name).toBe("RLS A");
  });

  it("Nicht angemeldete Clients (anon) sehen gar nichts", async () => {
    const anon = anonClient();
    const { data, error } = await anon.from("persons").select("*");
    /* Je nach Grant-Konfiguration: leeres Ergebnis oder Berechtigungsfehler — beides ist dicht. */
    if (error) {
      expect(error.code).toBe("42501");
    } else {
      expect(data).toEqual([]);
    }
  });

  it("Konto-Constraint: nur eine Ich-Person pro Nutzer", async () => {
    const { error } = await clientA
      .from("persons")
      .insert({ owner_user_id: userAId, display_name: "Zweites Ich", relation: "self" });
    expect(error).not.toBeNull();
    expect(error!.code).toBe("23505"); // unique_violation
  });
});

if (!configured) {
  describe("RLS: Nutzer A gegen Nutzer B (übersprungen)", () => {
    it("wird übersprungen — keine Supabase-Testumgebung konfiguriert", () => {
      console.warn(
        "RLS-Tests übersprungen: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY nicht gesetzt. " +
          "Lokal: `supabase start`, Keys aus `supabase status` in .env.local eintragen, dann `npm run test:rls`.",
      );
      expect(true).toBe(true);
    });
  });
}
