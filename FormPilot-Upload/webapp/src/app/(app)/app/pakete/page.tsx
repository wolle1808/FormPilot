import type { Metadata } from "next";
import { PlaceholderView } from "@/components/placeholder-view";

export const metadata: Metadata = { title: "Pakete" };

export default function PackagesPage() {
  return (
    <PlaceholderView
      title="Dokumentenpakete"
      sub="Einmal zusammengestellt, gezielt freigegeben."
      phase="Phase 3"
      description="Hier bündelst du künftig Dokumente und Angaben zu wiederverwendbaren Paketen — zum Beispiel für Bewerbungen oder den Arbeitsbeginn."
    />
  );
}
