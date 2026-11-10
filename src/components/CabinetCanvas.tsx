// ---------------------------------------------------------------------------
// Der gezeichnete Zählerschrank (ein einziges SVG in mm-Einheiten).
//
// Alles mit data-noexport (Auswahl, Vorschau, TE-Raster) wird beim PNG-Export
// entfernt. Sichtbare Optik nur über Präsentationsattribute – siehe PartGraphic.
// ---------------------------------------------------------------------------

import { useLayoutEffect, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { getPart } from '../catalog/parts';
import type { CabinetGeo, ZoneGeo } from '../domain/geometry';
import { FRAME, PHOTO_MAX_H, RAIL_H, TE_MM, getZoneGeo } from '../domain/geometry';
import { usedTe } from '../domain/layout';
import type { DropTarget } from '../domain/target';
import type { CatalogPart, Placement, Project } from '../domain/types';
import { PartOnRail, PhotoImage, fitArt } from './PartGraphic';

const FONT = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface Preview {
  part: CatalogPart;
  target: DropTarget;
}

interface Props {
  svgRef: RefObject<SVGSVGElement>;
  project: Project;
  geo: CabinetGeo;
  selectedUids: string[];
  previews: Preview[];
  /** Bauteile, die gerade gezogen werden (werden halbtransparent gezeichnet). */
  movingUids: string[];
  /** Spur des Auswahl-Pinsels in mm-Koordinaten (null = kein Pinsel aktiv). */
  brushPath: { x: number; y: number }[] | null;
  armed: boolean;
  /** Auswahl-Modus (Touch): Wischen pinselt statt zu scrollen. */
  selectMode: boolean;
  /** Touch-Layout: Wischen über nicht gewählte Bauteile scrollt den Schrank. */
  touchPan: boolean;
  /** Feste Größe in px (Zoom auf Touch-Layouts). */
  style?: CSSProperties;
  onPartPointerDown: (uid: string, e: ReactPointerEvent) => void;
  /** Tippen/Klicken auf ein Bauteil ohne Ziehen. */
  onPartTap: (uid: string) => void;
  onBackgroundPointerDown: (e: ReactPointerEvent) => void;
  /** `shiftKey`: beim Klick-Platzieren nur ein Teil setzen (siehe App). */
  onBackgroundClick: (clientX: number, clientY: number, shiftKey: boolean) => void;
  /** Mausposition über dem Schrank (für die Vorschau beim Klick-Platzieren). */
  onHover: (pos: { x: number; y: number } | null) => void;
  onDuplicate: (uid: string) => void;
  onRemove: (uid: string) => void;
  onRemoveMany: (uids: string[]) => void;
}

export function CabinetCanvas({
  svgRef,
  project,
  geo,
  selectedUids,
  previews,
  movingUids,
  brushPath,
  armed,
  selectMode,
  touchPan,
  style,
  onPartPointerDown,
  onPartTap,
  onBackgroundPointerDown,
  onBackgroundClick,
  onHover,
  onDuplicate,
  onRemove,
  onRemoveMany,
}: Props) {
  // mm pro Bildschirmpixel – damit die Bedienknöpfe unabhängig vom Zoom gleich groß sind.
  const [mmPerPx, setMmPerPx] = useState(1);
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const update = () => {
      const ctm = svg.getScreenCTM();
      if (ctm && ctm.a > 0) setMmPerPx(1 / ctm.a);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(svg);
    return () => ro.disconnect();
  }, [svgRef, geo]);

  const selectedSet = new Set(selectedUids);
  const movingSet = new Set(movingUids);
  // Duplizieren/Entfernen-Knöpfe nur bei genau einem gewählten Teil.
  const selected =
    selectedUids.length === 1 ? project.placements.find((p) => p.uid === selectedUids[0]) : undefined;

  return (
    <svg
      ref={svgRef}
      className={`cabinet-svg ${armed ? 'armed' : ''} ${brushPath ? 'brushing' : ''} ${selectMode ? 'select-mode' : ''} ${touchPan ? 'touch-pan' : ''}`}
      style={style}
      viewBox={`0 0 ${geo.width} ${geo.height}`}
      xmlns="http://www.w3.org/2000/svg"
      onPointerDown={onBackgroundPointerDown}
      onClick={(e) => onBackgroundClick(e.clientX, e.clientY, e.shiftKey)}
      onPointerMove={(e) => onHover({ x: e.clientX, y: e.clientY })}
      onPointerLeave={() => onHover(null)}
    >
      <CabinetBody geo={geo} placements={project.placements} />

      {project.placements.map((p) => (
        <PlacedPart
          key={p.uid}
          placement={p}
          geo={geo}
          selected={selectedSet.has(p.uid)}
          ghost={movingSet.has(p.uid)}
          onPointerDown={onPartPointerDown}
          onTap={onPartTap}
        />
      ))}

      {selected && movingUids.length === 0 && (
        <SelectionTools placement={selected} geo={geo} k={mmPerPx} onDuplicate={onDuplicate} onRemove={onRemove} />
      )}

      {selectedUids.length > 1 && movingUids.length === 0 && (
        <GroupTools
          placements={project.placements.filter((p) => selectedSet.has(p.uid))}
          geo={geo}
          k={mmPerPx}
          onRemoveMany={onRemoveMany}
        />
      )}

      {previews.map((preview, i) => (
        <DropPreview key={i} preview={preview} geo={geo} />
      ))}

      {brushPath && brushPath.length > 1 && (
        <polyline
          data-noexport=""
          className="brush-trail"
          points={brushPath.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#d97706"
          strokeOpacity={0.28}
          strokeWidth={16 * mmPerPx}
          strokeLinecap="round"
          strokeLinejoin="round"
          pointerEvents="none"
        />
      )}
    </svg>
  );
}

// --- Gehäuse ----------------------------------------------------------------

function CabinetBody({ geo, placements }: { geo: CabinetGeo; placements: Placement[] }) {
  return (
    <g>
      <rect x={0} y={0} width={geo.width} height={geo.height} rx={14} fill="#d9dde3" stroke="#a7afb9" strokeWidth={1.2} />
      <rect
        x={FRAME / 2}
        y={FRAME / 2}
        width={geo.width - FRAME}
        height={geo.height - FRAME}
        rx={8}
        fill="#eceff3"
        stroke="#c3c9d1"
        strokeWidth={0.8}
      />
      {/* Schrauben in den Ecken */}
      {[
        [8, 8],
        [geo.width - 8, 8],
        [8, geo.height - 8],
        [geo.width - 8, geo.height - 8],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3.2} fill="#f5f6f8" stroke="#8d96a1" strokeWidth={0.6} />
      ))}

      {geo.fields.map((f, fi) => (
        <g key={fi}>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} fill="#f6f7f9" stroke="#b9c0c9" strokeWidth={0.8} />
          <text x={f.x + 8} y={f.y + 16} fontSize={9} fontFamily={FONT} fontWeight={700} fill="#37474f">
            {f.name}
          </text>
          {f.zones.map((z) => (
            <ZoneBody key={z.index} z={z} placements={placements} />
          ))}
        </g>
      ))}
    </g>
  );
}

