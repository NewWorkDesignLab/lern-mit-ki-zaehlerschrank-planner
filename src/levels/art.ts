// ---------------------------------------------------------------------------
// Gemeinsame Grafik-Bausteine für die fotorealistische Spielansicht.
//
// Hier steht nur Optik, keine Fachlichkeit. Die Bauteilfotos liegen bewusst
// zentral: dieselbe Klemme sieht in jedem Schrank gleich aus, und ein LS B 16 A
// soll in Level 1 und Level 2 nicht zweimal im Bundle landen.
//
// Alle Zahlen sind aus den PNGs vermessen und werden auf 0..1 normiert:
//   - bgRect(): Platzhalter-Rechteck in einer Schrankgrafik
//   - part():   der freigestellte Gerätebereich innerhalb seines PNGs
//
// Warum `content`? Die Fotos haben unterschiedlich viel transparenten Rand.
// Erst mit dem Inhalts-Rechteck lassen sich alle Geräte auf dieselbe Bauhöhe
// skalieren – die Breite ergibt sich dann aus dem echten Seitenverhältnis
// (1-poliger LS schmal, 4-poliger RCD breit), wie auf einer realen Hutschiene.
// ---------------------------------------------------------------------------

import type { PartArt } from '../domain/types';
import sgReadyRelay from '../assets/parts/sg-ready-relay.png';
import rcdTypA from '../assets/parts/rcd-typ-a.png';
import rcdTypB from '../assets/parts/rcd-typ-b.png';
import lsB16 from '../assets/parts/ls-b16.png';
import lsB25 from '../assets/parts/ls-b25.png';
import lsK20 from '../assets/parts/ls-k20.png';
import ussTyp2 from '../assets/parts/uss-typ2.png';

/** Beide Schrankgrafiken sind in derselben Auflösung gerendert. */
export const CABINET_W = 1024;
export const CABINET_H = 1616;
export const CABINET_ASPECT = CABINET_W / CABINET_H;

/** Pixel-Rechteck einer Schrankgrafik -> normiertes Rechteck. */
export const bgRect = (x: number, y: number, w: number, h: number) => ({
  x: x / CABINET_W,
  y: y / CABINET_H,
  w: w / CABINET_W,
  h: h / CABINET_H,
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

/** Alle verfügbaren Bauteilfotos. Die Level greifen sich heraus, was sie brauchen. */
export const PART = {
  sgSchuetz: part(sgReadyRelay, 1400, 79, 273, 1234, 903),
  uss: part(ussTyp2, 696, 218, 63, 258, 584),
  rcdA: part(rcdTypA, 600, 98, 58, 412, 478),
  rcdB: part(rcdTypB, 600, 108, 58, 396, 476),
  lsB16: part(lsB16, 600, 241, 17, 118, 567),
  lsB25: part(lsB25, 600, 237, 16, 125, 568),
  lsK20: part(lsK20, 600, 94, 69, 412, 478),
};
