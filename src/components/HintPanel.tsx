// Adaptives Hinweis-Panel: zeigt die gestuften Hinweise (Stufe 1–3).
import type { Hint } from '../domain/hints';

const ICONS: Record<number, string> = { 1: '•', 2: '⚠', 3: '📖' };

export function HintPanel({ hints }: { hints: Hint[] }) {
  const real = hints.filter((h) => h.code !== 'SLOT_EMPTY');
  const emptyCount = hints.length - real.length;

  return (
    <div className="panel hints">
      <h2 className="panel-title">Hinweise</h2>

      {hints.length === 0 ? (
        <div className="hints-clean">
          <span>✓</span>
          <span>Alles fachlich korrekt – weiter so!</span>
        </div>
      ) : (
        <>
          {real.map((h) => (
            <div className={`hint hint-lvl${h.level}`} key={`${h.slotId}-${h.code}`}>
              <span className="hint-icon">{ICONS[h.level]}</span>
              <span>
                <b>{h.bmk}</b> — {h.message}
                <span className="hint-stepbar" aria-hidden>
                  <span className={`hint-step ${h.level >= 1 ? 'on' : ''}`} />
                  <span className={`hint-step ${h.level >= 2 ? 'on' : ''}`} />
                  <span className={`hint-step ${h.level >= 3 ? 'on' : ''}`} />
                </span>
              </span>
            </div>
          ))}
          {emptyCount > 0 && (
            <div className="hint hint-lvl1">
              <span className="hint-icon">•</span>
              <span>
                Noch {emptyCount} Steckplatz{emptyCount > 1 ? 'e' : ''} unbelegt.
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