function ZoneBody({ z, placements }: { z: ZoneGeo; placements: Placement[] }) {
  const label = (
    <text x={z.x + 8} y={z.y + 13} fontSize={6.5} fontFamily={FONT} fill="#607080">
      {z.zone.label}
    </text>
  );

  if (z.zone.kind === 'meter') {
    const occupied = placements.some((p) => p.field === z.field && p.zone === z.index);
    return (
      <g>
        <line x1={z.x} x2={z.x + z.w} y1={z.y} y2={z.y} stroke="#cfd5dc" strokeWidth={0.8} />
        {label}
        {!occupied && (
          <g>
            <rect
              x={z.x + 20}
              y={z.y + 24}
              width={z.w - 40}
              height={z.h - 44}
              rx={4}
              fill="none"
              stroke="#9aa5b1"
              strokeWidth={0.8}
              strokeDasharray="5 4"
            />
            <text x={z.x + z.w / 2} y={z.y + z.h / 2} fontSize={8} textAnchor="middle" fontFamily={FONT} fill="#8a96a3">
              Zähler hier platzieren
            </text>
          </g>
        )}
      </g>
    );
  }

  if (z.zone.kind === 'blank') {
    return (
      <g>
        <line x1={z.x} x2={z.x + z.w} y1={z.y} y2={z.y} stroke="#cfd5dc" strokeWidth={0.8} />
        <rect x={z.x + 14} y={z.y + 20} width={z.w - 28} height={z.h - 34} rx={4} fill="#e9ecf0" stroke="#c7ced6" strokeWidth={0.6} />
        <text x={z.x + z.w / 2} y={z.y + z.h / 2} fontSize={7.5} textAnchor="middle" fontFamily={FONT} fill="#7a8794">
          {z.zone.label}
        </text>
      </g>
    );
  }

  const te = z.zone.te;
  const railW = te * TE_MM;
  const used = usedTe(placements, z.field, z.index);
  const slots = Math.floor(railW / 14);
  return (
    <g>
      <line x1={z.x} x2={z.x + z.w} y1={z.y} y2={z.y} stroke="#cfd5dc" strokeWidth={0.8} />
      {label}
      <text
        x={z.x + z.w - 8}
        y={z.y + 13}
        fontSize={6.5}
        textAnchor="end"
        fontFamily={FONT}
        fill={used >= te ? '#c62828' : '#607080'}
      >
        {formatTe(used)}/{te} TE
      </text>
      {/* Hutschiene TS 35 */}
      <rect x={z.railX - 6} y={z.railY - RAIL_H / 2} width={railW + 12} height={RAIL_H} rx={1.5} fill="#b7bec7" stroke="#8c96a1" strokeWidth={0.6} />
      <rect x={z.railX - 6} y={z.railY - RAIL_H / 2 + 5} width={railW + 12} height={RAIL_H - 10} fill="#cfd5dc" />
      {Array.from({ length: slots }, (_, i) => (
        <rect key={i} x={z.railX + 3 + i * 14} y={z.railY - 2.5} width={8} height={5} rx={2.5} fill="#9aa4ae" />
      ))}
      {/* TE-Raster nur im Editor */}
      <g data-noexport="">
        {Array.from({ length: te + 1 }, (_, i) => (
          <line
            key={i}
            x1={z.railX + i * TE_MM}
            x2={z.railX + i * TE_MM}
            y1={z.railY + RAIL_H / 2 + 1}
            y2={z.railY + RAIL_H / 2 + 5}
            stroke="#b0b8c1"
            strokeWidth={0.5}
          />
        ))}
      </g>
    </g>
  );
}

