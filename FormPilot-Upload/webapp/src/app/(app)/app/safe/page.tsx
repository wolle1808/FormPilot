import type { Metadata } from "next";
import { PlaceholderView } from "@/components/placeholder-view";

export const metadata: Metadata = { title: "Dokumentensafe" };

export default function SafePage() {
  return (
    <PlaceholderView
      title="Dein Dokumentensafe"
      sub="Sicher verwahrt. Alle Nachweise an einem Ort, geordnet und auffindbar."
      phase="Phase 2"
      description="Hier lädst du künftig Ausweise, Bescheinigungen und Nachweise hoch — mit Gültigkeitsdaten, Versionen und Kategorien."
    />
  );
}
