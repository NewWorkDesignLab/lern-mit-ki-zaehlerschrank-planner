import { getPart } from '../catalog/parts';
import { getTemplate } from '../catalog/templates';
import {
  canPlace,
  firstFreeSpot,
  nearestFreeTe,
  normalizeProject,
  planGroupMove,
  rangeBetween,
  retainFitting,
  suggestBmk,
} from './layout';
import { fromCompact, toCompact } from './serialize';
import type { Placement, Project } from './types';

const tpl = getTemplate('zs-2f')!;
const ls1 = getPart('abb-s201-b16')!; // 1 TE
const rcd = getPart('abb-f204a-40')!; // 4 TE
const sls = getPart('abb-sls-e35')!; // 4,5 TE
const meter = getPart('msb-zaehler')!;

// Feld 1 (Verteiler), Zone 0 = Reihe 1 mit 12 TE
const at = (uid: string, partId: string, te: number, bmk = ''): Placement => ({
  uid,
  partId,
  field: 1,
  zone: 0,
  te,
  bmk,
});

describe('canPlace', () => {
  it('erlaubt Platzierung auf freier Schiene', () => {
    expect(canPlace(tpl, [], rcd, 1, 0, 0)).toBe(true);
    expect(canPlace(tpl, [], rcd, 1, 0, 8)).toBe(true);
  });

  it('verhindert Überlauf über das Schienenende', () => {
    expect(canPlace(tpl, [], rcd, 1, 0, 8.5)).toBe(false);
    expect(canPlace(tpl, [], rcd, 1, 0, -0.5)).toBe(false);
  });

  it('verhindert Überlappung, erlaubt direktes Anreihen', () => {
    const placed = [at('a', rcd.id, 0)];
    expect(canPlace(tpl, placed, ls1, 1, 0, 3.5)).toBe(false);
    expect(canPlace(tpl, placed, ls1, 1, 0, 4)).toBe(true);
  });

  it('ignoriert das bewegte Bauteil selbst', () => {
    const placed = [at('a', rcd.id, 0)];
    expect(canPlace(tpl, placed, rcd, 1, 0, 1, 'a')).toBe(true);
  });

  it('trennt Zählerplatz und Hutschiene', () => {
    // Feld 0, Zone 1 = Zählerplatz
    expect(canPlace(tpl, [], meter, 0, 1, 0)).toBe(true);
    expect(canPlace(tpl, [], ls1, 0, 1, 0)).toBe(false);
    expect(canPlace(tpl, [], meter, 1, 0, 0)).toBe(false);
    const withMeter: Placement[] = [{ uid: 'm', partId: meter.id, field: 0, zone: 1, te: 0, bmk: '' }];
    expect(canPlace(tpl, withMeter, meter, 0, 1, 0)).toBe(false);
  });

  it('erlaubt halbe TE (SLS 4,5 TE)', () => {
    expect(canPlace(tpl, [], sls, 0, 0, 7.5)).toBe(true);
    expect(canPlace(tpl, [], sls, 0, 0, 8)).toBe(false);
  });
});

describe('nearestFreeTe / firstFreeSpot', () => {
  it('weicht auf die nächste freie Stelle aus', () => {
    const placed = [at('a', rcd.id, 0)];
    expect(nearestFreeTe(tpl, placed, ls1, 1, 0, 1)).toBe(4);
  });

  it('liefert null bei voller Schiene', () => {
    const placed = [at('a', rcd.id, 0), at('b', rcd.id, 4), at('c', rcd.id, 8)];
    expect(nearestFreeTe(tpl, placed, ls1, 1, 0, 0)).toBeNull();
  });

  it('springt bei voller Schiene in die nächste Reihe', () => {
    const placed = [at('a', rcd.id, 0), at('b', rcd.id, 4), at('c', rcd.id, 8)];
    expect(firstFreeSpot(tpl, placed, ls1, { field: 1, zone: 0, te: 8 })).toEqual({
      field: 1,
      zone: 1,
      te: 0,
    });
  });
});

describe('suggestBmk', () => {
  it('zählt je Kennbuchstabe hoch', () => {
    const placed = [at('a', rcd.id, 0, '-F1'), at('b', ls1.id, 4, '-F7'), at('c', ls1.id, 5, '-X2')];
    expect(suggestBmk(placed, ls1)).toBe('-F8');
    expect(suggestBmk([], meter)).toBe('-P1');
  });
});

describe('Vorlagenwechsel & Laden', () => {
  it('verwirft Bauteile, die in der neuen Vorlage keinen Platz haben', () => {
    const kv = getTemplate('kv-3r')!;
    const placed: Placement[] = [
      { uid: 'm', partId: meter.id, field: 0, zone: 1, te: 0, bmk: '-P1' },
      { uid: 'l', partId: ls1.id, field: 0, zone: 0, te: 0, bmk: '-F1' },
    ];
    expect(retainFitting(kv, placed).map((p) => p.uid)).toEqual(['l']);
  });

  it('normalisiert Projektdateien und filtert Unbekanntes', () => {
    const p = normalizeProject(
      {
        name: 'Test',
        templateId: 'zs-2f',
        placements: [at('a', ls1.id, 0), at('b', 'gibt-es-nicht', 2), at('c', ls1.id, 0)],
      },
      getTemplate,
    );
    expect(p.placements.map((x) => x.uid)).toEqual(['a']);
    expect(() => normalizeProject({ templateId: 'x' }, getTemplate)).toThrow();
  });
});

