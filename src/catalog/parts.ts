// ---------------------------------------------------------------------------
// Bauteilbibliothek.
//
// BEISPIELDATEN: Breiten (TE), Artikelnummern und technische Daten sind für den
// Prototyp zusammengestellt und vor dem realen Aufbau mit dem Datenblatt des
// Herstellers abzugleichen. Neue Bauteile = neuer Eintrag in CATALOG; ein Foto
// ist optional (ohne Foto wird eine generische Gerätegrafik gezeichnet).
// ---------------------------------------------------------------------------

import type { CatalogPart, PartCategory } from '../domain/types';
import { ART } from './art';
import { GENERIC_PARTS } from './generic';

export const CATEGORY_LABEL: Record<PartCategory, string> = {
  sls: 'SLS (Hauptleitungsschutz)',
  zaehler: 'Zähler / Messeinrichtung',
  uss: 'Überspannungsschutz',
  rcd: 'FI-Schutzschalter (RCD)',
  'fi-ls': 'FI/LS-Kombination',
  ls: 'Leitungsschutzschalter (LS)',
  sicherung: 'Schmelzsicherungen',
  steuerung: 'Steuerung / Lastmanagement',
  schalter: 'Schalter / Schütze',
  sonstiges: 'Versorgung / Sonstiges',
  klemme: 'Klemmen',
};

/** Reihenfolge der Kategorien in der Bibliothek und Stückliste. */
export const CATEGORY_ORDER: PartCategory[] = [
  'sls',
  'zaehler',
  'uss',
  'rcd',
  'fi-ls',
  'ls',
  'sicherung',
  'steuerung',
  'schalter',
  'sonstiges',
  'klemme',
];

/** Kennbuchstabe für den BMK-Vorschlag (angelehnt an DIN EN 81346-2). */
export const CATEGORY_LETTER: Record<PartCategory, string> = {
  sls: 'F',
  zaehler: 'P',
  uss: 'F',
  rcd: 'F',
  'fi-ls': 'F',
  ls: 'F',
  sicherung: 'F',
  steuerung: 'K',
  schalter: 'Q',
  sonstiges: 'E',
  klemme: 'X',
};

