import { describe, expect, it } from 'vitest';
import { ZS_PV_LEVEL } from '../levels/zs-pv';
import type { Placement } from './types';
import { allSlots, validateLevel, validateSlot } from './rules';

function slot(id: string) {
  const s = allSlots(ZS_PV_LEVEL).find((x) => x.id === id);
  if (!s) throw new Error(`Slot ${id} nicht gefunden`);
  return s;
}

/** Belegung, die das Level vollständig korrekt löst. */
const SOLUTION: Placement = {
  'slot-uss': 'uss',
  'slot-ls-wr': 'ls-k20',
  'slot-rcd-wr': 'rcd-b',
  'slot-ls-wb': 'ls-k20',
  'slot-rcd-end': 'rcd-a',
  'slot-ls-mf': 'ls-b16',
  'slot-ls-ab1': 'ls-b16',
};

describe('RCD-Typ-Regeln (Kernpuzzle)', () => {
  it('Typ A am Wechselrichter-Zweig ist ein Verstoß (glatter DC nötig -> Typ B)', () => {
    const v = validateSlot(ZS_PV_LEVEL, slot('slot-rcd-wr'), { 'slot-rcd-wr': 'rcd-a' });
    expect(v?.code).toBe('RCD_TYPE_MISSING_TYPE_B');
  });

  it('Typ B am Wechselrichter-Zweig ist korrekt', () => {
    const v = validateSlot(ZS_PV_LEVEL, slot('slot-rcd-wr'), { 'slot-rcd-wr': 'rcd-b' });
    expect(v).toBeNull();
  });

  it('Typ A an den Endstromkreisen ist korrekt', () => {
    const v = validateSlot(ZS_PV_LEVEL, slot('slot-rcd-end'), { 'slot-rcd-end': 'rcd-a' });
    expect(v).toBeNull();
  });

  it('Typ B "sicherheitshalber" an den Endstromkreisen ist NICHT die fachliche Antwort', () => {
    const v = validateSlot(ZS_PV_LEVEL, slot('slot-rcd-end'), { 'slot-rcd-end': 'rcd-b' });
    expect(v?.code).toBe('RCD_TYPE_UNNECESSARY_TYPE_B');
  });
});

describe('LS-Dimensionierung', () => {
  it('B 25 A auf 1,5 mm² ist zu groß (Leitung ungeschützt)', () => {
    const v = validateSlot(ZS_PV_LEVEL, slot('slot-ls-mf'), { 'slot-ls-mf': 'ls-b25' });
    expect(v?.code).toBe('LS_RATING_TOO_HIGH');
  });

  it('B 16 A auf 1,5 mm² Endstromkreis ist korrekt', () => {
    const v = validateSlot(ZS_PV_LEVEL, slot('slot-ls-mf'), { 'slot-ls-mf': 'ls-b16' });
    expect(v).toBeNull();
  });

  it('Falsche Charakteristik (B statt K) am Wechselrichter-Abgang wird erkannt', () => {
    const v = validateSlot(ZS_PV_LEVEL, slot('slot-ls-wr'), { 'slot-ls-wr': 'ls-b16' });
    expect(v?.code).toBe('LS_WRONG_TRIP_CHAR');
  });

  it('K 20 A am Wechselrichter-Abgang ist korrekt', () => {
    const v = validateSlot(ZS_PV_LEVEL, slot('slot-ls-wr'), { 'slot-ls-wr': 'ls-k20' });
    expect(v).toBeNull();
  });
});

describe('ÜSS-Regel', () => {
  it('Fehlender ÜSS bei Dach-/Außenleitungen ist ein Verstoß', () => {
    const v = validateSlot(ZS_PV_LEVEL, slot('slot-uss'), {});
    expect(v?.code).toBe('SLOT_EMPTY');
  });

  it('Platzierter ÜSS erfüllt die Anforderung', () => {
    const v = validateSlot(ZS_PV_LEVEL, slot('slot-uss'), { 'slot-uss': 'uss' });
    expect(v).toBeNull();
  });
});

describe('SLS ist locked', () => {
  it('Der SLS-Slot ist immer korrekt und nicht durch Belegung verletzbar', () => {
    const v = validateSlot(ZS_PV_LEVEL, slot('slot-sls'), {});
    expect(v).toBeNull();
  });
});

describe('Gesamt-Level', () => {
  it('Die Musterlösung löst das Level vollständig', () => {
    const result = validateLevel(ZS_PV_LEVEL, SOLUTION);
    expect(result.violations).toHaveLength(0);
    expect(result.solved).toBe(true);
    expect(result.progress).toBe(1);
  });

  it('Leeres Level ist nicht gelöst und hat 0 Fortschritt', () => {
    const result = validateLevel(ZS_PV_LEVEL, {});
    expect(result.solved).toBe(false);
    expect(result.progress).toBe(0);
    expect(result.violations.length).toBeGreaterThan(0);
  });
});