describe('Link-Serialisierung', () => {
  it('übersteht den Roundtrip', () => {
    const project: Project = {
      version: 1,
      name: 'Haus 3',
      templateId: 'zs-2f',
      placements: [
        { uid: 'x', partId: sls.id, field: 0, zone: 0, te: 3.5, bmk: '-F1' },
        { uid: 'y', partId: ls1.id, field: 1, zone: 2, te: 5, bmk: '-F2', note: 'Küche' },
      ],
    };
    const back = fromCompact(JSON.parse(JSON.stringify(toCompact(project))));
    expect(back.name).toBe('Haus 3');
    expect(back.placements.map(({ uid: _u, ...rest }) => rest)).toEqual(
      project.placements.map(({ uid: _u, ...rest }) => rest),
    );
  });
});

describe('planGroupMove', () => {
  const row = (uid: string, partId: string, zone: number, te: number): Placement => ({
    uid,
    partId,
    field: 1,
    zone,
    te,
    bmk: '',
  });

  it('verschiebt die Gruppe mit gleichen Abständen', () => {
    const placed = [row('a', ls1.id, 0, 0), row('b', ls1.id, 0, 3), row('c', rcd.id, 1, 0)];
    const plan = planGroupMove(tpl, placed, ['a', 'b'], { dField: 0, dRail: 2, dTe: 1 });
    expect(plan.valid).toBe(true);
    expect(plan.moves).toEqual([
      { uid: 'a', field: 1, zone: 2, te: 1 },
      { uid: 'b', field: 1, zone: 2, te: 4 },
    ]);
  });

  it('ist ungültig bei Kollision mit einem Bauteil außerhalb der Gruppe', () => {
    const placed = [row('a', ls1.id, 0, 0), row('c', rcd.id, 1, 0)];
    const plan = planGroupMove(tpl, placed, ['a'], { dField: 0, dRail: 1, dTe: 2 });
    expect(plan.valid).toBe(false);
    expect(plan.invalidUids).toEqual(['a']);
  });

  it('erlaubt Verschieben innerhalb der eigenen Gruppe (Teile machen sich gegenseitig Platz)', () => {
    const placed = [row('a', ls1.id, 0, 0), row('b', ls1.id, 0, 1)];
    expect(planGroupMove(tpl, placed, ['a', 'b'], { dField: 0, dRail: 0, dTe: 1 }).valid).toBe(true);
  });

  it('ist ungültig über das Schienenende oder die letzte Reihe hinaus', () => {
    const placed = [row('a', rcd.id, 4, 8)];
    expect(planGroupMove(tpl, placed, ['a'], { dField: 0, dRail: 0, dTe: 0.5 }).valid).toBe(false);
    expect(planGroupMove(tpl, placed, ['a'], { dField: 0, dRail: 1, dTe: 0 }).valid).toBe(false);
  });

  it('wechselt das Feld anhand der Reihennummer', () => {
    // Feld 1, Reihe 1 -> Feld 0, erste Schiene (Oberer Anschlussraum, Zone 0)
    const plan = planGroupMove(tpl, [row('a', ls1.id, 0, 2)], ['a'], { dField: -1, dRail: 0, dTe: 0 });
    expect(plan.valid).toBe(true);
    expect(plan.moves[0]).toEqual({ uid: 'a', field: 0, zone: 0, te: 2 });
  });

  it('lässt Gruppen mit Zähler nicht verschieben', () => {
    const placed: Placement[] = [
      { uid: 'm', partId: meter.id, field: 0, zone: 1, te: 0, bmk: '' },
      row('a', ls1.id, 0, 0),
    ];
    const plan = planGroupMove(tpl, placed, ['m', 'a'], { dField: 0, dRail: 0, dTe: 1 });
    expect(plan.valid).toBe(false);
    expect(plan.hasMeter).toBe(true);
  });
});

describe('rangeBetween', () => {
  const p = (uid: string, field: number, zone: number, te: number): Placement => ({
    uid,
    partId: ls1.id,
    field,
    zone,
    te,
    bmk: '',
  });
  // Absichtlich ungeordnet gespeichert
  const placed = [
    p('r2b', 1, 1, 5),
    p('r1a', 1, 0, 0),
    p('r1c', 1, 0, 8),
    p('r1b', 1, 0, 3),
    p('r2a', 1, 1, 0),
    p('f0', 0, 0, 2),
  ];

  it('wählt alle Bauteile einer Reihe zwischen links und rechts', () => {
    expect(rangeBetween(placed, 'r1a', 'r1c')).toEqual(['r1a', 'r1b', 'r1c']);
  });

  it('funktioniert genauso von rechts nach links', () => {
    expect(rangeBetween(placed, 'r1c', 'r1a')).toEqual(['r1a', 'r1b', 'r1c']);
  });

  it('läuft über Reihen hinweg in Lesereihenfolge', () => {
    expect(rangeBetween(placed, 'r1b', 'r2a')).toEqual(['r1b', 'r1c', 'r2a']);
  });

  it('läuft über Felder hinweg', () => {
    expect(rangeBetween(placed, 'f0', 'r1b')).toEqual(['f0', 'r1a', 'r1b']);
  });

  it('liefert nur das Ziel, wenn der Anker fehlt', () => {
    expect(rangeBetween(placed, 'weg', 'r2b')).toEqual(['r2b']);
    expect(rangeBetween(placed, 'r1a', 'r1a')).toEqual(['r1a']);
  });
});
