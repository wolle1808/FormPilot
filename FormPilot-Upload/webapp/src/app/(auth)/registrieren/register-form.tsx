"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type AuthActionState } from "../actions";
import { FormError } from "@/components/form-error";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    registerAction,
    {},
  );

  return (
    <div className="card" style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Konto erstellen</h1>
      <p className="meta" style={{ color: "var(--slate)", fontSize: 13, marginBottom: 20 }}>
        Hinterlege deine Daten einmal — FormPilot bereitet damit künftige
        Anforderungen vor. Du entscheidest bei jeder Anfrage einzeln, was geteilt wird.
      </p>

      <form action={formAction}>
        <div className="field">
          <label htmlFor="displayName">Name</label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            required
          />
          <p className="help">So sprechen wir dich in der App an.</p>
        </div>
        <div className="field">
          <label htmlFor="email">E-Mail</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <p className="help">
            An diese Adresse senden wir den Bestätigungslink.
          </p>
        </div>
        <div className="field">
          <label htmlFor="password">Passwort</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
          <p className="help">
            Mindestens {MIN_PASSWORD_LENGTH} Zeichen. Ein Satz aus mehreren
            Wörtern ist leicht zu merken und schwer zu erraten.
          </p>
        </div>
        <div className="field">
          <label htmlFor="passwordConfirm">Passwort wiederholen</label>
          <input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            required
          />
          <FormError message={state.error} />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
          {pending ? "Konto wird erstellt …" : "Konto erstellen"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 14 }}>
        <Link className="link-btn" href="/login">
          Ich habe schon ein Konto — anmelden
        </Link>
      </div>
    </div>
  );
}
