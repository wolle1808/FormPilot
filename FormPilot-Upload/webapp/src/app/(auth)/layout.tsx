import Image from "next/image";

/** Gate-Layout: zentrierte Karte mit Logo — für Login, Registrierung, Passwort-Flows. */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="gate-wrap">
      <div className="gate-logo">
        <Image
          src="/formpilot_logo.svg"
          alt="FormPilot — Dokumente. Daten. Freigaben."
          width={190}
          height={57}
          priority
        />
      </div>
      {children}
    </main>
  );
}
