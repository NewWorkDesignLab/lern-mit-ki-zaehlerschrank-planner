// ---------------------------------------------------------------------------
// PNG-Export: Kopfzeile + Schrank (aus dem Live-SVG geklont) + Stückliste und
// Notizen als ein hohes Bild – gut lesbar am Handy beim Aufbau.
//
// Ablauf: SVG klonen → Editor-Elemente (data-noexport) entfernen → Bildquellen
// als Data-URI einbetten → zusammen mit Kopf/Stückliste in ein neues SVG →
// über <img> in ein Canvas zeichnen → PNG.
// ---------------------------------------------------------------------------

import { getPart } from '../catalog/parts';
import { getTemplate } from '../catalog/templates';
import type { CabinetGeo } from '../domain/geometry';
import type { Project } from '../domain/types';
import { buildBom } from '../components/BillOfMaterials';
import { downloadBlob, fileSlug } from './file';

const NS = 'http://www.w3.org/2000/svg';
const FONT = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
/** Pixel pro mm im Export. */
const SCALE = 3;
const MARGIN = 20;

function el(tag: string, attrs: Record<string, string | number>, text?: string): SVGElement {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text !== undefined) e.textContent = text;
  return e;
}

const dataUrlCache = new Map<string, Promise<string>>();
function toDataUrl(src: string): Promise<string> {
  let p = dataUrlCache.get(src);
  if (!p) {
    p = fetch(src)
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(String(fr.result));
            fr.onerror = () => reject(fr.error);
            fr.readAsDataURL(blob);
          }),
      );
    dataUrlCache.set(src, p);
  }
  return p;
}

/** Text auf eine maximale Zeichenzahl kürzen. */
function clip(s: string, max: number): string {
  return s.length > max ? s.slice(0, Math.max(1, max - 1)) + '…' : s;
}