export function formatTe(te: number): string {
  return Number.isInteger(te) ? String(te) : te.toFixed(1).replace('.', ',');
}

// --- Bauteile -----------------------------------------------------------------

function partBox(geo: CabinetGeo, part: CatalogPart, field: number, zone: number, te: number) {
  const z = getZoneGeo(geo, field, zone);
  if (!z) return null;
  if (z.zone.kind === 'meter') {
    const boxW = z.w - 40;
    const boxH = z.h - 44;
    const s = part.art ? fitArt(part.art, boxW, boxH) : { w: boxW, h: boxH };
    return { kind: 'meter' as const, z, x: z.x + (z.w - s.w) / 2, y: z.y + 24 + (boxH - s.h) / 2, w: s.w, h: s.h };
  }
  const w = part.widthTE * TE_MM;
  const x = z.railX + te * TE_MM;
  return { kind: 'rail' as const, z, x, y: z.railY - PHOTO_MAX_H / 2, w, h: PHOTO_MAX_H };
}

function PartShape({ part, box }: { part: CatalogPart; box: NonNullable<ReturnType<typeof partBox>> }) {
  if (box.kind === 'meter') {
    return part.art ? (
      <PhotoImage art={part.art} x={box.x} y={box.y} w={box.w} h={box.h} />
    ) : (
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={4} fill="#e0e4e8" stroke="#8d96a1" />
    );
  }
  return <PartOnRail part={part} x={box.x} w={box.w} cy={box.z.railY} maxH={PHOTO_MAX_H} />;
}

function bmkLabelY(box: NonNullable<ReturnType<typeof partBox>>): number {
  return box.kind === 'meter' ? box.z.y + box.z.h - 8 : box.z.y + box.z.h - 6;
}

/** Runder Bedienknopf im Schrank; Größen in Bildschirmpixeln, umgerechnet mit k = mm/px. */
function ToolButton({
  cx,
  cy,
  k,
  title,
  fill,
  onPress,
  children,
}: {
  cx: number;
  cy: number;
  k: number;
  title: string;
  fill: string;
  onPress: () => void;
  children: JSX.Element;
}) {
  return (
    <g
      className="sel-tool"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onPress();
      }}
    >
      <title>{title}</title>
      <circle cx={cx} cy={cy} r={12 * k} fill={fill} stroke="#ffffff" strokeWidth={2 * k} />
      <g
        transform={`translate(${cx} ${cy}) scale(${k})`}
        stroke="#ffffff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {children}
      </g>
    </g>
  );
}

const ICON_REMOVE = <path d="M -4.5 -4.5 L 4.5 4.5 M 4.5 -4.5 L -4.5 4.5" />;

/**
 * Knöpfe am gewählten Bauteil: Duplizieren oberhalb, Entfernen (rot) unterhalb
 * der Beschriftung – bewusst weit auseinander, damit man sich nicht verklickt.
 * Größen in Bildschirmpixeln, umgerechnet mit k = mm/px.
 */
