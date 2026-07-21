// Abschluss-Overlay, wenn ein Level vollständig & fehlerfrei gelöst ist.
import type { ReactNode } from 'react';

interface Props {
  title: string;
  message: ReactNode;
  onRestart: () => void;
  onExit: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

export function CompletionScreen({ title, message, onRestart, onExit, onNext, nextLabel }: Props) {
  return (
    <div className="overlay">
      <div className="overlay-card">
        <div className="medal">🏅</div>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="overlay-actions">
          {onNext && (
            <button className="btn-primary" onClick={onNext}>
              {nextLabel ?? 'Nächstes Level'} →
            </button>
          )}
          <button className="btn-ghost" onClick={onRestart}>
            Nochmal bauen
          </button>
          <button className="btn-ghost" onClick={onExit}>
            Level-Auswahl
          </button>
        </div>
      </div>
    </div>
  );
}
