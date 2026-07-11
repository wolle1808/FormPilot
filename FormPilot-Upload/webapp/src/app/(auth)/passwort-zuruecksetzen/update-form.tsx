"use client";

import { useActionState } from "react";
import { updatePasswordAction, type AuthActionState } from "../actions";
import { FormError } from "@/components/form-error";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation";

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    updatePasswordAction,
    {},
  );

  return (
    <div className="card" style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Neues Passwort festlegen</h1>
      <p className="meta" style={{ color: "var(--slate)", fontSize: 13, marginBottom: 20 }}>
        Wähle ein neues Passwort für dein Konto. Danach bist du direkt angemeldet.
      </p>
      <form action={formAction}>
        <div className="field">
          <label htmlFor="password">Neues Passwort</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
          <p className="help">Mindestens {MIN_PASSWORD_LENGTH} Zeichen.</p>
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
          {pending ? "Wird gespeichert …" : "Passwort speichern"}
        </button>
      </form>
    </div>
  );
}
