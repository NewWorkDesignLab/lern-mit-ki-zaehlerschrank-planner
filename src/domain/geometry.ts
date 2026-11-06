// ---------------------------------------------------------------------------
// Geometrie des gezeichneten Schranks – alle Maße in Millimetern.
// Das SVG nutzt mm direkt als Benutzereinheiten (viewBox in mm).
// ---------------------------------------------------------------------------

import type { CabinetTemplate, Zone } from './types';

export const TE_MM = 17.5;
export const FIELD_W = 250;
/** Gehäuserahmen rundherum. */
export const FRAME = 26;
/** Kopfzeile je Feld (Feldname). */
export const FIELD_HEADER = 24;
export const RAIL_ZONE_H = 165;
export const METER_ZONE_H = 450;
/** Höhe der Hutschiene (TS 35). */
export const RAIL_H = 35;
/** Bauhöhe einer generischen Reiheneinbau-Komponente (Frontansicht). */
export const DEVICE_H = 90;
/** Maximale Höhe, die ein Bauteilfoto auf der Schiene einnehmen darf. */
export const PHOTO_MAX_H = 118;

export interface ZoneGeo {
  zone: Zone;
  field: number;
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Nur bei Schienen: linke Kante von TE 0 und Mittellinie der Schiene. */
  railX: number;
  railY: number;
}

export interface FieldGeo {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zones: ZoneGeo[];
}

export interface CabinetGeo {
  width: number;
  height: number;
  fields: FieldGeo[];
}

function zoneHeight(zone: Zone): number {
  if (zone.kind === 'rail') return RAIL_ZONE_H;
  if (zone.kind === 'meter') return METER_ZONE_H;
  return zone.heightMm;
}

export function computeGeometry(template: CabinetTemplate): CabinetGeo {
  const innerH = Math.max(
    ...template.fields.map(
      (f) => FIELD_HEADER + f.zones.reduce((sum, z) => sum + zoneHeight(z), 0),
    ),
  );

  const fields: FieldGeo[] = template.fields.map((f, fi) => {
    const x = FRAME + fi * FIELD_W;
    let y = FRAME + FIELD_HEADER;
    const zones: ZoneGeo[] = f.zones.map((zone, zi) => {
      const h = zoneHeight(zone);
      const railW = zone.kind === 'rail' ? zone.te * TE_MM : 0;
      const geo: ZoneGeo = {
        zone,
        field: fi,
        index: zi,
        x,
        y,
        w: FIELD_W,
        h,
        railX: x + (FIELD_W - railW) / 2,
        railY: y + h / 2 + 4,
      };
      y += h;
      return geo;
    });
    return { name: f.name, x, y: FRAME, w: FIELD_W, h: innerH, zones };
  });

  return {
    width: FRAME * 2 + template.fields.length * FIELD_W,
    height: FRAME * 2 + innerH,
    fields,
  };
}

export function zoneAt(geo: CabinetGeo, x: number, y: number): ZoneGeo | undefined {
  for (const f of geo.fields) {
    for (const z of f.zones) {
      if (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) return z;
    }
  }
  return undefined;
}

export function getZoneGeo(geo: CabinetGeo, field: number, zone: number): ZoneGeo | undefined {
  return geo.fields[field]?.zones[zone];
}
