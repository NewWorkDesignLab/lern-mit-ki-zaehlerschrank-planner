// ---------------------------------------------------------------------------
// Der gezeichnete Zählerschrank (ein einziges SVG in mm-Einheiten).
//
// Alles mit data-noexport (Auswahl, Vorschau, TE-Raster) wird beim PNG-Export
// entfernt. Sichtbare Optik nur über Präsentationsattribute – siehe PartGraphic.
// ---------------------------------------------------------------------------

import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
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
  movingUid?: string;
}

interface Props {
  svgRef: RefObject<SVGSVGElement>;
  project: Project;
  geo: CabinetGeo;
  selectedUid: string | null;
  preview: Preview | null;
  armed: boolean;
  onPartPointerDown: (uid: string, e: ReactPointerEvent) => void;
  onBackgroundClick: (clientX: number, clientY: number) => void;
}

export function CabinetCanvas({
  svgRef,
  project,
  geo,
  selectedUid,
  preview,
  armed,
  onPartPointerDown,
  onBackgroundClick,
}: Props) {
  return (
    <svg
      ref={svgRef}
      className={`cabinet-svg ${armed ? 'armed' : ''}`}
      viewBox={`0 0 ${geo.width} ${geo.height}`}
      xmlns="http://www.w3.org/2000/svg"
      onClick={(e) => onBackgroundClick(e.clientX, e.clientY)}
    >
      <CabinetBody geo={geo} placements={project.placements} />

      {project.placements.map((p) => (
        <PlacedPart
          key={p.uid}
          placement={p}
          geo={geo}
          selected={p.uid === selectedUid}
          ghost={preview?.movingUid === p.uid}
          onPointerDown={onPartPointerDown}
        />
      ))}

      {preview && <DropPreview preview={preview} geo={geo} />}
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

function PlacedPart({
  placement,
  geo,
  selected,
  ghost,
  onPointerDown,
}: {
  placement: Placement;
  geo: CabinetGeo;
  selected: boolean;
  ghost: boolean;
  onPointerDown: (uid: string, e: ReactPointerEvent) => void;
}) {
  const part = getPart(placement.partId);
  if (!part) return null;
  const box = partBox(geo, part, placement.field, placement.zone, placement.te);
  if (!box) return null;

  const labelY = box.kind === 'meter' ? box.z.y + box.z.h - 8 : box.z.y + box.z.h - 6;

  return (
    <g
      className="placed-part"
      opacity={ghost ? 0.35 : 1}
      onPointerDown={(e) => onPointerDown(placement.uid, e)}
      onClick={(e) => e.stopPropagation()}
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
