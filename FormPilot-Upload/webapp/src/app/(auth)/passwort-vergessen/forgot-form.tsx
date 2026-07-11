"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordResetAction, type AuthActionState } from "../actions";
import { FormError } from "@/components/form-error";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    requestPasswordResetAction,
    {},
  );

  if (state.ok) {
    return (
      <div className="card" style={{ padding: 28 }}>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>E-Mail ist unterwegs.</h1>
        <p>
          Wenn ein Konto mit dieser Adresse existiert, erhältst du in den
          nächsten Minuten einen Link zum Zurücksetzen des Passworts. Der Link
          ist eine Stunde gültig.
        </p>
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <Link className="link-btn" href="/login">
            Zur Anmeldung
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Passwort zurücksetzen</h1>
      <p className="meta" style={{ color: "var(--slate)", fontSize: 13, marginBottom: 20 }}>
        Gib deine E-Mail-Adresse ein — wir senden dir einen Link zum
        Zurücksetzen.
      </p>
      <form action={formAction}>
        <div className="field">
          <label htmlFor="email">E-Mail</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <FormError message={state.error} />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
          {pending ? "Wird gesendet …" : "Link senden"}
        </button>
      </form>
      <div style={{ textAlign: "center", marginTop: 14 }}>
        <Link className="link-btn" href="/login">
          Zurück zur Anmeldung
        </Link>
      </div>
    </div>
  );
}
