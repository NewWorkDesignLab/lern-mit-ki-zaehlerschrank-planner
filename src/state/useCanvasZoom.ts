// ---------------------------------------------------------------------------
// Zoom für den Schrank auf Touch-Layouts (Tablet, Handy).
//
// Das SVG bekommt eine feste Pixelgröße (eingepasst × Zoom), der Scroll-Container
// darum übernimmt das Verschieben mit einem Finger nativ. Zwei Finger zoomen um
// ihren Mittelpunkt. Alle Trefferberechnungen laufen weiter über getScreenCTM –
// Ziehen & Ablegen funktioniert daher bei jedem Zoom.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export const MAX_ZOOM = 5;

interface Anchor {
  /** Punkt im SVG als Anteil von Breite/Höhe ... */
  fx: number;
  fy: number;
  /** ... der danach unter dieser Bildschirmposition liegen soll. */
  cx: number;
  cy: number;
}

export function useCanvasZoom(
  scrollRef: RefObject<HTMLDivElement>,
  svgRef: RefObject<SVGSVGElement>,
  cabinet: { width: number; height: number },
  enabled: boolean,
  /** Zwei Finger aufgesetzt: laufendes Ziehen/Pinseln abbrechen. */
  onPinchStart: () => void,
) {
  const [fit, setFit] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  zoomRef.current = zoom;
  const anchorRef = useRef<Anchor | null>(null);
  const pinchStartRef = useRef(onPinchStart);
  pinchStartRef.current = onPinchStart;

  // Eingepasste Größe: ganzer Schrank sichtbar (Zoom 1).
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!enabled || !el) {
      setFit(null);
      return;
    }
    const update = () => {
      const cs = getComputedStyle(el);
      const w = el.offsetWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const h = el.offsetHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const s = Math.max(0.05, Math.min(w / cabinet.width, h / cabinet.height));
      setFit({ w: cabinet.width * s, h: cabinet.height * s });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scrollRef, enabled, cabinet.width, cabinet.height]);

  const scrollToAnchor = useCallback(
    (a: Anchor) => {
      const el = scrollRef.current;
      const r = svgRef.current?.getBoundingClientRect();
      if (!el || !r) return;
      el.scrollLeft += r.left + a.fx * r.width - a.cx;
      el.scrollTop += r.top + a.fy * r.height - a.cy;
    },
    [scrollRef, svgRef],
  );

  const apply = useCallback(
    (next: number, a: Anchor) => {
      const z = Math.min(MAX_ZOOM, Math.max(1, next));
      if (Math.abs(z - zoomRef.current) < 1e-3) {
        scrollToAnchor(a);
        return;
      }
      anchorRef.current = a;
      zoomRef.current = z;
      setZoom(z);
    },
    [scrollToAnchor],
  );

  // Nach dem Größenwechsel so scrollen, dass der Ankerpunkt an seinem Platz bleibt.
  useLayoutEffect(() => {
    const a = anchorRef.current;
    anchorRef.current = null;
    if (a) scrollToAnchor(a);
  }, [zoom, scrollToAnchor]);

  /** Zoom um die Mitte des sichtbaren Bereichs (Knöpfe). */
  const zoomBy = useCallback(
    (factor: number) => {
      const el = scrollRef.current;
      const r = svgRef.current?.getBoundingClientRect();
      if (!el || !r) return;
      const er = el.getBoundingClientRect();
      const cx = er.left + er.width / 2;
      const cy = er.top + er.height / 2;
      apply(zoomRef.current * factor, { fx: (cx - r.left) / r.width, fy: (cy - r.top) / r.height, cx, cy });
    },
    [scrollRef, svgRef, apply],
  );

  const reset = useCallback(() => {
    zoomRef.current = 1;
    setZoom(1);
    scrollRef.current?.scrollTo({ left: 0, top: 0 });
  }, [scrollRef]);

  // Neue Schrankvorlage oder Layoutwechsel: wieder alles zeigen.
  useEffect(() => {
    reset();
  }, [reset, enabled, cabinet.width, cabinet.height]);

  // Zwei-Finger-Zoom.
  useEffect(() => {
    const el = scrollRef.current;
    if (!enabled || !el) return;
    let pinch: { d: number; z: number; fx: number; fy: number } | null = null;
    const mid = (t: TouchList) => ({ x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 });
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const start = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const r = svgRef.current?.getBoundingClientRect();
      if (!r) return;
      pinchStartRef.current();
      const m = mid(e.touches);
      pinch = { d: Math.max(1, dist(e.touches)), z: zoomRef.current, fx: (m.x - r.left) / r.width, fy: (m.y - r.top) / r.height };
    };
    const move = (e: TouchEvent) => {
      if (!pinch || e.touches.length !== 2) return;
      if (e.cancelable) e.preventDefault();
      const m = mid(e.touches);
      apply((pinch.z * dist(e.touches)) / pinch.d, { fx: pinch.fx, fy: pinch.fy, cx: m.x, cy: m.y });
    };
    const end = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch = null;
    };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
    };
  }, [scrollRef, svgRef, enabled, apply]);

  const size = fit ? { width: fit.w * zoom, height: fit.h * zoom } : undefined;
  return { zoom, size, zoomBy, reset };
}
