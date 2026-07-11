import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "E-Mail bestätigen" };

export default function ConfirmEmailPage() {
  return (
    <div className="card" style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, marginBottom: 10 }}>Bitte bestätige deine E-Mail-Adresse.</h1>
      <p style={{ marginBottom: 10 }}>
        Wir haben dir eine E-Mail mit einem Bestätigungslink geschickt. Öffne
        den Link, um dein Konto zu aktivieren — erst danach ist die Anmeldung
        möglich.
      </p>
      <p className="help">
        Keine E-Mail bekommen? Prüfe den Spam-Ordner. In der lokalen
        Entwicklungsumgebung landen alle E-Mails im Inbucket
        (http://127.0.0.1:54324).
      </p>
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <Link className="link-btn" href="/login">
          Zur Anmeldung
        </Link>
      </div>
    </div>
  );
}
