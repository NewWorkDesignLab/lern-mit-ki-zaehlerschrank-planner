// ---------------------------------------------------------------------------
// NarrativeToast: der Auftrag als eingeblendete Nachricht über dem Schrank.
//
// Bewusst AUS dem Textfluss genommen (position: absolute), damit die
// Schrankansicht ganz oben steht und nicht dauerhaft nach unten gedrückt wird.
// Blendet sich nach kurzer Zeit selbst aus; ein dünner Balken zeigt, wie lange
// noch – damit das Verschwinden nicht überrascht. Wegklicken geht jederzeit.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

interface Props {
  text: string;
  /** Anzeigedauer bis zum automatischen Ausblenden. */
  durationMs?: number;
}

export function NarrativeToast({ text, durationMs = 25000 }: Props) {
  const [closing, setClosing] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setClosing(true), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  if (gone) return null;

  const style = { '--toast-ms': `${durationMs}ms` } as CSSProperties;

  return (
    <div
      className={`narrative-toast${closing ? ' closing' : ''}`}
      style={style}
      role="status"
      // Erst nach dem Ausblenden aushängen – sonst springt die Animation.
      onTransitionEnd={(e) => {
        if (closing && e.propertyName === 'opacity') setGone(true);
      }}
    >
      <span className="narrative-badge">🏘️</span>
      <p>
        <b>Auftrag:</b> {text}
      </p>
      <button
        className="narrative-close"
        onClick={() => setClosing(true)}
        title="Auftrag ausblenden"
        aria-label="Auftrag ausblenden"
      >
        ×
      </button>
      <span className="narrative-timer" />
    </div>
  );
}
