"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthActionState } from "../actions";
import { FormError } from "@/components/form-error";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    loginAction,
    {},
  );

  return (
    <div className="card" style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Anmelden</h1>
      <p className="meta" style={{ color: "var(--slate)", fontSize: 13, marginBottom: 20 }}>
        Melde dich mit deinem FormPilot-Konto an.
      </p>

      <form action={formAction}>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <div className="field">
          <label htmlFor="email">E-Mail</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Passwort</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <FormError message={state.error} />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
          {pending ? "Wird angemeldet …" : "Anmelden"}
        </button>
      </form>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        <Link className="link-btn" href="/passwort-vergessen">
          Passwort vergessen?
        </Link>
        <Link className="link-btn" href="/registrieren">
          Konto erstellen
        </Link>
      </div>
    </div>
  );
}
