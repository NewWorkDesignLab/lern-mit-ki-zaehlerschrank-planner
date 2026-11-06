// ---------------------------------------------------------------------------
// Datenmodell des Zählerschrank-Planers.
//
// Drei Bausteine:
//   - CatalogPart:     ein Bauteil aus der Bibliothek (Hersteller, Breite in TE …)
//   - CabinetTemplate: ein leerer Schrank (Felder mit Hutschienen / Zählerplatz)
//   - Project:         das, was der Azubi baut – welche Teile wo sitzen
//
// Alles ist reine Datenstruktur: Schränke und Bauteile werden später um echte
// Sachsen-Energie-Vorlagen und Herstellerdaten ergänzt, ohne Code zu ändern.
// ---------------------------------------------------------------------------

/** Pixel-Rechteck innerhalb eines Bildes. */
export interface PxRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Bauteilfoto. `crop` beschreibt, wo das Gerät im (oft transparent umrandeten)
 * Bild wirklich sitzt – nur dieser Bereich wird gezeichnet.
 */
export interface PartArt {
  src: string;
  /** Bildgröße in Pixeln. */
  w: number;
  h: number;
  crop: PxRect;
}

export type PartCategory =
  | 'sls'
  | 'zaehler'
  | 'uss'
  | 'rcd'
  | 'fi-ls'
  | 'ls'
  | 'steuerung'
  | 'schalter'
  | 'klemme';

/** Wo ein Bauteil montiert wird: auf der Hutschiene oder auf dem Zählerplatz. */
export type MountKind = 'rail' | 'meter';

export interface CatalogPart {
  id: string;
  manufacturer: string;
  category: PartCategory;
  name: string;
  articleNo?: string;
  /** Breite in Teilungseinheiten (1 TE = 17,5 mm). Halbe TE erlaubt. */
  widthTE: number;
  mount: MountKind;
  /** Pole / Anzahl Kippschalter für die generische Zeichnung. */
  poles?: number;
  /** Technische Daten zur Anzeige, z. B. { Nennstrom: '16 A' }. */
  specs: Record<string, string>;
  art?: PartArt;
  /** Schlüssel für den Nachschlagetext (content/infotexts.ts). */
  infoKey?: string;
}

// --- Schrankvorlagen --------------------------------------------------------

export type Zone =
  | { kind: 'rail'; label: string; te: number }
  | { kind: 'meter'; label: string }
  | { kind: 'blank'; label: string; heightMm: number };

export type FieldKind = 'zaehler' | 'verteiler' | 'apz';

export interface CabinetField {
  kind: FieldKind;
  name: string;
  zones: Zone[];
}

export interface CabinetTemplate {
  id: string;
  name: string;
  description: string;
  fields: CabinetField[];
}

// --- Projekt ----------------------------------------------------------------

export interface Placement {
  uid: string;
  partId: string;
  /** Index des Feldes in der Vorlage. */
  field: number;
  /** Index der Zone im Feld. */
  zone: number;
  /** Linke Kante in TE ab Schienenanfang (0 bei Zählerplatz). */
  te: number;
  /** Betriebsmittelkennzeichen, z. B. "-F3". */
  bmk: string;
  note?: string;
}

export interface Project {
  version: 1;
  name: string;
  templateId: string;
  placements: Placement[];
}
