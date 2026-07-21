import { describe, expect, it } from 'vitest';
import type { Violation } from './rules';
import {
  buildHints,
  emptyHistory,
  hintLevelFor,
  historyKey,
  recordViolations,
} from './hints';

const rcdViolation: Violation = {
  slotId: 'slot-rcd-wr',
  bmk: '+ZS2-F3',
  code: 'RCD_TYPE_MISSING_TYPE_B',
  message: 'Typ A erkennt glatte Gleichfehlerströme nicht.',
  infoKey: 'rcd-type-b',
};

// Gleiche Fehlerart, aber andere Fehlstelle (anderer Slot).
const rcdViolationOtherSlot: Violation = {
  ...rcdViolation,
  slotId: 'slot-rcd-end',
  bmk: '+ZS2-F5',
};

const emptyViolation: Violation = {
  slotId: 'slot-uss',
  bmk: '+ZS2-E1',
  code: 'SLOT_EMPTY',
  message: 'Hier fehlt noch ein Betriebsmittel.',
  infoKey: 'uss',
};

describe('Eskalationsstufen', () => {
  it('1x Fehler -> Stufe 1', () => expect(hintLevelFor(1)).toBe(1));
  it('2x Fehler -> Stufe 2', () => expect(hintLevelFor(2)).toBe(2));
  it('3x Fehler -> Stufe 3', () => expect(hintLevelFor(3)).toBe(3));
  it('5x Fehler bleibt Stufe 3', () => expect(hintLevelFor(5)).toBe(3));
});

describe('Fehlerhistorie je Fehlstelle', () => {
  it('zählt wiederkehrende Fehler an derselben Stelle hoch', () => {
    let h = emptyHistory();
    h = recordViolations(h, [rcdViolation]);
    h = recordViolations(h, [rcdViolation]);
    expect(h[historyKey('slot-rcd-wr', 'RCD_TYPE_MISSING_TYPE_B')]).toBe(2);
  });

  it('zählt GEZIELT pro Fehlstelle – gleicher Fehler an anderem Slot vermischt nicht', () => {
    let h = emptyHistory();
    h = recordViolations(h, [rcdViolation]);
    h = recordViolations(h, [rcdViolation]);
    h = recordViolations(h, [rcdViolationOtherSlot]);
    expect(h[historyKey('slot-rcd-wr', 'RCD_TYPE_MISSING_TYPE_B')]).toBe(2);
    expect(h[historyKey('slot-rcd-end', 'RCD_TYPE_MISSING_TYPE_B')]).toBe(1);
  });

  it('leere Slots werden NICHT hochgezählt', () => {
    let h = emptyHistory();
    h = recordViolations(h, [emptyViolation]);
    h = recordViolations(h, [emptyViolation]);
    expect(h[historyKey('slot-uss', 'SLOT_EMPTY')]).toBeUndefined();
  });
});

describe('Stufengerechte Hinweistexte', () => {
  it('Stufe 1 gibt nur einen Anstoß OHNE fachliche Begründung', () => {
    const h = recordViolations(emptyHistory(), [rcdViolation]);
    const [hint] = buildHints(h, [rcdViolation]);
    expect(hint.level).toBe(1);
    expect(hint.message).not.toContain('Gleichfehlerströme');
    expect(hint.autoOpenInfoKey).toBeUndefined();
  });

  it('Stufe 2 liefert die konkrete fachliche Erklärung', () => {
    let h = recordViolations(emptyHistory(), [rcdViolation]);
    h = recordViolations(h, [rcdViolation]);
    const [hint] = buildHints(h, [rcdViolation]);
    expect(hint.level).toBe(2);
    expect(hint.message).toContain('Gleichfehlerströme');
    expect(hint.autoOpenInfoKey).toBeUndefined();
  });

  it('Stufe 3 öffnet zusätzlich das passende Infofeld automatisch', () => {
    let h = emptyHistory();
    h = recordViolations(h, [rcdViolation]);
    h = recordViolations(h, [rcdViolation]);
    h = recordViolations(h, [rcdViolation]);
    const [hint] = buildHints(h, [rcdViolation]);
    expect(hint.level).toBe(3);
    expect(hint.autoOpenInfoKey).toBe('rcd-type-b');
  });

  it('leerer Slot bleibt dezente Stufe 1 ohne Auto-Infofeld', () => {
    const hints = buildHints(emptyHistory(), [emptyViolation]);
    expect(hints[0].level).toBe(1);
    expect(hints[0].autoOpenInfoKey).toBeUndefined();
  });
});
