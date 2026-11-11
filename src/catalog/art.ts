// ---------------------------------------------------------------------------
// Bauteilfotos samt vermessenem Gerätebereich (Pixel im jeweiligen PNG).
// Nur Optik – welche Daten zu einem Foto gehören, steht in parts.ts.
// ---------------------------------------------------------------------------

import type { PartArt } from '../domain/types';
import sgReadyRelay from '../assets/parts/sg-ready-relay.png';
import rcdTypA from '../assets/parts/rcd-typ-a.png';
import rcdTypB from '../assets/parts/rcd-typ-b.png';
import lsB16 from '../assets/parts/ls-b16.png';
import lsB25 from '../assets/parts/ls-b25.png';
import lsK20 from '../assets/parts/ls-k20.png';
import ussTyp2 from '../assets/parts/uss-typ2.png';
import zaehlerMme from '../assets/parts/zaehler-mme.png';

const art = (src: string, w: number, h: number, x: number, y: number, cw: number, ch: number): PartArt => ({
  src,
  w,
  h,
  crop: { x, y, w: cw, h: ch },
});

export const ART = {
  gudeEnc: art(sgReadyRelay, 1400, 1400, 79, 273, 1234, 903),
  uss: art(ussTyp2, 696, 696, 218, 63, 258, 584),
  rcdA: art(rcdTypA, 600, 600, 98, 58, 412, 478),
  rcdB: art(rcdTypB, 600, 600, 108, 58, 396, 476),
  lsB16: art(lsB16, 600, 600, 241, 17, 118, 567),
  lsB25: art(lsB25, 600, 600, 237, 16, 125, 568),
  fiLsK20: art(lsK20, 600, 600, 94, 69, 412, 478),
  meter: art(zaehlerMme, 602, 1038, 0, 0, 602, 1038),
};
