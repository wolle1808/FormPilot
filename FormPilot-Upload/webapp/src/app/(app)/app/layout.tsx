import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav, MobileHeader, Sidebar } from "@/components/navigation";

/**
 * Geschützter App-Rahmen: Seitenleiste (Desktop) + Bottom-Nav (Mobil).
 * Die Middleware schützt /app bereits — dieser Check ist die zweite
 * Verteidigungslinie und liefert zugleich die Nutzerdaten für die Shell.
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/app");
  }

  return (
    <>
      <Sidebar userEmail={user.email ?? ""} />
      <MobileHeader />
      <main className="app-main">
        <div className="content">{children}</div>
      </main>
      <BottomNav />
    </>
  );
}
