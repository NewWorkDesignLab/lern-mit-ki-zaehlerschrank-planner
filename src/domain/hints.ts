// ---------------------------------------------------------------------------
// Adaptiver Hinweis-Mechanismus (deterministisch, ohne LLM)
// Zählt wiederkehrende Fehlercodes und eskaliert die Unterstützung in Stufen:
//   1. nur visuelle Markierung        (am Bauteil, kein Text)
//   2. kurzer Erklärtext              (im HintPanel)
//   3. passendes Infofeld automatisch öffnen
// ---------------------------------------------------------------------------

import type { ErrorCode, Violation } from './rules';

/** Zählt, wie oft ein bestimmter Fehlercode bereits aufgetreten ist. */
export type ErrorHistory = Record<ErrorCode, number>;

export type HintLevel = 1 | 2 | 3;

export interface Hint {
  slotId: string;
  bmk: string;
  code: ErrorCode;
  level: HintLevel;
  message: string;
  /** Nur bei Stufe 3 gesetzt: dieses Infofeld soll automatisch aufgehen. */
  autoOpenInfoKey?: string;
}

export function emptyHistory(): ErrorHistory {
  return {
    RCD_TYPE_MISSING_TYPE_B: 0,
    RCD_TYPE_UNNECESSARY_TYPE_B: 0,
    LS_RATING_TOO_HIGH: 0,
    LS_RATING_TOO_LOW: 0,
    LS_WRONG_TRIP_CHAR: 0,
    USS_MISSING: 0,
    WRONG_COMPONENT_KIND: 0,
    SLOT_EMPTY: 0,
  };
}

/**
 * Verbucht die aktuell offenen Verletzungen in der Historie.
 * "SLOT_EMPTY" wird bewusst NICHT hochgezählt – ein leerer Slot ist kein
 * Denkfehler, der eskalierende Hilfe braucht.
 */
export function recordViolations(history: ErrorHistory, violations: Violation[]): ErrorHistory {
  const next = { ...history };
  for (const v of violations) {
    if (v.code === 'SLOT_EMPTY') continue;
    next[v.code] = (next[v.code] ?? 0) + 1;
  }
  return next;
}

/** Leitet aus Häufigkeit die Eskalationsstufe ab. */
export function hintLevelFor(count: number): HintLevel {
  if (count >= 3) return 3;
  if (count === 2) return 2;
  return 1;
}

/**
 * Erzeugt für die aktuell offenen Verletzungen passende Hinweise auf Basis
 * der Fehlerhistorie. Leere Slots liefern nur eine dezente Stufe-1-Markierung.
 */
export function buildHints(history: ErrorHistory, violations: Violation[]): Hint[] {
  return violations.map((v) => {
    if (v.code === 'SLOT_EMPTY') {
      return { slotId: v.slotId, bmk: v.bmk, code: v.code, level: 1, message: v.message };
    }
    const level = hintLevelFor(history[v.code] ?? 1);
    return {
      slotId: v.slotId,
      bmk: v.bmk,
      code: v.code,
      level,
      message: v.message,
      autoOpenInfoKey: level === 3 ? v.infoKey : undefined,
    };
  });
}
