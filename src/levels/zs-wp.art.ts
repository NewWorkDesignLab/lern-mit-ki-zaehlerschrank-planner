// ---------------------------------------------------------------------------
// Grafik-Daten für den Wärmepumpen-Schrank (ZS-WP).
//
// Bewusst getrennt von zs-wp.ts: dort steht die FACHLICHKEIT, hier nur die
// Optik. Beide beschreiben dieselben Steckplätze über dieselben slot.id-Werte.
// Helfer und Bauteilfotos kommen aus art.ts.
// ---------------------------------------------------------------------------

import type { CabinetArt } from '../domain/types';
import { CABINET_ASPECT, PART, bgRect } from './art';
import cabinetBg from '../assets/cabinets/zs-wp.png';

export const ZS_WP_ART: CabinetArt = {
  background: cabinetBg,
  aspect: CABINET_ASPECT,

  // Die gestrichelten Platzhalter der Vorlage. +ZS2-F1 und +ZS2-P1/J1 sind
  // bereits in die Grafik gerendert – ihre Rechtecke dienen nur als Klickfläche
  // für das Infofeld.
  slotRects: {
    'slot-sls': bgRect(118, 319, 148, 243),
    'slot-meter': bgRect(285, 329, 269, 456),
    'slot-rcd': bgRect(672, 339, 154, 214),
    'slot-ls-wp': bgRect(174, 864, 139, 181),
    'slot-sg-ready': bgRect(427, 864, 137, 181),
    'slot-ls-speicher': bgRect(678, 864, 139, 181),
    'slot-ls-mf': bgRect(228, 1161, 140, 176),
    'slot-ls-aussen2': bgRect(619, 1161, 142, 176),
  },

  // Schlüssel = paletteItem.id aus zs-wp.ts.
  parts: {
    'sg-schuetz': PART.sgSchuetz,
    'rcd-a': PART.rcdA,
    'rcd-b': PART.rcdB,
    'ls-b16': PART.lsB16,
    'ls-b25': PART.lsB25,
    'ls-k20': PART.lsK20,
  },
};