function SelectionTools({
  placement,
  geo,
  k,
  onDuplicate,
  onRemove,
}: {
  placement: Placement;
  geo: CabinetGeo;
  k: number;
  onDuplicate: (uid: string) => void;
  onRemove: (uid: string) => void;
}) {
  const part = getPart(placement.partId);
  if (!part) return null;
  const box = partBox(geo, part, placement.field, placement.zone, placement.te);
  if (!box) return null;

  const cx = box.x + box.w / 2;
  const dupY = box.y - 16 * k;
  const delY = Math.max(box.y + box.h, bmkLabelY(box)) + 18 * k;

  return (
    <g data-noexport="">
      <ToolButton cx={cx} cy={dupY} k={k} title="Duplizieren" fill="#d97706" onPress={() => onDuplicate(placement.uid)}>
        <>
          <rect x={-5.5} y={-2.5} width={8} height={8} rx={1.5} />
          <path d="M -2.5 -2.5 V -5.5 H 5.5 V 2.5 H 2.5" />
        </>
      </ToolButton>
      <ToolButton cx={cx} cy={delY} k={k} title="Entfernen" fill="#dc2626" onPress={() => onRemove(placement.uid)}>
        {ICON_REMOVE}
      </ToolButton>
    </g>
  );
}

/** Mehrfachauswahl: ein roter Entfernen-Knopf mittig unter allen gewählten Bauteilen. */
function GroupTools({
  placements,
  geo,
  k,
  onRemoveMany,
}: {
  placements: Placement[];
  geo: CabinetGeo;
  k: number;
  onRemoveMany: (uids: string[]) => void;
}) {
  const boxes = placements.flatMap((p) => {
    const part = getPart(p.partId);
    const box = part && partBox(geo, part, p.field, p.zone, p.te);
    return box ? [box] : [];
  });
  if (boxes.length === 0) return null;
  const left = Math.min(...boxes.map((b) => b.x));
  const right = Math.max(...boxes.map((b) => b.x + b.w));
  const bottom = Math.max(...boxes.map((b) => Math.max(b.y + b.h, bmkLabelY(b))));
  return (
    <g data-noexport="">
      <ToolButton
        cx={(left + right) / 2}
        cy={bottom + 18 * k}
        k={k}
        title={`${placements.length} Bauteile entfernen`}
        fill="#dc2626"
        onPress={() => onRemoveMany(placements.map((p) => p.uid))}
      >
        {ICON_REMOVE}
      </ToolButton>
    </g>
  );
}

function PlacedPart({
  placement,
  geo,
  selected,
  ghost,
  onPointerDown,
  onTap,
}: {
  placement: Placement;
  geo: CabinetGeo;
  selected: boolean;
  ghost: boolean;
  onPointerDown: (uid: string, e: ReactPointerEvent) => void;
  onTap: (uid: string) => void;
}) {
  const part = getPart(placement.partId);
  if (!part) return null;
  const box = partBox(geo, part, placement.field, placement.zone, placement.te);
  if (!box) return null;

  const labelY = bmkLabelY(box);

  return (
    <g
      className={`placed-part ${selected ? 'is-selected' : ''}`}
      data-uid={placement.uid}
      opacity={ghost ? 0.35 : 1}
      onPointerDown={(e) => onPointerDown(placement.uid, e)}
      onClick={(e) => {
        e.stopPropagation();
        onTap(placement.uid);
      }}
    >
      {/* Unsichtbare Trefferfläche über die volle Bauteilbreite */}
      <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="transparent" />
      <PartShape part={part} box={box} />
      {placement.bmk && (
        <text
          x={box.x + box.w / 2}
          y={labelY}
          fontSize={box.w < 20 ? 5 : 6.5}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={700}
          fill="#1f2d3a"
        >
          {placement.bmk}
        </text>
      )}
      {selected && (
        <rect
          data-noexport=""
          x={box.x - 1.5}
          y={box.y - 1.5}
          width={box.w + 3}
          height={box.h + 3}
          rx={3}
          fill="none"
          stroke="#d97706"
          strokeWidth={1.6}
        />
      )}
    </g>
  );
}

function DropPreview({ preview, geo }: { preview: Preview; geo: CabinetGeo }) {
  const { part, target } = preview;
  const box = partBox(geo, part, target.field, target.zone, target.te);
  if (!box) return null;
  const color = target.valid ? '#059669' : '#dc2626';
  return (
    <g data-noexport="" pointerEvents="none">
      {target.valid && (
        <g opacity={0.6}>
          <PartShape part={part} box={box} />
        </g>
      )}
      <rect
        x={box.x - 1}
        y={box.y - 1}
        width={box.w + 2}
        height={box.h + 2}
        rx={3}
        fill={target.valid ? 'rgba(5,150,105,0.10)' : 'rgba(220,38,38,0.12)'}
        stroke={color}
        strokeWidth={1.4}
        strokeDasharray="4 3"
      />
    </g>
  );
}
