import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ShieldIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Profil" };

const RELATION_LABEL: Record<string, string> = {
  self: "Ich",
  child: "Kind",
  parent: "Elternteil",
  grandparent: "Großelternteil",
  partner: "Partner:in",
  other: "Angehörige Person",
};

/**
 * Erste echte Datenbank-Ansicht: Personen des Kontos (RLS-geschützt).
 * Bearbeiten, Felder und verwaltete Angehörige folgen in Phase 2.
 */
export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: persons, error } = await supabase
    .from("persons")
    .select("id, display_name, relation, created_at")
    .order("created_at", { ascending: true });

  return (
    <>
      <div className="page-head">
        <h1>Profil</h1>
        <p className="page-sub">
          Einmal hinterlegt, immer bereit. Jedes Feld wird nur nach deiner
          Freigabe geteilt.
        </p>
      </div>

      <div className="cards">
        <div className="card">
          <div className="card-head">
            <h3>Personen in deinem Konto</h3>
            <span className="badge badge-teal">{persons?.length ?? 0}</span>
          </div>
          {error ? (
            <p className="error-text" role="alert">
              Die Personen konnten nicht geladen werden. Bitte lade die Seite
              neu.
            </p>
          ) : persons && persons.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Beziehung</th>
                </tr>
              </thead>
              <tbody>
                {persons.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: "var(--ink)" }}>
                      {p.display_name}
                    </td>
                    <td>{RELATION_LABEL[p.relation] ?? p.relation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="meta">
              Noch keine Personen angelegt. Dein „Ich“-Profil entsteht
              automatisch mit der Registrierung.
            </p>
          )}
          <p className="help" style={{ marginTop: 12 }}>
            Profilfelder (Steuer-ID, IBAN, Krankenkasse …) und verwaltete
            Angehörige mit Vollmacht folgen in Phase 2.
          </p>
        </div>
      </div>

      <div className="sec-note">
        <ShieldIcon size={16} />
        <span>
          Nur du hast Zugriff auf diese Daten — technisch erzwungen durch Row
          Level Security auf jeder Tabelle.
        </span>
      </div>
    </>
  );
}
