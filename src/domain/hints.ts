// ---------------------------------------------------------------------------
// Adaptiver Hinweis-Mechanismus (deterministisch, ohne LLM)
//
// GEZIELTE Staffelung in zwei Dimensionen:
//  a) pro konkreter Fehlstelle (Slot + Fehlerart), nicht global vermischt –
//     die Hilfe eskaliert genau dort, wo wiederholt derselbe Fehler passiert.
//  b) inhaltlich gestuft:
//       Stufe 1  nur dezenter Anstoß ("schau dir das an") – KEINE Begründung
//       Stufe 2  konkrete fachliche Erklärung im HintPanel
//       Stufe 3  Erklärung + passendes Infofeld wird automatisch geöffnet
// ---------------------------------------------------------------------------

import type { ErrorCode, Violation } from './rules';

/** Zähler je Fehlstelle. Schlüssel = `${slotId}::${code}`. */
export type ErrorHistory = Record<string, number>;

export type HintLevel = 1 | 2 | 3;

export interface Hint {
  slotId: string;
  bmk: string;
  code: ErrorCode;
  level: HintLevel;
  /** Wie oft dieser Fehler an dieser Stelle schon auftrat. */
  count: number;
  /** Stufengerechter Text (progressiv mehr Hilfe). */
  message: string;
  /** Nur bei Stufe 3 gesetzt: dieses Infofeld soll automatisch aufgehen. */
  autoOpenInfoKey?: string;
}

export function historyKey(slotId: string, code: ErrorCode): string {
  return `${slotId}::${code}`;
}

export function emptyHistory(): ErrorHistory {
  return {};
}

/**
 * Verbucht die aktuell offenen Verletzungen je Fehlstelle.
 * "SLOT_EMPTY" wird bewusst NICHT hochgezählt – ein leerer Slot ist kein
 * wiederkehrender Denkfehler, der eskalierende Hilfe braucht.
 */
export function recordViolations(history: ErrorHistory, violations: Violation[]): ErrorHistory {
  const next = { ...history };
  for (const v of violations) {
    if (v.code === 'SLOT_EMPTY') continue;
    const k = historyKey(v.slotId, v.code);
    next[k] = (next[k] ?? 0) + 1;
  }
  return next;
}

/** Leitet aus der Häufigkeit an DIESER Fehlstelle die Stufe ab. */
export function hintLevelFor(count: number): HintLevel {
  if (count >= 3) return 3;
  if (count === 2) return 2;
  return 1;
}

/** Stufengerechter Hinweistext – progressiv mehr Hilfe. */
export function stageMessage(level: HintLevel, violation: Violation): string {
  switch (level) {
    case 1:
      // Nur Anstoß, bewusst OHNE fachliche Begründung (Lernen anregen).
      return 'Hier passt noch etwas nicht – sieh dir dieses Bauteil noch einmal an.';
    case 2:
      // Konkrete fachliche Erklärung.
      return violation.message;
    case 3:
      // Erklärung + Verweis auf das automatisch geöffnete Infofeld.
      return `${violation.message} Die ausführliche Erklärung ist rechts im Feld „Fachwissen" geöffnet.`;
  }
}

/**
 * Erzeugt für die aktuell offenen Verletzungen stufengerechte Hinweise.
 * Leere Slots bleiben ein dezenter Stufe-1-Anstoß ohne Auto-Infofeld.
 */
export function buildHints(history: ErrorHistory, violations: Violation[]): Hint[] {
  return violations.map((v) => {
    if (v.code === 'SLOT_EMPTY') {
      return {
        slotId: v.slotId,
        bmk: v.bmk,
        code: v.code,
        level: 1 as HintLevel,
        count: 0,
        message: v.message,
      };
    }
    const count = history[historyKey(v.slotId, v.code)] ?? 1;
    const level = hintLevelFor(count);
    return {
      slotId: v.slotId,
      bmk: v.bmk,
      code: v.code,
      level,
      count,
      message: stageMessage(level, v),
      autoOpenInfoKey: level === 3 ? v.infoKey : undefined,
    };
  });
}
