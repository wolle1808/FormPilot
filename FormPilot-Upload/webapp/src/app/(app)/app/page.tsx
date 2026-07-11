import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ShieldIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Übersicht" };

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .single();

  const firstName = profile?.display_name?.split(" ")[0] || "";

  return (
    <>
      <div className="page-head">
        <h1>{firstName ? `Guten Tag, ${firstName}.` : "Guten Tag."}</h1>
        <p className="page-sub">Alles im Griff — nichts zu tun.</p>
      </div>

      <div className="cards">
        <div className="card">
          <div className="card-head">
            <h3>Dein Konto ist eingerichtet</h3>
            <span className="badge badge-teal">Phase 1</span>
          </div>
          <p>
            Anmeldung, E-Mail-Bestätigung und dein persönlicher Bereich
            funktionieren. Dokumente, Vorgänge und Freigaben folgen in den
            nächsten Ausbaustufen — die Navigation zeigt schon heute, wo alles
            liegen wird.
          </p>
        </div>
      </div>

      <div className="sec-note">
        <ShieldIcon size={16} />
        <span>
          Nur du hast Zugriff auf deine Daten. FormPilot teilt nichts ohne
          deine ausdrückliche Freigabe.
        </span>
      </div>
    </>
  );
}
