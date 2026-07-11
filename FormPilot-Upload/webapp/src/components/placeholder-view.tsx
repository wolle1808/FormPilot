/**
 * Ruhiger Platzhalter für Bereiche, die in einer späteren Phase kommen.
 * Ehrlich statt leer: sagt, was der Bereich sein wird und wann er folgt.
 */
export function PlaceholderView({
  title,
  sub,
  phase,
  description,
}: {
  title: string;
  sub: string;
  phase: string;
  description: string;
}) {
  return (
    <>
      <div className="page-head">
        <h1>{title}</h1>
        <p className="page-sub">{sub}</p>
      </div>
      <div className="card empty-state">
        <h3>Dieser Bereich ist noch nicht freigeschaltet.</h3>
        <p style={{ maxWidth: 480, margin: "6px auto 0" }}>{description}</p>
        <p style={{ marginTop: 14 }}>
          <span className="badge badge-info">Geplant für {phase}</span>
        </p>
      </div>
    </>
  );
}
