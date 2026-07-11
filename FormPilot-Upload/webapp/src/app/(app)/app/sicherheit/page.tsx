import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ShieldIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Sicherheit & Zugriff" };

export default async function SecurityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <div className="page-head">
        <h1>Sicherheit &amp; Zugriff</h1>
        <p className="page-sub">
          Nachvollziehbar: dein Konto und jeder Zugriff auf deine Daten.
        </p>
      </div>

      <div className="cards">
        <div className="card">
          <div className="card-head">
            <h3>Anmeldung</h3>
            <span className="badge badge-ok">Aktiv</span>
          </div>
          <p>
            Angemeldet als <span className="mono">{user?.email}</span>. Die
            E-Mail-Adresse ist bestätigt; Sessions laufen serverseitig und
            können durch Abmelden beendet werden.
          </p>
          <p className="help" style={{ marginTop: 6 }}>
            Zwei-Faktor-Anmeldung, Geräteliste und das vollständige
            Zugriffsprotokoll folgen in Phase 2.
          </p>
        </div>
      </div>

      <div className="sec-note">
        <ShieldIcon size={16} />
        <span>
          Deine Daten liegen in einer eigenen, zugriffsgeschützten Datenbank
          (Row Level Security). Jede Tabelle ist strikt auf dein Konto begrenzt.
        </span>
      </div>
    </>
  );
}
