/** Formularfehler — role=alert, damit Screenreader die Meldung ansagen. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="error-text" role="alert">
      {message}
    </p>
  );
}
