// ---------------------------------------------------------------------------
// Belegungslogik: Was passt wohin? Reine Funktionen, ohne React.
// Positionen auf der Hutschiene rasten in halben TE ein.
// ---------------------------------------------------------------------------

import { CATEGORY_LETTER, getPart } from '../catalog/parts';
import type { CabinetTemplate, CatalogPart, Placement, Project, Zone } from './types';

export const SNAP_TE = 0.5;
const EPS = 1e-6;

export function snapTe(te: number): number {
  return Math.round(te / SNAP_TE) * SNAP_TE;
}

export function getZone(template: CabinetTemplate, field: number, zone: number): Zone | undefined {
  return template.fields[field]?.zones[zone];
}

/** Belegte Bereiche [start, end) einer Schiene. */
export function occupiedRanges(
  placements: Placement[],
  field: number,
  zone: number,
  excludeUid?: string,
): { start: number; end: number; uid: string }[] {
  return placements
    .filter((p) => p.field === field && p.zone === zone && p.uid !== excludeUid)
    .map((p) => ({ start: p.te, end: p.te + (getPart(p.partId)?.widthTE ?? 0), uid: p.uid }))
    .sort((a, b) => a.start - b.start);
}

export function usedTe(placements: Placement[], field: number, zone: number): number {
  return occupiedRanges(placements, field, zone).reduce((s, r) => s + (r.end - r.start), 0);
}

/** Darf `part` an (field, zone, te) sitzen? */
export function canPlace(
  template: CabinetTemplate,
  placements: Placement[],
  part: CatalogPart,
  field: number,
  zone: number,
  te: number,
  excludeUid?: string,
): boolean {
  const z = getZone(template, field, zone);
  if (!z) return false;

  if (z.kind === 'meter') {
    return (
      part.mount === 'meter' &&
      !placements.some((p) => p.field === field && p.zone === zone && p.uid !== excludeUid)
    );
  }
  if (z.kind !== 'rail' || part.mount !== 'rail') return false;

  const start = te;
  const end = te + part.widthTE;
  if (start < -EPS || end > z.te + EPS) return false;
  return occupiedRanges(placements, field, zone, excludeUid).every(
    (r) => end <= r.start + EPS || start >= r.end - EPS,
  );
}

/**
 * Nächstgelegene freie Position auf einer Schiene zu `preferredTe`
 * (oder null, wenn das Bauteil dort nirgends hinpasst).
 */
export function nearestFreeTe(
  template: CabinetTemplate,
  placements: Placement[],
  part: CatalogPart,
  field: number,
  zone: number,
  preferredTe: number,
  excludeUid?: string,
): number | null {
  const z = getZone(template, field, zone);
  if (!z) return null;
  if (z.kind === 'meter') {
    return canPlace(template, placements, part, field, zone, 0, excludeUid) ? 0 : null;
  }
  if (z.kind !== 'rail') return null;

  let best: number | null = null;
  for (let te = 0; te + part.widthTE <= z.te + EPS; te += SNAP_TE) {
    if (!canPlace(template, placements, part, field, zone, te, excludeUid)) continue;
    if (best === null || Math.abs(te - preferredTe) < Math.abs(best - preferredTe)) best = te;
  }
  return best;
}

/** Erste freie Stelle im ganzen Schrank (für "Duplizieren"). */
export function firstFreeSpot(
  template: CabinetTemplate,
  placements: Placement[],
  part: CatalogPart,
  after?: { field: number; zone: number; te: number },
): { field: number; zone: number; te: number } | null {
  const spots: { field: number; zone: number }[] = [];
  template.fields.forEach((f, fi) => f.zones.forEach((_, zi) => spots.push({ field: fi, zone: zi })));
  // Erst ab der Ausgangsschiene suchen, dann von vorne.
  const startIdx = after
    ? Math.max(0, spots.findIndex((s) => s.field === after.field && s.zone === after.zone))
    : 0;
  const ordered = [...spots.slice(startIdx), ...spots.slice(0, startIdx)];
  for (const s of ordered) {
    const pref = after && s.field === after.field && s.zone === after.zone ? after.te : 0;
    const te = nearestFreeTe(template, placements, part, s.field, s.zone, pref);
    if (te !== null) return { ...s, te };
  }
  return null;
}

// --- Mehrfachauswahl ----------------------------------------------------------

