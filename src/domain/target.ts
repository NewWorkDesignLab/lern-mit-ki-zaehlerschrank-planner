// ---------------------------------------------------------------------------
// Wohin würde ein Bauteil fallen, wenn es an Punkt (x, y) [mm] losgelassen wird?
// Magnetisch: Ist die Wunschstelle belegt, wird die nächste freie Stelle auf
// derselben Schiene vorgeschlagen.
// ---------------------------------------------------------------------------

import type { CabinetGeo } from './geometry';
import { TE_MM, zoneAt } from './geometry';
import { canPlace, nearestFreeTe, snapTe } from './layout';
import type { CabinetTemplate, CatalogPart, Placement } from './types';

export interface DropTarget {
  field: number;
  zone: number;
  te: number;
  valid: boolean;
}

/**
 * Wunschstelle unter dem Punkt (x, y) ohne Belegungsprüfung und ohne Magnet:
 * Zone plus eingerasteter TE, mittig unter dem Mauszeiger.
 */
export function wishAt(
  geo: CabinetGeo,
  part: CatalogPart,
  x: number,
  y: number,
): { field: number; zone: number; te: number; kind: 'rail' | 'meter' } | null {
  const z = zoneAt(geo, x, y);
  if (!z) return null;
  const { field, index: zone } = z;
  if (z.zone.kind === 'meter') return { field, zone, te: 0, kind: 'meter' };
  if (z.zone.kind !== 'rail') return null;
  const maxTe = Math.max(0, z.zone.te - part.widthTE);
  const te = Math.min(maxTe, Math.max(0, snapTe((x - z.railX) / TE_MM - part.widthTE / 2)));
  return { field, zone, te, kind: 'rail' };
}

export function computeTarget(
  template: CabinetTemplate,
  geo: CabinetGeo,
  placements: Placement[],
  part: CatalogPart,
  x: number,
  y: number,
  excludeUid?: string,
): DropTarget | null {
  const w = wishAt(geo, part, x, y);
  if (!w) return null;
  const { field, zone } = w;

  if (w.kind === 'meter') {
    return { field, zone, te: 0, valid: canPlace(template, placements, part, field, zone, 0, excludeUid) };
  }

  const wish = w.te;
  if (canPlace(template, placements, part, field, zone, wish, excludeUid)) {
    return { field, zone, te: wish, valid: true };
  }
  const near = nearestFreeTe(template, placements, part, field, zone, wish, excludeUid);
  if (near !== null) return { field, zone, te: near, valid: true };
  return { field, zone, te: wish, valid: false };
}