export const CATALOG: CatalogPart[] = [
  // --- Netzbetreiber-Bereich ---------------------------------------------
  {
    id: 'abb-sls-e35',
    manufacturer: 'ABB',
    category: 'sls',
    name: 'SLS E35 3-polig',
    widthTE: 4.5,
    mount: 'rail',
    poles: 3,
    specs: { Nennstrom: '35 A', Charakteristik: 'E (selektiv)', Pole: '3' },
    details: { Gerätereihe: 'S750DR', Norm: 'DIN VDE 0641-21', Bemessungsspannung: '400 V AC', Schaltvermögen: '25 kA', Plombierbar: 'ja' },
    art: ART.sls,
  },
  {
    id: 'msb-zaehler',
    manufacturer: 'Messstellenbetreiber',
    category: 'zaehler',
    name: 'Zähler / moderne Messeinrichtung',
    widthTE: 0,
    mount: 'meter',
    specs: { Ausführung: 'Zweirichtungszähler', Befestigung: 'Zählerplatz' },
    details: { Bereitstellung: 'durch Messstellenbetreiber', Messung: '3-phasig', Befestigung: 'Dreipunktbefestigung / BKE' },
    art: ART.meter,
  },

  // --- Überspannungsschutz -----------------------------------------------
  {
    id: 'hager-spb020-3n',
    manufacturer: 'Hager',
    category: 'uss',
    name: 'Überspannungsschutz Typ 2, 3+N',
    articleNo: 'SPB020 (3+N)',
    widthTE: 4,
    mount: 'rail',
    poles: 4,
    specs: { Typ: 'T2', Pole: '3+N', In: '20 kA', Up: '≤ 1,5 kV' },
    details: { Norm: 'DIN EN 61643-11', Netzsystem: 'TN-S / TT', Bemessungsspannung: '230/400 V AC', Imax: '40 kA' },
    art: ART.uss,
  },

  // --- RCD ---------------------------------------------------------------
  {
    id: 'abb-f204a-40',
    manufacturer: 'ABB',
    category: 'rcd',
    name: 'FI-Schutzschalter F204 A AP-R 40/0,03',
    articleNo: '2CSF204401R1400',
    widthTE: 4,
    mount: 'rail',
    poles: 4,
    specs: { Typ: 'A', Nennstrom: '40 A', 'IΔn': '30 mA', Pole: '4' },
    details: { Gerätereihe: 'F200', Norm: 'DIN EN 61008-1', Bemessungsspannung: '230/400 V AC', Bemessungskurzschlussstrom: '10 kA (mit Vorsicherung)', Anschlussquerschnitt: 'bis 25 mm²' },
    art: ART.rcdA,
  },
  {
    id: 'abb-f204b-40',
    manufacturer: 'ABB',
    category: 'rcd',
    name: 'FI-Schutzschalter F204 B 40/0,03',
    articleNo: '2CSF204568R1400',
    widthTE: 4,
    mount: 'rail',
    poles: 4,
    specs: { Typ: 'B', Nennstrom: '40 A', 'IΔn': '30 mA', Pole: '4' },
    details: { Gerätereihe: 'F200', Norm: 'DIN EN 61008-1, IEC 62423', Bemessungsspannung: '230/400 V AC', Bemessungskurzschlussstrom: '10 kA (mit Vorsicherung)', Anschlussquerschnitt: 'bis 25 mm²' },
    art: ART.rcdB,
  },
  {
    id: 'hager-cda440d',
    manufacturer: 'Hager',
    category: 'rcd',
    name: 'FI-Schutzschalter Typ A 40/0,03 4-polig',
    articleNo: 'CDA440D',
    widthTE: 4,
    mount: 'rail',
    poles: 4,
    specs: { Typ: 'A', Nennstrom: '40 A', 'IΔn': '30 mA', Pole: '4' },
    details: { Norm: 'DIN EN 61008-1', Bemessungsspannung: '230/400 V AC', Bemessungskurzschlussstrom: '10 kA (mit Vorsicherung)', Anschlussquerschnitt: 'bis 25 mm²' },
  },

  // --- FI/LS ---------------------------------------------------------------
  {
    id: 'abb-ds203nc-k20',
    manufacturer: 'ABB',
    category: 'fi-ls',
    name: 'FI/LS DS203NC K20/0,1',
    articleNo: '2CSR256140R2207',
    widthTE: 4,
    mount: 'rail',
    poles: 4,
    specs: { Charakteristik: 'K', Nennstrom: '20 A', 'IΔn': '100 mA', Pole: '3+N' },
    details: { Gerätereihe: 'DS203NC', Norm: 'DIN EN 61009-1', Bemessungsspannung: '400 V AC', Schaltvermögen: '6 kA', 'FI-Typ': 'A' },
    art: ART.fiLsK20,
  },

  // --- LS ------------------------------------------------------------------
  {
    id: 'abb-s201-b16',
    manufacturer: 'ABB',
    category: 'ls',
    name: 'LS-Schalter S201 B16',
    widthTE: 1,
    mount: 'rail',
    poles: 1,
    specs: { Charakteristik: 'B', Nennstrom: '16 A', Pole: '1', Schaltvermögen: '6 kA' },
    details: { Gerätereihe: 'S200', Norm: 'DIN EN 60898-1', Bemessungsspannung: '230/400 V AC', Energiebegrenzungsklasse: '3', Anschlussquerschnitt: 'bis 25 mm²' },
    art: ART.lsB16,
  },
  {
    id: 'abb-s201-b25',
    manufacturer: 'ABB',
    category: 'ls',
    name: 'LS-Schalter S201 B25',
    widthTE: 1,
    mount: 'rail',
    poles: 1,
    specs: { Charakteristik: 'B', Nennstrom: '25 A', Pole: '1', Schaltvermögen: '6 kA' },
    details: { Gerätereihe: 'S200', Norm: 'DIN EN 60898-1', Bemessungsspannung: '230/400 V AC', Energiebegrenzungsklasse: '3', Anschlussquerschnitt: 'bis 25 mm²' },
    art: ART.lsB25,
  },
  {
    id: 'hager-mbn116',
    manufacturer: 'Hager',
    category: 'ls',
    name: 'LS-Schalter B16 1-polig',
    articleNo: 'MBN116',
    widthTE: 1,
    mount: 'rail',
    poles: 1,
    specs: { Charakteristik: 'B', Nennstrom: '16 A', Pole: '1', Schaltvermögen: '6 kA' },
    details: { Norm: 'DIN EN 60898-1', Bemessungsspannung: '230/400 V AC', Energiebegrenzungsklasse: '3', Anschlussquerschnitt: 'bis 25 mm²' },
  },
  {
    id: 'hager-mbn316',
    manufacturer: 'Hager',
    category: 'ls',
    name: 'LS-Schalter B16 3-polig',
    articleNo: 'MBN316',
    widthTE: 3,
    mount: 'rail',
    poles: 3,
    specs: { Charakteristik: 'B', Nennstrom: '16 A', Pole: '3', Schaltvermögen: '6 kA' },
    details: { Norm: 'DIN EN 60898-1', Bemessungsspannung: '230/400 V AC', Energiebegrenzungsklasse: '3', Anschlussquerschnitt: 'bis 25 mm²' },
  },
  {
    id: 'siemens-5sl6116-6',
    manufacturer: 'Siemens',
    category: 'ls',
    name: 'LS-Schalter 5SL6 B16 1-polig',
    articleNo: '5SL6116-6',
    widthTE: 1,
    mount: 'rail',
    poles: 1,
    specs: { Charakteristik: 'B', Nennstrom: '16 A', Pole: '1', Schaltvermögen: '6 kA' },
    details: { Gerätereihe: '5SL6', Norm: 'DIN EN 60898-1', Bemessungsspannung: '230/400 V AC', Energiebegrenzungsklasse: '3', Anschlussquerschnitt: 'bis 25 mm²' },
  },

  // --- Steuerung -------------------------------------------------------------
  {
    id: 'gude-enc-2302',
    manufacturer: 'Gude',
    category: 'steuerung',
    name: 'Expert Net Control 2302 (4 Relais, LAN)',
    widthTE: 6,
    mount: 'rail',
    specs: { Relais: '4', Schnittstelle: 'LAN', Einsatz: 'SG-Ready / Lastmanagement' },
    details: { Versorgung: '230 V AC', Bedienung: 'Weboberfläche', Netzwerk: 'Ethernet (RJ45)', Montage: 'Hutschiene TS 35' },
    art: ART.gudeEnc,
  },

  // --- Schalter / Schütze ----------------------------------------------------
  {
    id: 'gen-schuetz-25-2s',
    manufacturer: 'Generisch',
    category: 'schalter',
    name: 'Installationsschütz 25 A, 2 S',
    widthTE: 1,
    mount: 'rail',
    poles: 2,
    specs: { Nennstrom: '25 A', Kontakte: '2 Schließer', Spule: '230 V AC' },
    details: { Norm: 'DIN EN 61095', Bemessungsspannung: '230/400 V AC' },
  },
  {
    id: 'gen-hauptschalter-63',
    manufacturer: 'Generisch',
    category: 'schalter',
    name: 'Lasttrennschalter 63 A 3-polig',
    widthTE: 3,
    mount: 'rail',
    poles: 3,
    specs: { Nennstrom: '63 A', Pole: '3' },
    details: { Norm: 'DIN EN 60947-3', Bemessungsspannung: '400 V AC' },
  },

  // --- Klemmen ---------------------------------------------------------------
  {
    id: 'gen-n-klemme',
    manufacturer: 'Generisch',
    category: 'klemme',
    name: 'N-Trennklemmenblock',
    widthTE: 2,
    mount: 'rail',
    specs: { Leiter: 'N' },
    details: { Anschlussquerschnitt: 'bis 16 mm²' },
  },
  {
    id: 'gen-pe-klemme',
    manufacturer: 'Generisch',
    category: 'klemme',
    name: 'PE-Klemmenblock',
    widthTE: 2,
    mount: 'rail',
    specs: { Leiter: 'PE' },
    details: { Anschlussquerschnitt: 'bis 16 mm²' },
  },
  ...GENERIC_PARTS,
];

const BY_ID = new Map(CATALOG.map((p) => [p.id, p]));

export function getPart(id: string): CatalogPart | undefined {
  return BY_ID.get(id);
}

export const MANUFACTURERS: string[] = [...new Set(CATALOG.map((p) => p.manufacturer))].sort(
  (a, b) => a.localeCompare(b, 'de'),
);
