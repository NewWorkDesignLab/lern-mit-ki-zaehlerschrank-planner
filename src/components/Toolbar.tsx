// Kopfzeile: Marke, Level, Fortschritt, Dual-View-Toggle, Reset.
import type { LevelDefinition, ViewMode } from '../domain/types';

interface Props {
  level: LevelDefinition;
  view: ViewMode;
  progress: number;
  onView: (v: ViewMode) => void;
  onReset: () => void;
}

export function Toolbar({ level, view, progress, onView, onReset }: Props) {
  const pct = Math.round(progress * 100);
  return (
    <header className="toolbar">
      <div className="brand">
        <div className="brand-mark">⚡</div>
        <div className="brand-text">
          <b>Lern mit KI</b>
          <span>Zählerschrank-Trainer</span>
        </div>
      </div>

      <div className="toolbar-level">
        <b>{level.title}</b>
        <span>{level.subtitle}</span>
      </div>

      <div className="toolbar-spacer" />

      <div className="progress">
        <div className="progress-head">
          <span>Aufbau-Fortschritt</span>
          <span>{pct}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="toggle" role="tablist" aria-label="Ansicht wählen">
        <button
          className={view === 'game' ? 'active' : ''}
          onClick={() => onView('game')}
          role="tab"
          aria-selected={view === 'game'}
        >
          🎮 Spielansicht
        </button>
        <button
          className={view === 'schematic' ? 'active' : ''}
          onClick={() => onView('schematic')}
          role="tab"
          aria-selected={view === 'schematic'}
        >
          📐 Fachansicht
        </button>
      </div>

      <button className="btn-ghost" onClick={onReset}>
        Zurücksetzen
      </button>
    </header>
  );
}
