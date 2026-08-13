// ---------------------------------------------------------------------------
// Grafik-Daten für den Wärmepumpen-Schrank (ZS-WP).
//
// Bewusst getrennt von zs-wp.ts: dort steht die FACHLICHKEIT, hier nur die
// Optik. Beide beschreiben dieselben Slots über dieselben slot.id-Werte.
//
// Alle Zahlen sind aus den PNGs vermessen und auf 0..1 normiert:
//   - slotRects: relativ zur Hintergrundgrafik (1024 x 1616 px)
//   - parts[].content: der freigestellte Gerätebereich innerhalb seines PNGs
//
// Warum `content`? Die Bauteilfotos haben unterschiedlich viel transparenten
// Rand. Erst mit dem Inhalts-Rechteck lassen sich alle Geräte auf dieselbe
// Bauhöhe skalieren – dann ergibt sich die Breite automatisch aus dem echten
// Seitenverhältnis (1-poliger LS schmal, 4-poliger RCD breit, Relais am
// breitesten), so wie auf einer realen Hutschiene.
// ---------------------------------------------------------------------------

import type { CabinetArt, PartArt } from '../domain/types';
import cabinetBg from '../assets/zs-wp/cabinet.png';
import sgReadyRelay from '../assets/zs-wp/sg-ready-relay.png';
import rcdTypA from '../assets/zs-wp/rcd-typ-a.png';
import rcdTypB from '../assets/zs-wp/rcd-typ-b.png';
import lsB16 from '../assets/zs-wp/ls-b16.png';
import lsB25 from '../assets/zs-wp/ls-b25.png';
import lsK20 from '../assets/zs-wp/ls-k20.png';

const BG_W = 1024;
const BG_H = 1616;

/** Pixel-Rechteck der Hintergrundgrafik -> normiertes Rechteck. */
const bgRect = (x: number, y: number, w: number, h: number) => ({
  x: x / BG_W,
  y: y / BG_H,
  w: w / BG_W,
  h: h / BG_H,
});

/**
 * Bauteilfoto samt vermessenem Inhalts-Rechteck.
 * `canvas` = Kantenlänge der (quadratischen) PNG-Leinwand.
 */
const part = (
  src: string,
  canvas: number,
  x: number,
  y: number,
  w: number,
  h: number,
): PartArt => ({
  src,
  content: { x: x / canvas, y: y / canvas, w: w / canvas, h: h / canvas },
  aspect: w / h,
});

export const ZS_WP_ART: CabinetArt = {
  background: cabinetBg,
  aspect: BG_W / BG_H,

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

  parts: {
    'sg-schuetz': part(sgReadyRelay, 1400, 79, 273, 1234, 903),
    'rcd-a': part(rcdTypA, 600, 98, 58, 412, 478),
    'rcd-b': part(rcdTypB, 600, 108, 58, 396, 476),
    'ls-b16': part(lsB16, 600, 241, 17, 118, 567),
    'ls-b25': part(lsB25, 600, 237, 16, 125, 568),
    'ls-k20': part(lsK20, 600, 94, 69, 412, 478),
  },
};
