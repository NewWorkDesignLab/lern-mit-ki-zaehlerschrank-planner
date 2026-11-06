// ---------------------------------------------------------------------------
// Schrankvorlagen.
//
// PLATZHALTER: Aufteilung und Maße sind an typische Zählerschränke nach TAB
// angelehnt (Feldbreite 250 mm, 12 TE je Hutschiene). Die konkreten
// Sachsen-Energie-Schränke werden hier ergänzt, sobald die Daten vorliegen.
// ---------------------------------------------------------------------------

import type { CabinetField, CabinetTemplate, Zone } from '../domain/types';

const rail = (label: string, te = 12): Zone => ({ kind: 'rail', label, te });
const meter = (label = 'Zählerplatz'): Zone => ({ kind: 'meter', label });

const zaehlerfeld = (name = 'Zählerfeld'): CabinetField => ({
  kind: 'zaehler',
  name,
  zones: [rail('Oberer Anschlussraum'), meter(), rail('Unterer Anschlussraum')],
});

const verteilerfeld = (rows: number, name = 'Verteilerfeld'): CabinetField => ({
  kind: 'verteiler',
  name,
  zones: Array.from({ length: rows }, (_, i) => rail(`Reihe ${i + 1}`)),
});

const apzFeld: CabinetField = {
  kind: 'apz',
  name: 'APZ / Kommunikation',
  zones: [
    rail('Oberer Anschlussraum'),
    { kind: 'blank', label: 'Raum für APZ / Zusatzanwendungen', heightMm: 290 },
    rail('Reihe 1'),
    rail('Reihe 2'),
  ],
};

export const TEMPLATES: CabinetTemplate[] = [
  {
    id: 'zs-2f',
    name: 'Zählerschrank 2-feldrig',
    description: '1 Zählerfeld + 1 Verteilerfeld (5 Reihen)',
    fields: [zaehlerfeld(), verteilerfeld(5)],
  },
  {
    id: 'zs-3f-apz',
    name: 'Zählerschrank 3-feldrig mit APZ',
    description: '1 Zählerfeld + 1 Verteilerfeld + APZ-Feld',
    fields: [zaehlerfeld(), verteilerfeld(5), apzFeld],
  },
  {
    id: 'zs-3f-2z',
    name: 'Zählerschrank 3-feldrig, 2 Zähler',
    description: '2 Zählerfelder (z. B. Haushalt + Wärmepumpe) + 1 Verteilerfeld',
    fields: [zaehlerfeld('Zählerfeld 1'), zaehlerfeld('Zählerfeld 2'), verteilerfeld(5)],
  },
  {
    id: 'kv-3r',
    name: 'Kleinverteiler 3-reihig',
    description: '1 Feld, 3 Hutschienen à 12 TE',
    fields: [verteilerfeld(3, 'Kleinverteiler')],
  },
];

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

export function getTemplate(id: string): CabinetTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
