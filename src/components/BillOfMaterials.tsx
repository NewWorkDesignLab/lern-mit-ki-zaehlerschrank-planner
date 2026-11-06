// ---------------------------------------------------------------------------
// Stückliste: gleiche Bauteile zusammengefasst, sortiert nach Kategorie.
// Dieselbe Berechnung nutzt der PNG-Export (buildBom).
// ---------------------------------------------------------------------------

import { CATEGORY_ORDER, getPart } from '../catalog/parts';
import type { CatalogPart, Project } from '../domain/types';

export interface BomRow {
  part: CatalogPart;
  qty: number;
  bmks: string[];
}

export function buildBom(project: Project): BomRow[] {
  const rows = new Map<string, BomRow>();
  for (const p of project.placements) {
    const part = getPart(p.partId);
    if (!part) continue;
    const row = rows.get(part.id) ?? { part, qty: 0, bmks: [] };
    row.qty += 1;
    if (p.bmk.trim()) row.bmks.push(p.bmk.trim());
    rows.set(part.id, row);
  }
  return [...rows.values()].sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.part.category) - CATEGORY_ORDER.indexOf(b.part.category) ||
      a.part.name.localeCompare(b.part.name, 'de'),
  );
}

export function BillOfMaterials({ project }: { project: Project }) {
  const rows = buildBom(project);
  const total = rows.reduce((s, r) => s + r.qty, 0);

  return (
    <section className="panel bom">
      <h2 className="panel-title">
        Stückliste <span className="muted">({total} Teile)</span>
      </h2>
      {rows.length === 0 ? (
        <p className="muted">Noch keine Bauteile im Schrank.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Anz.</th>
              <th>Bauteil</th>
              <th>BMK</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.part.id}>
                <td className="num">{r.qty}×</td>
                <td>
                  <b>{r.part.name}</b>
                  <span className="muted">
                    {r.part.manufacturer}
                    {r.part.articleNo ? ` · ${r.part.articleNo}` : ''}
                  </span>
                </td>
                <td className="bmk">{r.bmks.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
