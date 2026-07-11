import type { Metadata } from "next";
import { PlaceholderView } from "@/components/placeholder-view";

export const metadata: Metadata = { title: "Vorgänge" };

export default function CasesPage() {
  return (
    <PlaceholderView
      title="Deine Vorgänge"
      sub="Jede Anforderung als Vorgang — mit Checkliste, Frist und Verlauf."
      phase="Phase 3"
      description="Hier fügst du künftig den Text einer Anforderung ein — FormPilot erkennt, welche Angaben und Dokumente benötigt werden."
    />
  );
}
