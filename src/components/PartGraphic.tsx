// ---------------------------------------------------------------------------
// Zeichnet ein Bauteil als SVG – mit Foto (zugeschnitten auf den Gerätebereich)
// oder als generische Reiheneinbau-Grafik.
//
// WICHTIG: nur Präsentationsattribute (fill, stroke …), keine CSS-Klassen –
// dieselbe Grafik landet 1:1 im PNG-Export, wo kein Stylesheet greift.
// ---------------------------------------------------------------------------

import type { CatalogPart, PartArt } from '../domain/types';
import { DEVICE_H } from '../domain/geometry';

const FONT = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Größe eines Fotos, eingepasst in eine Box (contain). */
export function fitArt(art: PartArt, boxW: number, boxH: number): { w: number; h: number } {
  const aspect = art.crop.w / art.crop.h;
  let w = boxW;
  let h = boxW / aspect;
  if (h > boxH) {
    h = boxH;
    w = boxH * aspect;
  }
  return { w, h };
}

export function PhotoImage({ art, x, y, w, h }: { art: PartArt; x: number; y: number; w: number; h: number }) {
  const { crop } = art;
  return (
    <svg
      x={x}
      y={y}
      width={w}
      height={h}
      viewBox={`${crop.x} ${crop.y} ${crop.w} ${crop.h}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <image href={art.src} width={art.w} height={art.h} />
    </svg>
  );
}

/** Kurzaufschrift für generische Geräte (z. B. "B16", "RCD A"). */
export function shortLabel(part: CatalogPart): string {
  if (part.label !== undefined) return part.label;
  const s = part.specs;
  const amps = (s.Nennstrom ?? '').replace(/\s*A$/, '');
  switch (part.category) {
    case 'ls':
    case 'fi-ls':
      return `${s.Charakteristik ?? ''}${amps}`;
    case 'rcd':
      return `RCD ${s.Typ ?? ''}`.trim();
    case 'uss':
      return 'ÜSS';
    case 'sls':
      return `SLS ${s.Charakteristik?.charAt(0) ?? ''}${amps}`;
    case 'klemme':
      return s.Leiter ?? '';
    case 'schalter':
    case 'steuerung':
      return amps ? `${amps} A` : '';
    default:
      return '';
  }
}

const ACCENT: Record<string, string> = {
  sls: '#d32f2f',
  uss: '#2e7d32',
  rcd: '#1565c0',
  'fi-ls': '#1565c0',
  ls: '#c62828',
  sicherung: '#f9a825',
  steuerung: '#37474f',
  schalter: '#6d4c41',
  sonstiges: '#78909c',
  klemme: '#546e7a',
  zaehler: '#455a64',
};

/** Generische Grafik eines Reiheneinbaugeräts, zentriert auf (cx, cy). */
export function GenericDevice({ part, cx, cy, w }: { part: CatalogPart; cx: number; cy: number; w: number }) {
  const h = DEVICE_H;
  const x = cx - w / 2 + 0.4;
  const y = cy - h / 2;
  const bw = w - 0.8;
  const label = shortLabel(part);

  if (part.category === 'klemme') {
    const isPe = part.specs.Leiter === 'PE';
    const isN = part.specs.Leiter === 'N';
    const n = Math.max(1, Math.round(w / 6));
    return (
      <g>
        <rect
          x={x}
          y={cy - 22}
          width={bw}
          height={44}
          rx={2}
          fill={isPe ? '#cddc39' : isN ? '#1e88e5' : '#9e9e9e'}
          stroke="#37474f"
          strokeWidth={0.6}
        />
        {isPe && <rect x={x} y={cy - 4} width={bw} height={8} fill="#43a047" />}
        {Array.from({ length: n }, (_, i) => (
          <circle key={i} cx={x + ((i + 0.5) * bw) / n} cy={cy - 12} r={2.2} fill="#eceff1" stroke="#37474f" strokeWidth={0.4} />
        ))}
        <text x={cx} y={cy + 15} fontSize={6} textAnchor="middle" fontFamily={FONT} fontWeight={700} fill="#fff">
          {label}
        </text>
      </g>
    );
  }

  const poles = Math.max(1, part.poles ?? Math.max(1, Math.round(w / 17.5)));
  const pw = bw / poles;
  const dark = part.category === 'steuerung';

  return (
    <g>
      <rect x={x} y={y} width={bw} height={h} rx={2.5} fill={dark ? '#263238' : '#f3f4f6'} stroke="#9aa3ad" strokeWidth={0.6} />
      {/* Klemmen oben/unten */}
      {Array.from({ length: poles }, (_, i) => (
        <g key={i}>
          <circle cx={x + (i + 0.5) * pw} cy={y + 9} r={Math.min(4, pw / 3)} fill="#cfd4da" stroke="#7b8590" strokeWidth={0.5} />
          <circle cx={x + (i + 0.5) * pw} cy={y + h - 9} r={Math.min(4, pw / 3)} fill="#cfd4da" stroke="#7b8590" strokeWidth={0.5} />
        </g>
      ))}
      {/* Herstellerband */}
      <rect x={x} y={y + 22} width={bw} height={4} fill={ACCENT[part.category] ?? '#78909c'} />
      {/* Kippschalter */}
      {!dark &&
        Array.from({ length: poles }, (_, i) => (
          <rect
            key={i}
            x={x + (i + 0.5) * pw - Math.min(4, pw / 3)}
            y={cy - 2}
            width={Math.min(8, (pw * 2) / 3)}
            height={16}
            rx={1}
            fill={part.category === 'rcd' ? '#1976d2' : '#212121'}
          />
        ))}
      <text
        x={cx}
        y={y + 36}
        fontSize={bw < 20 ? 4.6 : 6}
        textAnchor="middle"
        fontFamily={FONT}
        fontWeight={700}
        fill={dark ? '#eceff1' : '#263238'}
      >
        {label}
      </text>
      {bw >= 30 && (
        <text x={cx} y={y + h - 20} fontSize={4.2} textAnchor="middle" fontFamily={FONT} fill={dark ? '#b0bec5' : '#607d8b'}>
          {part.manufacturer}
        </text>
      )}
    </g>
  );
}

/**
 * Bauteil auf einer Hutschiene: Foto oder generische Grafik, horizontal in
 * [x, x+w] und vertikal um die Schienenmitte cy zentriert.
 */
export function PartOnRail({
  part,
  x,
  w,
  cy,
  maxH,
}: {
  part: CatalogPart;
  x: number;
  w: number;
  cy: number;
  maxH: number;
}) {
  if (part.art) {
    const s = fitArt(part.art, w, maxH);
    return <PhotoImage art={part.art} x={x + (w - s.w) / 2} y={cy - s.h / 2} w={s.w} h={s.h} />;
  }
  return <GenericDevice part={part} cx={x + w / 2} cy={cy} w={w} />;
}

/** Seitenverhältnis (B/H) der gezeichneten Messeinrichtung. */
export const METER_ASPECT = 120 / 218;

/**
 * Generische Grafik einer modernen Messeinrichtung (eHZ/mME) für den Zählerplatz.
 * Gezeichnet in einem 120 × 218-Raster und auf (x, y, w, h) skaliert.
 */
export function MeterDevice({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${w / 120} ${h / 218})`}>
      {/* Gehäuse */}
      <rect x={0} y={0} width={120} height={218} rx={6} fill="#eceff1" stroke="#90a4ae" strokeWidth={0.8} />
      {/* Oberteil mit Anzeige */}
      <rect x={6} y={6} width={108} height={130} rx={4} fill="#f7f8f9" stroke="#b0bec5" strokeWidth={0.6} />
      <rect x={6} y={6} width={108} height={12} rx={3} fill={ACCENT.zaehler} />
      <text x={60} y={14.6} fontSize={6} textAnchor="middle" fontFamily={FONT} fontWeight={700} fill="#fff">
        Messeinrichtung
      </text>
      <rect x={16} y={26} width={88} height={28} rx={2} fill="#263238" />
      <rect x={19} y={29} width={82} height={22} rx={1} fill="#a5bfa5" />
      <text x={96} y={44} fontSize={10} textAnchor="end" fontFamily="Consolas, 'Courier New', monospace" fontWeight={700} fill="#1b2a1c">
        0012345,6
      </text>
      <text x={96} y={49.5} fontSize={4} textAnchor="end" fontFamily={FONT} fill="#1b2a1c">
        kWh
      </text>
      {/* Prüf-LED und optische Schnittstelle */}
      <circle cx={24} cy={68} r={2.4} fill="#e53935" />
      <text x={30} y={69.6} fontSize={4.4} fontFamily={FONT} fill="#607d8b">
        10000 imp/kWh
      </text>
      <circle cx={92} cy={80} r={9} fill="#cfd8dc" stroke="#78909c" strokeWidth={0.6} />
      <circle cx={92} cy={80} r={3.5} fill="#455a64" />
      <text x={16} y={98} fontSize={5} fontFamily={FONT} fontWeight={700} fill="#37474f">
        3 ~ 230/400 V
      </text>
      <text x={16} y={106} fontSize={5} fontFamily={FONT} fill="#607d8b">
        5(60) A · 50 Hz
      </text>
      {/* Klemmendeckel mit Plomben */}
      <rect x={6} y={142} width={108} height={70} rx={4} fill="#dfe4e8" stroke="#b0bec5" strokeWidth={0.6} />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={30 + i * 10.5} y={160} width={5} height={26} rx={1.5} fill="#c5ccd3" />
      ))}
      <circle cx={16} cy={202} r={2.6} fill="#b0bec5" stroke="#78909c" strokeWidth={0.5} />
      <circle cx={104} cy={202} r={2.6} fill="#b0bec5" stroke="#78909c" strokeWidth={0.5} />
    </g>
  );
}

/** Kleines Vorschaubild für Bibliothek und Eigenschaften (HTML-Kontext). */
export function PartThumb({ part, size = 44 }: { part: CatalogPart; size?: number }) {
  // Generische Geräte in ihrer echten Breite zeichnen, aber mindestens 1 TE.
  const w = Math.max(17.5, part.widthTE * 17.5);
  const vbW = Math.max(w + 6, 100);
  const vbH = 124;
  return (
    <svg width={size} height={size} viewBox={`${-vbW / 2} ${-vbH / 2} ${vbW} ${vbH}`} aria-hidden="true">
      {part.mount === 'meter' && !part.art ? (
        <MeterDevice x={(-(vbH - 8) * METER_ASPECT) / 2} y={-(vbH - 8) / 2} w={(vbH - 8) * METER_ASPECT} h={vbH - 8} />
      ) : part.art ? (
        (() => {
          const s = fitArt(part.art, vbW - 4, vbH - 4);
          return <PhotoImage art={part.art} x={-s.w / 2} y={-s.h / 2} w={s.w} h={s.h} />;
        })()
      ) : (
        <GenericDevice part={part} cx={0} cy={0} w={Math.min(w, vbW - 4)} />
      )}
    </svg>
  );
}
