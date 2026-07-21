// Abschluss-Overlay, wenn der Schrank vollständig & fehlerfrei aufgebaut ist.
export function CompletionScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="overlay">
      <div className="overlay-card">
        <div className="medal">🏅</div>
        <h2>Schrank fachgerecht aufgebaut!</h2>
        <p>
          Alle Verbraucher sind versorgt, der Wechselrichter-/Wallbox-Zweig ist mit
          <b> RCD Typ B</b> geschützt, die Endstromkreise korrekt dimensioniert und der
          Überspannungsschutz sitzt. Der Prosumer-Anschluss ist betriebsbereit.
        </p>
        <button className="btn-primary" onClick={onRestart}>
          Nochmal bauen
        </button>
      </div>
    </div>
  );
}
