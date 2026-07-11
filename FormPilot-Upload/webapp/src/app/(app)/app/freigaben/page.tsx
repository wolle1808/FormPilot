import type { Metadata } from "next";
import { PlaceholderView } from "@/components/placeholder-view";

export const metadata: Metadata = { title: "Freigaben" };

export default function SharesPage() {
  return (
    <PlaceholderView
      title="Deine Freigaben"
      sub="Du siehst jederzeit, wer welche Daten erhalten hat — und kannst jeden Zugriff widerrufen."
      phase="Phase 2"
      description="Hier entstehen künftig zeitlich begrenzte, widerrufbare Freigaben mit vollständigem Zugriffsprotokoll."
    />
  );
}