export async function exportPng(svg: SVGSVGElement, project: Project, geo: CabinetGeo) {
  // 1) Schrank klonen und für den Export bereinigen
  const cabinet = svg.cloneNode(true) as SVGSVGElement;
  cabinet.querySelectorAll('[data-noexport]').forEach((n) => n.remove());
  await Promise.all(
    [...cabinet.querySelectorAll('image')].map(async (img) => {
      const href = img.getAttribute('href');
      if (href && !href.startsWith('data:')) img.setAttribute('href', await toDataUrl(href));
    }),
  );

  // 2) Layout des Gesamtbilds (in mm)
  const W = Math.max(geo.width + MARGIN * 2, 560);
  const bom = buildBom(project);
  const notes = project.placements
    .filter((p) => p.note?.trim())
    .map((p) => `${p.bmk || getPart(p.partId)?.name || ''}: ${p.note!.trim()}`);

  const HEADER_H = 46;
  const ROW = 10;
  const cabY = HEADER_H;
  const bomY = cabY + geo.height + 22;
  const bomH = 16 + (bom.length + 1) * ROW;
  const notesY = bomY + bomH + 10;
  const notesH = notes.length ? 16 + notes.length * ROW : 0;
  const H = notesY + notesH + MARGIN;

  const root = el('svg', {
    xmlns: NS,
    width: W * SCALE,
    height: H * SCALE,
    viewBox: `0 0 ${W} ${H}`,
  }) as SVGSVGElement;
  root.appendChild(el('rect', { x: 0, y: 0, width: W, height: H, fill: '#ffffff' }));

  // Kopf
  const template = getTemplate(project.templateId);
  const date = new Date().toLocaleDateString('de-DE');
  root.appendChild(
    el('text', { x: MARGIN, y: 22, 'font-size': 13, 'font-weight': 700, 'font-family': FONT, fill: '#0f172a' }, project.name.trim() || 'Zählerschrank'),
  );
  root.appendChild(
    el(
      'text',
      { x: MARGIN, y: 34, 'font-size': 6.5, 'font-family': FONT, fill: '#64748b' },
      `${template?.name ?? ''} · ${project.placements.length} Bauteile · ${date} · Zählerschrank-Planer`,
    ),
  );

  // Schrank
  cabinet.setAttribute('x', String((W - geo.width) / 2));
  cabinet.setAttribute('y', String(cabY));
  cabinet.setAttribute('width', String(geo.width));
  cabinet.setAttribute('height', String(geo.height));
  cabinet.removeAttribute('class');
  root.appendChild(cabinet);

  // Stückliste
  const cols = { qty: MARGIN, name: MARGIN + 16, maker: W * 0.52, art: W * 0.66, bmk: W * 0.8 };
  const chars = (from: number, to: number, size: number) => Math.floor((to - from) / (size * 0.52));
  root.appendChild(
    el('text', { x: MARGIN, y: bomY + 8, 'font-size': 9, 'font-weight': 700, 'font-family': FONT, fill: '#0f172a' }, 'Stückliste'),
  );
  const head = bomY + 8 + ROW;
  const headAttrs = { 'font-size': 5.5, 'font-weight': 700, 'font-family': FONT, fill: '#64748b' };
  root.appendChild(el('text', { ...headAttrs, x: cols.qty, y: head }, 'Anz.'));
  root.appendChild(el('text', { ...headAttrs, x: cols.name, y: head }, 'Bauteil'));
  root.appendChild(el('text', { ...headAttrs, x: cols.maker, y: head }, 'Hersteller'));
  root.appendChild(el('text', { ...headAttrs, x: cols.art, y: head }, 'Art.-Nr.'));
  root.appendChild(el('text', { ...headAttrs, x: cols.bmk, y: head }, 'BMK'));

  const fs = 6;
  bom.forEach((r, i) => {
    const y = head + (i + 1) * ROW;
    const a = { 'font-size': fs, 'font-family': FONT, fill: '#1e293b' };
    if (i % 2 === 0) {
      root.appendChild(el('rect', { x: MARGIN - 3, y: y - 6.8, width: W - 2 * MARGIN + 6, height: ROW, fill: '#f1f5f9' }));
    }
    root.appendChild(el('text', { ...a, x: cols.qty, y, 'font-weight': 700 }, `${r.qty}×`));
    root.appendChild(el('text', { ...a, x: cols.name, y }, clip(r.part.name, chars(cols.name, cols.maker - 4, fs))));
    root.appendChild(el('text', { ...a, x: cols.maker, y }, clip(r.part.manufacturer, chars(cols.maker, cols.art - 4, fs))));
    root.appendChild(el('text', { ...a, x: cols.art, y }, clip(r.part.articleNo ?? '–', chars(cols.art, cols.bmk - 4, fs))));
    root.appendChild(el('text', { ...a, x: cols.bmk, y }, clip(r.bmks.join(', '), chars(cols.bmk, W - MARGIN, fs))));
  });

  // Notizen
  if (notes.length) {
    root.appendChild(
      el('text', { x: MARGIN, y: notesY + 8, 'font-size': 9, 'font-weight': 700, 'font-family': FONT, fill: '#0f172a' }, 'Notizen'),
    );
    notes.forEach((n, i) => {
      root.appendChild(
        el(
          'text',
          { x: MARGIN, y: notesY + 8 + (i + 1) * ROW, 'font-size': fs, 'font-family': FONT, fill: '#1e293b' },
          clip(n, chars(MARGIN, W - MARGIN, fs)),
        ),
      );
    });
  }

  // 3) Rendern
  const xml = new XMLSerializer().serializeToString(root);
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(W * SCALE);
    canvas.height = Math.round(H * SCALE);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas nicht verfügbar.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!png) throw new Error('PNG konnte nicht erzeugt werden.');
    downloadBlob(png, `${fileSlug(project.name)}.png`);
  } finally {
    URL.revokeObjectURL(url);
  }
}
