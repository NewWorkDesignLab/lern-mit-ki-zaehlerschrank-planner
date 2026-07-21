import { describe, expect, it } from 'vitest';
import type { Violation } from './rules';
import { buildHints, emptyHistory, hintLevelFor, recordViolations } from './hints';

const rcdViolation: Violation = {
  slotId: 'slot-rcd-wr',
  bmk: '+ZS2-F3',
  code: 'RCD_TYPE_MISSING_TYPE_B',
  message: 'Typ A erkennt glatte Gleichfehlerströme nicht.',
  infoKey: 'rcd-type-b',
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

describe('Fehlerhistorie', () => {
  it('zählt wiederkehrende Fehlercodes hoch', () => {
    let h = emptyHistory();
    h = recordViolations(h, [rcdViolation]);
    h = recordViolations(h, [rcdViolation]);
    expect(h.RCD_TYPE_MISSING_TYPE_B).toBe(2);
  });

  it('leere Slots werden NICHT als Denkfehler hochgezählt', () => {
    let h = emptyHistory();
    h = recordViolations(h, [emptyViolation]);
    h = recordViolations(h, [emptyViolation]);
    expect(h.SLOT_EMPTY).toBe(0);
  });
});

describe('Hinweis-Erzeugung', () => {
  it('öffnet bei Stufe 3 automatisch das passende Infofeld', () => {
    let h = emptyHistory();
    h = recordViolations(h, [rcdViolation]);
    h = recordViolations(h, [rcdViolation]);
    h = recordViolations(h, [rcdViolation]);
    const hints = buildHints(h, [rcdViolation]);
    expect(hints[0].level).toBe(3);
    expect(hints[0].autoOpenInfoKey).toBe('rcd-type-b');
  });

  it('öffnet bei Stufe 1 KEIN Infofeld automatisch', () => {
    const h = recordViolations(emptyHistory(), [rcdViolation]);
    const hints = buildHints(h, [rcdViolation]);
    expect(hints[0].level).toBe(1);
    expect(hints[0].autoOpenInfoKey).toBeUndefined();
  });

  it('leerer Slot bleibt dezente Stufe 1 ohne Auto-Infofeld', () => {
    const hints = buildHints(emptyHistory(), [emptyViolation]);
    expect(hints[0].level).toBe(1);
    expect(hints[0].autoOpenInfoKey).toBeUndefined();
  });
});