/** Zone-Indizes der Hutschienen eines Feldes, von oben nach unten. */
export function railZones(template: CabinetTemplate, field: number): number[] {
  const zones = template.fields[field]?.zones ?? [];
  return zones.flatMap((z, i) => (z.kind === 'rail' ? [i] : []));
}

/** Versatz einer Gruppe: Felder nach rechts, Schienen nach unten (je Feld gezählt), TE. */
export interface GroupOffset {
  dField: number;
  dRail: number;
  dTe: number;
}

export interface GroupMove {
  uid: string;
  field: number;
  zone: number;
  te: number;
}

export interface GroupPlan {
  moves: GroupMove[];
  valid: boolean;
  /** Bauteile, die am Ziel nicht passen (für rote Vorschau). */
  invalidUids: string[];
  /** Gruppe enthält einen Zähler – nur einzeln verschiebbar. */
  hasMeter: boolean;
}

/**
 * Verschiebt alle `uids` als Block um denselben Versatz – Abstände bleiben gleich.
 * Gültig nur, wenn jedes Bauteil am Ziel passt (gegen die übrigen Bauteile
 * und gegen die bereits geplanten Positionen der Gruppe).
 */
export function planGroupMove(
  template: CabinetTemplate,
  placements: Placement[],
  uids: string[],
  offset: GroupOffset,
): GroupPlan {
  const set = new Set(uids);
  const group = placements.filter((p) => set.has(p.uid));
  const placed: Placement[] = placements.filter((p) => !set.has(p.uid));
  const moves: GroupMove[] = [];
  const invalidUids: string[] = [];
  let hasMeter = false;

  for (const p of group) {
    const part = getPart(p.partId);
    const railIdx = railZones(template, p.field).indexOf(p.zone);
    if (!part || railIdx < 0) {
      hasMeter = hasMeter || part?.mount === 'meter';
      invalidUids.push(p.uid);
      moves.push({ uid: p.uid, field: p.field, zone: p.zone, te: p.te });
      continue;
    }
    const field = p.field + offset.dField;
    const zone = railZones(template, field)[railIdx + offset.dRail] ?? -1;
    const te = snapTe(p.te + offset.dTe);
    const move = { uid: p.uid, field, zone, te };
    moves.push(move);
    if (canPlace(template, placed, part, field, zone, te)) {
      placed.push({ ...p, ...move });
    } else {
      invalidUids.push(p.uid);
    }
  }

  return { moves, valid: group.length > 0 && invalidUids.length === 0, invalidUids, hasMeter };
}

/** Nächstes freies BMK für die Kategorie des Bauteils, z. B. "-F4". */
export function suggestBmk(placements: Placement[], part: CatalogPart): string {
  const letter = part.bmkLetter ?? CATEGORY_LETTER[part.category];
  const re = new RegExp(`^-?${letter}(\\d+)$`);
  let max = 0;
  for (const p of placements) {
    const m = re.exec(p.bmk.trim());
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `-${letter}${max + 1}`;
}

/** Behält beim Vorlagenwechsel nur Bauteile, die in der neuen Vorlage gültig sind. */
export function retainFitting(template: CabinetTemplate, placements: Placement[]): Placement[] {
  const kept: Placement[] = [];
  for (const p of placements) {
    const part = getPart(p.partId);
    if (part && canPlace(template, kept, part, p.field, p.zone, p.te)) kept.push(p);
  }
  return kept;
}

/** Prüft eine geladene Projektdatei und verwirft Ungültiges. */
export function normalizeProject(
  raw: unknown,
  getTpl: (id: string) => CabinetTemplate | undefined,
): Project {
  if (!raw || typeof raw !== 'object') throw new Error('Keine gültige Projektdatei.');
  const r = raw as Record<string, unknown>;
  const template = getTpl(String(r.templateId ?? ''));
  if (!template) throw new Error('Unbekannte Schrankvorlage in der Projektdatei.');
  const list = Array.isArray(r.placements) ? r.placements : [];
  const placements: Placement[] = list
    .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
    .map((p, i) => ({
      uid: typeof p.uid === 'string' && p.uid ? p.uid : `p${i}`,
      partId: String(p.partId ?? ''),
      field: Number(p.field),
      zone: Number(p.zone),
      te: Number(p.te),
      bmk: typeof p.bmk === 'string' ? p.bmk : '',
      ...(typeof p.note === 'string' && p.note ? { note: p.note } : {}),
    }));
  return {
    version: 1,
    name: typeof r.name === 'string' ? r.name : '',
    templateId: template.id,
    placements: retainFitting(template, placements),
  };
}
