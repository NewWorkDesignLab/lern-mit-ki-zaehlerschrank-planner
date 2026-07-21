import { useEffect, useMemo, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { Palette } from './components/Palette';
import { Board } from './components/Board';
import { InfoPanel } from './components/InfoPanel';
import { HintPanel } from './components/HintPanel';
import { CompletionScreen } from './components/CompletionScreen';
import { buildHints } from './domain/hints';
import type { Violation } from './domain/rules';
import { validateLevel } from './domain/rules';
import type { ViewMode } from './domain/types';
import { ZS_PV_LEVEL } from './levels/zs-pv';
import { useLevelState } from './state/store';

export function App() {
  const level = ZS_PV_LEVEL;
  const [state, dispatch] = useLevelState(level);
  const [view, setView] = useState<ViewMode>('game');
  const [infoKey, setInfoKey] = useState<string | null>(null);
  // Klick-zum-Platzieren: aktuell in der Palette gewähltes Bauteil.
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectPaletteItem = (id: string, info: string) => {
    setSelectedItemId((prev) => (prev === id ? null : id));
    setInfoKey(info);
  };

  const handleSlotClick = (slotId: string, slotInfoKey: string) => {
    // Ist ein Bauteil gewählt und der Slot frei/passend? -> platzieren.
    if (selectedItemId) {
      const slot = level.branches.flatMap((b) => b.slots).find((s) => s.id === slotId);
      if (slot && !slot.locked && !slot.prefilledItemId) {
        dispatch({ type: 'PLACE', slotId, itemId: selectedItemId });
        return;
      }
    }
    setInfoKey(slotInfoKey);
  };

  // Zentrale Validierung – speist Board-Status, Fortschritt und Hinweise.
  const validation = useMemo(
    () => validateLevel(level, state.placement),
    [level, state.placement],
  );

  const violationBySlot = useMemo(() => {
    const map: Record<string, Violation> = {};
    for (const v of validation.violations) map[v.slotId] = v;
    return map;
  }, [validation.violations]);

  const hints = useMemo(
    () => buildHints(state.history, validation.violations),
    [state.history, validation.violations],
  );

  // Adaptiv: bei Stufe 3 (wiederholter Fehler) passendes Infofeld automatisch öffnen.
  const autoOpen = hints.find((h) => h.level === 3 && h.autoOpenInfoKey)?.autoOpenInfoKey;
  useEffect(() => {
    if (autoOpen) setInfoKey(autoOpen);
  }, [autoOpen]);

  return (
    <div className="app">
      <Toolbar
        level={level}
        view={view}
        progress={validation.progress}
        onView={setView}
        onReset={() => {
          dispatch({ type: 'RESET' });
          setInfoKey(null);
        }}
      />

      <main className="app-main">
        <Palette
          level={level}
          view={view}
          selectedItemId={selectedItemId}
          onSelect={selectPaletteItem}
        />

        <div className="board-wrap">
          <div className="panel narrative">
            <span className="narrative-badge">🏘️</span>
            <p>
              <b>Auftrag:</b> {level.narrative}
            </p>
          </div>

          <Board
            level={level}
            view={view}
            placement={state.placement}
            violationBySlot={violationBySlot}
            selecting={selectedItemId !== null}
            onPlace={(slotId, itemId) => dispatch({ type: 'PLACE', slotId, itemId })}
            onClear={(slotId) => dispatch({ type: 'CLEAR_SLOT', slotId })}
            onSlotClick={handleSlotClick}
            onInfo={setInfoKey}
          />
        </div>

        <aside className="sidebar">
          <InfoPanel infoKey={infoKey} />
          <HintPanel hints={hints} />
        </aside>
      </main>

      <footer className="app-footer">
        Prototyp · fachlich korrekt nach Vorlage EBZ Dresden (ZS-PV) · Spiel-/Fachansicht
        aus einem gemeinsamen Datenmodell
      </footer>

      {validation.solved && (
        <CompletionScreen
          onRestart={() => {
            dispatch({ type: 'RESET' });
            setInfoKey(null);
          }}
        />
      )}
    </div>
  );
}
