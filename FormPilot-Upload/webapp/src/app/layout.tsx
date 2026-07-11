import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { env, ENV_LABEL, isProduction } from "@/env";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "FormPilot — Dokumente. Daten. Freigaben.",
    template: "%s · FormPilot",
  },
  description:
    "FormPilot ist der sichere persönliche Assistent für Daten, Dokumente und Formulare.",
  /* Nicht-produktive Umgebungen werden nicht indexiert. */
  robots: isProduction ? undefined : { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const envLabel = ENV_LABEL[env.NEXT_PUBLIC_APP_ENV];
  return (
    <html lang="de">
      <body className={inter.className}>
        {envLabel ? <div className="env-banner">{envLabel}</div> : null}
        {children}
      </body>
    </html>
  );
}
