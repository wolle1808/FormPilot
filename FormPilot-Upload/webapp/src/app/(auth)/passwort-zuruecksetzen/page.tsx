import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UpdatePasswordForm } from "./update-form";

export const metadata: Metadata = { title: "Neues Passwort festlegen" };

/**
 * Diese Seite erreicht man über den Recovery-Link aus der E-Mail
 * (auth/callback tauscht den Code gegen eine Session). Ohne gültige
 * Session gibt es eine klare Ansage statt eines toten Formulars.
 */
export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="card" style={{ padding: 28 }}>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>Der Link ist abgelaufen.</h1>
        <p>
          Der Link zum Zurücksetzen ist ungültig oder wurde schon verwendet.
          Bitte fordere einen neuen Link an.
        </p>
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <Link className="link-btn" href="/passwort-vergessen">
            Neuen Link anfordern
          </Link>
        </div>
      </div>
    );
  }

  return <UpdatePasswordForm />;
}
