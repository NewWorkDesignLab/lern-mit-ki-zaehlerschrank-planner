// ---------------------------------------------------------------------------
// Grafik-Daten für den PV-Schrank (ZS-PV).
//
// Bewusst getrennt von zs-pv.ts: dort steht die FACHLICHKEIT, hier nur die
// Optik. Beide beschreiben dieselben Steckplätze über dieselben slot.id-Werte.
// Helfer und Bauteilfotos kommen aus art.ts.
// ---------------------------------------------------------------------------

import type { CabinetArt } from '../domain/types';
import { CABINET_ASPECT, PART, bgRect } from './art';
import cabinetBg from '../assets/cabinets/zs-pv.png';

export const ZS_PV_ART: CabinetArt = {
  background: cabinetBg,
  aspect: CABINET_ASPECT,

  // Die gestrichelten Platzhalter der Vorlage. +ZS2-F1 und +ZS2-P1/J1 sind
  // bereits in die Grafik gerendert – ihre Rechtecke dienen nur als Klickfläche
  // für das Infofeld.
  slotRects: {
    'slot-sls': bgRect(120, 321, 145, 240),
    'slot-meter': bgRect(289, 331, 261, 453),
    'slot-uss': bgRect(672, 339, 154, 214),
    'slot-ls-wr': bgRect(176, 864, 136, 181),
    'slot-rcd-wr': bgRect(427, 864, 137, 181),
    'slot-ls-wb': bgRect(678, 864, 139, 181),
    'slot-rcd-end': bgRect(177, 1162, 139, 175),
    'slot-ls-mf': bgRect(424, 1162, 143, 175),
    'slot-ls-ab1': bgRect(679, 1162, 142, 175),
  },

  // Schlüssel = paletteItem.id aus zs-pv.ts.
  parts: {
    uss: PART.uss,
    'rcd-a': PART.rcdA,
    'rcd-b': PART.rcdB,
    'ls-b16': PART.lsB16,
    'ls-b25': PART.lsB25,
    'ls-k20': PART.lsK20,
  },
};
