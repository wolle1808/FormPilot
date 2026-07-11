import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Anmelden" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; fehler?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      {params.fehler === "link-ungueltig" ? (
        <p className="error-text" role="alert" style={{ marginBottom: 14 }}>
          Der Link ist ungültig oder abgelaufen. Bitte melde dich an oder
          fordere einen neuen Link an.
        </p>
      ) : null}
      <LoginForm next={params.next} />
    </>
  );
}
