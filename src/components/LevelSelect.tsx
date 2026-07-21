// ---------------------------------------------------------------------------
// Level-Auswahl mit Progression/Freischaltung.
// Level 1 ist immer offen; Level 2 wird nach Abschluss von Level 1 freigeschaltet.
// ---------------------------------------------------------------------------

import type { LevelDefinition } from '../domain/types';
import { isUnlocked } from '../levels/registry';

interface Props {
  levels: LevelDefinition[];
  completed: ReadonlySet<string>;
  onPick: (levelId: string) => void;
}

export function LevelSelect({ levels, completed, onPick }: Props) {
  return (
    <div className="levelselect">
      <div className="ls-hero">
        <div className="brand-mark ls-mark">⚡</div>
        <h1>Lern mit KI · Zählerschrank-Trainer</h1>
        <p>
          Baue Zählerschränke für Erzeugeranlagen fachgerecht auf – vom PV-Prosumer bis
          zur smart eingebundenen Wärmepumpe. Wähle ein Level:
        </p>
      </div>

      <div className="ls-grid">
        {levels.map((level) => {
          const unlocked = isUnlocked(level.id, completed);
          const done = completed.has(level.id);
          return (
            <button
              key={level.id}
              className={`ls-card ${unlocked ? '' : 'locked'} ${done ? 'done' : ''}`}
              disabled={!unlocked}
              onClick={() => unlocked && onPick(level.id)}
            >
              <div className="ls-card-top">
                <span className="ls-icon">{unlocked ? level.icon : '🔒'}</span>
                <span className="ls-order">Level {level.order}</span>
                {done && <span className="ls-done-badge">✓ gemeistert</span>}
              </div>
              <h2>{level.title}</h2>
              <p className="ls-concept">{level.concept}</p>
              <p className="ls-sub">{level.subtitle}</p>
              {!unlocked && (
                <p className="ls-hint">Schließe das vorherige Level ab, um freizuschalten.</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
