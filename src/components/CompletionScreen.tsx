// Abschluss-Overlay, wenn ein Level vollständig & fehlerfrei gelöst ist.
// Schließbar (×, Klick auf den Hintergrund, Escape), damit man den fertigen
// Schrank in Ruhe anschauen kann. Der Weg ins nächste Level bleibt danach
// über die Erfolgs-Leiste über dem Board erreichbar.
import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  message: ReactNode;
  onRestart: () => void;
  onExit: () => void;
  onDismiss: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

export function CompletionScreen({
  title,
  message,
  onRestart,
  onExit,
  onDismiss,
  onNext,
  nextLabel,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    <div className="overlay" onClick={onDismiss}>
      <div className="overlay-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="overlay-close"
          onClick={onDismiss}
          title="Schließen – Level bleibt geöffnet"
          aria-label="Schließen"
        >
          ×
        </button>

        <div className="medal">🏅</div>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="overlay-actions">
          {onNext && (
            <button className="btn-primary" onClick={onNext}>
              {nextLabel ?? 'Nächstes Level'} →
            </button>
          )}
          <button className="btn-ghost" onClick={onDismiss}>
            Schrank anschauen
          </button>
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
