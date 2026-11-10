// ---------------------------------------------------------------------------
// Layout-Modus nach Fensterbreite:
//   desktop  – drei Spalten (Bibliothek, Schrank, Eigenschaften)
//   tablet   – Bibliothek links, Eigenschaften als einblendbare Seitenleiste
//   compact  – Handy / Tablet hoch: Schrank im Vollbild, Katalog-Dock unten
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';

export type LayoutMode = 'desktop' | 'tablet' | 'compact';

const COMPACT_MAX = 899;
const TABLET_MAX = 1279;

function current(): LayoutMode {
  const w = window.innerWidth;
  if (w <= COMPACT_MAX) return 'compact';
  if (w <= TABLET_MAX) return 'tablet';
  return 'desktop';
}

export function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>(current);
  useEffect(() => {
    const update = () => setMode(current());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return mode;
}
