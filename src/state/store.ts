// ---------------------------------------------------------------------------
// Zustandsverwaltung: ein Reducer hält die "domänennahe" State (Belegung +
// adaptive Fehlerhistorie). UI-State (Ansicht, geöffnetes Infofeld) liegt
// bewusst in der App-Komponente. Nur In-Memory pro Sitzung (keine Persistenz).
// ---------------------------------------------------------------------------

import { useReducer } from 'react';
import type { ErrorHistory } from '../domain/hints';
import { emptyHistory } from '../domain/hints';
import { validateSlot } from '../domain/rules';
import type { LevelDefinition, Placement } from '../domain/types';
import { allSlots } from '../domain/rules';

export interface LevelState {
  placement: Placement;
  history: ErrorHistory;
}

export type Action =
  | { type: 'PLACE'; slotId: string; itemId: string }
  | { type: 'CLEAR_SLOT'; slotId: string }
  | { type: 'RESET' };

export function initState(): LevelState {
  return { placement: {}, history: emptyHistory() };
}

function findSlot(level: LevelDefinition, slotId: string) {
  return allSlots(level).find((s) => s.id === slotId);
}

export function makeReducer(level: LevelDefinition) {
  return function reducer(state: LevelState, action: Action): LevelState {
    switch (action.type) {
      case 'PLACE': {
        const slot = findSlot(level, action.slotId);
        if (!slot || slot.locked || slot.prefilledItemId) return state;

        const placement: Placement = { ...state.placement, [action.slotId]: action.itemId };

        // Adaptive Historie: eine falsche Platzierung zählt einmal.
        // Leere Slots sind kein "Denkfehler" und werden nicht gezählt.
        const violation = validateSlot(level, slot, placement);
        let history = state.history;
        if (violation && violation.code !== 'SLOT_EMPTY') {
          history = { ...history, [violation.code]: (history[violation.code] ?? 0) + 1 };
        }
        return { placement, history };
      }
      case 'CLEAR_SLOT': {
        const slot = findSlot(level, action.slotId);
        if (!slot || slot.locked || slot.prefilledItemId) return state;
        const placement = { ...state.placement, [action.slotId]: null };
        return { ...state, placement };
      }
      case 'RESET':
        return initState();
      default:
        return state;
    }
  };
}

export function useLevelState(level: LevelDefinition) {
  return useReducer(makeReducer(level), undefined, initState);
}
