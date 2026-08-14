import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { Palette } from './components/Palette';
import { Board } from './components/Board';
import { InfoPanel } from './components/InfoPanel';
import { HintPanel } from './components/HintPanel';
import { CompletionScreen } from './components/CompletionScreen';
import { SolvedBar } from './components/SolvedBar';
import { NarrativeToast } from './components/NarrativeToast';
import { ScrollCue } from './components/ScrollCue';
import { LevelSelect } from './components/LevelSelect';
import { LoadManagementAmpel } from './components/LoadManagementAmpel';
import { buildHints } from './domain/hints';
import type { Violation } from './domain/rules';
import { validateLevel } from './domain/rules';
import type { LevelDefinition, ViewMode } from './domain/types';
import { LEVEL_LIST, nextLevel } from './levels/registry';
import { useLevelState } from './state/store';

// ---------------------------------------------------------------------------
// App: Navigation zwischen Level-Auswahl und Spielansicht + Fortschritt.
// ---------------------------------------------------------------------------

export function App() {
  const [completed, setCompleted] = useState<ReadonlySet<string>>(new Set());
  const [currentId, setCurrentId] = useState<string | null>(null);

  const markCompleted = useCallback((id: string) => {
    setCompleted((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const current = currentId ? LEVEL_LIST.find((l) => l.id === currentId) : undefined;

  if (!current) {
    return (
      <LevelSelect levels={LEVEL_LIST} completed={completed} onPick={setCurrentId} />
    );
  }

  return (
    <LevelView
      key={current.id}
      level={current}
      onExit={() => setCurrentId(null)}
      onComplete={() => markCompleted(current.id)}
      onNext={() => {
        const nxt = nextLevel(current.id);
        setCurrentId(nxt ? nxt.id : null);
      }}
      hasNext={!!nextLevel(current.id)}
    />
  );
}

// ---------------------------------------------------------------------------
// LevelView: eine spielbare Level-Instanz (durch key={level.id} frisch je Level).
// ---------------------------------------------------------------------------

interface LevelViewProps {
  level: LevelDefinition;
  onExit: () => void;
  onComplete: () => void;
  onNext: () => void;
  hasNext: boolean;
}

function LevelView({ level, onExit, onComplete, onNext, hasNext }: LevelViewProps) {
  const [state, dispatch] = useLevelState(level);
  const [view, setView] = useState<ViewMode>('game');
  const [infoKey, setInfoKey] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [ampelSolved, setAmpelSolved] = useState(false);
  // Abschluss-Overlay weggeklickt? Dann bleibt das Level offen und der Weg
  // weiter läuft über die SolvedBar.
  const [summaryDismissed, setSummaryDismissed] = useState(false);
  // Hochzählen montiert den Auftrags-Toast neu – so lässt er sich erneut zeigen.
  const [narrativeSeq, setNarrativeSeq] = useState(0);
  // Ziel für den Scroll-Hinweis auf die zweite Aufgabe (Lastmanagement).
  const ampelRef = useRef<HTMLDivElement>(null);

  const selectPaletteItem = (id: string, info: string) => {
    setSelectedItemId((prev) => (prev === id ? null : id));
    setInfoKey(info);
  };

  const handleSlotClick = (slotId: string, slotInfoKey: string) => {
    if (selectedItemId) {
      const slot = level.branches.flatMap((b) => b.slots).find((s) => s.id === slotId);
      if (slot && !slot.locked && !slot.prefilledItemId) {
        dispatch({ type: 'PLACE', slotId, itemId: selectedItemId });
        return;
      }
    }
    setInfoKey(slotInfoKey);
  };

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

  // Adaptiv: bei Stufe 3 passendes Infofeld automatisch öffnen.
  const autoOpen = hints.find((h) => h.level === 3 && h.autoOpenInfoKey)?.autoOpenInfoKey;
  useEffect(() => {
    if (autoOpen) setInfoKey(autoOpen);
  }, [autoOpen]);

  // Gesamt-Lösung: Verdrahtung korrekt UND (falls vorhanden) Lastmanagement gemeistert.
  const wiringSolved = validation.solved;
  const solved = wiringSolved && (!level.loadManagement || ampelSolved);

  // onComplete genau einmal melden.
  const reported = useRef(false);
  useEffect(() => {
    if (solved && !reported.current) {
      reported.current = true;
      onComplete();
    }
  }, [solved, onComplete]);

  return (
    <div className="app">
      <Toolbar
        level={level}
        view={view}
        progress={validation.progress}
        onView={setView}
        onExit={onExit}
        onShowNarrative={() => setNarrativeSeq((n) => n + 1)}
        onReset={() => {
          dispatch({ type: 'RESET' });
          setInfoKey(null);
          setSelectedItemId(null);
          setSummaryDismissed(false);
          reported.current = false;
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
          {solved && summaryDismissed && (
            <SolvedBar
              onNext={hasNext ? onNext : undefined}
              nextLabel="Nächstes Level"
              onShowSummary={() => setSummaryDismissed(false)}
              onExit={onExit}
            />
          )}

          <NarrativeToast key={narrativeSeq} text={level.narrative} />

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

          {level.loadManagement && (
            <div ref={ampelRef}>
              <LoadManagementAmpel
                data={level.loadManagement}
                enabled={wiringSolved}
                onSolvedChange={setAmpelSolved}
              />
            </div>
          )}
        </div>

        <aside className="sidebar">
          <InfoPanel infoKey={infoKey} />
          <HintPanel
            hints={hints}
            loadManagementNext={Boolean(level.loadManagement) && wiringSolved}
          />
        </aside>
      </main>

      <footer className="app-footer">
        Prototyp · fachlich korrekt nach Vorlage EBZ Dresden · Spiel-/Fachansicht aus
        einem gemeinsamen Datenmodell
      </footer>

      {level.loadManagement && (
        <ScrollCue targetRef={ampelRef} active={wiringSolved && !ampelSolved}>
          Schrank steht – jetzt noch das Lastmanagement einstellen
        </ScrollCue>
      )}

      {solved && !summaryDismissed && (
        <CompletionScreen
          title={
            level.id === 'zs-wp'
              ? 'Wärmepumpe smart eingebunden!'
              : 'Schrank fachgerecht aufgebaut!'
          }
          message={completionMessage(level.id)}
          onRestart={() => {
            dispatch({ type: 'RESET' });
            setInfoKey(null);
            setSelectedItemId(null);
            setAmpelSolved(false);
            setSummaryDismissed(false);
            reported.current = false;
          }}
          onDismiss={() => setSummaryDismissed(true)}
          onExit={onExit}
          onNext={hasNext ? onNext : undefined}
          nextLabel="Nächstes Level"
        />
      )}
    </div>
  );
}

function completionMessage(levelId: string): string {
  if (levelId === 'zs-wp') {
    return (
      'Der Schrank ist fachgerecht verdrahtet und die Wärmepumpe läuft über das ' +
      'SG-Ready-Schütz am Lastmanagement: Freigabe bei PV-Überschuss, Sperre in der ' +
      'Abendspitze und beim EVU-Signal. Aktive Steuerung statt nur passivem Schutz.'
    );
  }
  return (
    'Alle Verbraucher sind versorgt, der Wechselrichter-/Wallbox-Zweig ist mit RCD Typ B ' +
    'geschützt, die Endstromkreise korrekt dimensioniert und der Überspannungsschutz sitzt.'
  );
}
