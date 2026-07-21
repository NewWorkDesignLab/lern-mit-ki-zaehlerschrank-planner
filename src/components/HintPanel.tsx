// Adaptives Hinweis-Panel: zeigt die gestuften Hinweise (Stufe 1–3).
// Stufe 1 = dezenter Anstoß · Stufe 2 = fachliche Erklärung · Stufe 3 = + Infofeld.
import type { Hint } from '../domain/hints';

const STAGE: Record<number, { icon: string; label: string }> = {
  1: { icon: '•', label: 'Anstoß' },
  2: { icon: '⚠', label: 'Erklärung' },
  3: { icon: '📖', label: 'Infofeld geöffnet' },
};

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
          {real.map((h) => {
            const stage = STAGE[h.level];
            return (
              <div className={`hint hint-lvl${h.level}`} key={`${h.slotId}-${h.code}`}>
                <span className="hint-icon">{stage.icon}</span>
                <span className="hint-body">
                  <span className="hint-head">
                    <b>{h.bmk}</b>
                    <span className="hint-stage">
                      Hilfe {h.level}/3 · {stage.label}
                    </span>
                  </span>
                  {h.message}
                  <span className="hint-stepbar" aria-hidden>
                    <span className={`hint-step ${h.level >= 1 ? 'on' : ''}`} />
                    <span className={`hint-step ${h.level >= 2 ? 'on' : ''}`} />
                    <span className={`hint-step ${h.level >= 3 ? 'on' : ''}`} />
                  </span>
                </span>
              </div>
            );
          })}
          {emptyCount > 0 && (
            <div className="hint hint-lvl1">
              <span className="hint-icon">•</span>
              <span className="hint-body">
                Noch {emptyCount} Steckplatz{emptyCount > 1 ? 'e' : ''} unbelegt.
              </span>
            </div>
          )}
        </>
      )}

      <p className="hints-legend">
        Die Hilfe staffelt sich gezielt: Bleibt derselbe Fehler an derselben Stelle,
        wird von Anstoß über Erklärung bis zum automatisch geöffneten Infofeld
        eskaliert.
      </p>
    </div>
  );
}
