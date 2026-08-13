// ---------------------------------------------------------------------------
// SolvedBar: bleibt über dem Board stehen, sobald das Level gelöst ist und das
// Abschluss-Overlay weggeklickt wurde. Damit geht der Weg ins nächste Level
// nicht verloren, während man sich den fertigen Schrank ansieht.
// ---------------------------------------------------------------------------

interface Props {
  onNext?: () => void;
  nextLabel?: string;
  onShowSummary: () => void;
  onExit: () => void;
}

export function SolvedBar({ onNext, nextLabel, onShowSummary, onExit }: Props) {
  return (
    <div className="panel solved-bar">
      <span className="solved-badge">🏅</span>
      <p>
        <b>Level gemeistert.</b> Schau dich in Ruhe um – oder mach weiter.
      </p>
      <div className="solved-actions">
        <button className="btn-ghost" onClick={onShowSummary}>
          Abschluss anzeigen
        </button>
        {onNext ? (
          <button className="btn-primary" onClick={onNext}>
            {nextLabel ?? 'Nächstes Level'} →
          </button>
        ) : (
          <button className="btn-primary" onClick={onExit}>
            Level-Auswahl →
          </button>
        )}
      </div>
    </div>
  );
}
