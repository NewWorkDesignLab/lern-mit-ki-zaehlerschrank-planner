// ---------------------------------------------------------------------------
// Kompakte Darstellung eines Projekts für Link/QR-Code.
// Tupel statt Objekte und TE doppelt (ganzzahlig) – der Link soll kurz bleiben.
// ---------------------------------------------------------------------------

import { getTemplate } from '../catalog/templates';
import { normalizeProject } from './layout';
import type { Project } from './types';

type CompactPlacement = [partId: string, field: number, zone: number, te2: number, bmk: string, note?: string];
type Compact = [version: 1, name: string, templateId: string, placements: CompactPlacement[]];

export function toCompact(project: Project): Compact {
  return [
    1,
    project.name,
    project.templateId,
    project.placements.map((p) => {
      const t: CompactPlacement = [p.partId, p.field, p.zone, Math.round(p.te * 2), p.bmk];
      if (p.note) t.push(p.note);
      return t;
    }),
  ];
}

export function fromCompact(data: unknown): Project {
  if (!Array.isArray(data) || data[0] !== 1 || !Array.isArray(data[3])) {
    throw new Error('Der Link enthält kein gültiges Projekt.');
  }
  const [, name, templateId, list] = data as Compact;
  return normalizeProject(
    {
      name,
      templateId,
      placements: list.map((t, i) => ({
        uid: `s${i}`,
        partId: t[0],
        field: t[1],
        zone: t[2],
        te: t[3] / 2,
        bmk: t[4],
        note: t[5],
      })),
    },
    getTemplate,
  );
}
