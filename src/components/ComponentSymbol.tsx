// ---------------------------------------------------------------------------
// Bauteilsymbol als SVG. Dasselbe Bauteil (aus demselben Datenmodell) wird je
// nach Ansicht unterschiedlich gezeichnet:
//   - schematic: technisches Schaltzeichen (DIN-nah, monochrom)
//   - game:      spielerisches, farbiges Icon
// ---------------------------------------------------------------------------

import type { ComponentKind, PaletteItem, RcdType, ViewMode } from '../domain/types';

interface Props {
  kind: ComponentKind;
  item?: PaletteItem;
  view: ViewMode;
  size?: number;
}

const COLORS: Record<ComponentKind, string> = {
  SLS: '#ff9d3d',
  METER: '#62b6ff',
  ENERGY_METER: '#62b6ff',
  USS: '#c58cff',
  LS: '#ffc23d',
  RCD: '#45d69a',
  KAMMSCHIENE: '#8fb4ff',
  LOAD: '#8fb4ff',
};

export function ComponentSymbol({ kind, item, view, size = 30 }: Props) {
  const stroke = view === 'schematic' ? '#cdd8f5' : COLORS[kind];
  const s = size;
  const common = {
    width: s,
    height: s,
    viewBox: '0 0 40 40',
    fill: 'none',
    stroke,
    strokeWidth: view === 'schematic' ? 1.6 : 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (view === 'game') {
    // Spielerische, gefüllte Icons.
    return (
      <svg {...common} fill="none">
        {gameGlyph(kind, item?.rcdType, stroke)}
      </svg>
    );
  }

  // Fach-Schaltzeichen.
  return <svg {...common}>{schematicGlyph(kind, item?.rcdType)}</svg>;
}

function gameGlyph(kind: ComponentKind, rcdType: RcdType | undefined, color: string) {
  switch (kind) {
    case 'SLS':
      return (
        <>
          <rect x="9" y="7" width="22" height="26" rx="4" fill={color} opacity="0.18" />
          <path d="M21 11l-6 10h5l-1 8 6-11h-5z" fill={color} stroke="none" />
        </>
      );
    case 'METER':
    case 'ENERGY_METER':
      return (
        <>
          <rect x="7" y="10" width="26" height="20" rx="4" fill={color} opacity="0.18" />
          <circle cx="20" cy="20" r="6" />
          <path d="M20 20l4-2" />
        </>
      );
    case 'USS':
      return (
        <>
          <path d="M20 6l11 5v8c0 8-5 12-11 15C14 31 9 27 9 19v-8z" fill={color} opacity="0.2" />
          <path d="M21 14l-5 8h4l-1 6 5-9h-4z" fill={color} stroke="none" />
        </>
      );
    case 'RCD':
      return (
        <>
          <rect x="7" y="9" width="26" height="22" rx="5" fill={color} opacity="0.18" />
          <path d="M13 27c3-9 11-9 14 0" />
          <text x="20" y="18" fontSize="9" fill={color} stroke="none" textAnchor="middle" fontWeight="700">
            {rcdType ?? 'FI'}
          </text>
        </>
      );
    case 'LS':
      return (
        <>
          <rect x="10" y="7" width="20" height="26" rx="5" fill={color} opacity="0.18" />
          <path d="M15 12v7l6 2-6 9" />
        </>
      );
    case 'KAMMSCHIENE':
      return (
        <>
          <rect x="6" y="16" width="28" height="8" rx="3" fill={color} opacity="0.3" />
          <path d="M12 24v6M20 24v6M28 24v6" />
        </>
      );
    case 'LOAD':
      return (
        <>
          <circle cx="20" cy="20" r="12" fill={color} opacity="0.18" />
          <path d="M20 12v8l5 3" />
        </>
      );
  }
}

function schematicGlyph(kind: ComponentKind, rcdType: RcdType | undefined) {
  switch (kind) {
    case 'SLS':
      return (
        <>
          <path d="M20 6v6M20 28v6" />
          <path d="M20 12l7 10" />
          <path d="M14 16h12" />
          <path d="M14 20h12" />
        </>
      );
    case 'METER':
    case 'ENERGY_METER':
      return (
        <>
          <circle cx="20" cy="20" r="11" />
          <path d="M20 20l5-3" />
          <path d="M20 6v3M20 31v3" />
        </>
      );
    case 'USS':
      return (
        <>
          <path d="M20 6v9M20 25v9" />
          <rect x="15" y="15" width="10" height="10" rx="1" />
          <path d="M17 20h6" />
          <path d="M20 6l-4 4h8" />
        </>
      );
    case 'RCD':
      return (
        <>
          <rect x="10" y="8" width="20" height="24" rx="1" />
          <path d="M14 26c2-6 10-6 12 0" />
          <circle cx="20" cy="15" r="1.6" fill="#cdd8f5" stroke="none" />
          <text x="20" y="15" dy="10" fontSize="7" fill="#cdd8f5" stroke="none" textAnchor="middle">
            {rcdType ? `Typ ${rcdType}` : 'FI'}
          </text>
        </>
      );
    case 'LS':
      return (
        <>
          <path d="M20 6v7M20 27v7" />
          <path d="M20 13l6 12" />
          <rect x="16" y="15" width="8" height="8" rx="1" />
        </>
      );
    case 'KAMMSCHIENE':
      return (
        <>
          <path d="M8 18h24" />
          <path d="M13 18v8M20 18v8M27 18v8" />
        </>
      );
    case 'LOAD':
      return (
        <>
          <path d="M20 6v8" />
          <circle cx="20" cy="22" r="9" />
          <path d="M15 22h10M20 17v10" />
        </>
      );
  }
}
