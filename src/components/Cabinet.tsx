// ---------------------------------------------------------------------------
// Cabinet: die fotorealistische Spielansicht eines Levels.
//
// Gerendert wird die Schrankgrafik plus ein absolut positioniertes Feld je
// Steckplatz – exakt auf den gestrichelten Platzhaltern der Vorlage. Die
// Interaktion (Klick-Auswahl, Drag & Drop, Info, Entfernen) ist bewusst
// identisch zur Kartenansicht in Board.tsx: es sind dieselben Callbacks auf
// demselben Datenmodell, nur anders gezeichnet.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import type { CSSProperties } from 'react';
import type {
  CabinetArt,
  LevelDefinition,
  PaletteItem,
  Placement,
  Rect,
  Slot,
} from '../domain/types';
import type { Violation } from '../domain/rules';
import { PartImage } from './PartImage';

interface CabinetProps {
  level: LevelDefinition;
  art: CabinetArt;
  placement: Placement;
  violationBySlot: Record<string, Violation>;
  selecting: boolean;
  onPlace: (slotId: string, itemId: string) => void;
  onClear: (slotId: string) => void;
  onSlotClick: (slotId: string, infoKey: string) => void;
  onInfo: (infoKey: string) => void;
}

export function Cabinet({
  level,
  art,
  placement,
  violationBySlot,
  selecting,
  onPlace,
  onClear,
  onSlotClick,
  onInfo,
}: CabinetProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const slots = level.branches.flatMap((b) => b.slots);
  const hovered = slots.find((s) => s.id === hoveredId);

  // Die Grafik trägt ihr Seitenverhältnis selbst – so bleibt das CSS
  // levelunabhängig, falls später weitere Schränke dazukommen.
  const frameStyle = { '--cab-aspect': art.aspect } as CSSProperties;

  return (
    <section className="panel board board-cabinet">
      <div className="cabinet" style={frameStyle}>
        <img
          className="cabinet-bg"
          src={art.background}
          alt={`Zählerschrank ${level.title}`}
          draggable={false}
        />

        {slots.map((slot) => {
          const rect = art.slotRects[slot.id];
          if (!rect) return null;
          return (
            <CabinetSlot
              key={slot.id}
              slot={slot}
              rect={rect}
              art={art}
              placedItem={resolveItem(level, slot, placement)}
              violation={violationBySlot[slot.id]}
              selecting={selecting}
              onPlace={onPlace}
              onClear={onClear}
              onSlotClick={onSlotClick}
              onInfo={onInfo}
              onHover={setHoveredId}
            />
          );
        })}
      </div>

      <p className="cabinet-caption">
        {hovered ? (
          <>
            <b>{hovered.bmk}</b>
            <span className="cabinet-caption-title">{hovered.title}</span>
            <span className="cabinet-caption-desc">{hovered.description}</span>
          </>
        ) : (
          <span className="cabinet-caption-desc">
            Bauteil links wählen und auf einen Steckplatz klicken – oder direkt hineinziehen.
            Steckplatz anklicken öffnet die fachlichen Infos.
          </span>
        )}
      </p>
    </section>
  );
}

function resolveItem(
  level: LevelDefinition,
  slot: Slot,
  placement: Placement,
): PaletteItem | undefined {
  const id = slot.prefilledItemId ?? placement[slot.id];
  return level.palette.find((p) => p.id === id);
}

interface CabinetSlotProps {
  slot: Slot;
  rect: Rect;
  art: CabinetArt;
  placedItem?: PaletteItem;
  violation?: Violation;
  selecting: boolean;
  onPlace: (slotId: string, itemId: string) => void;
  onClear: (slotId: string) => void;
  onSlotClick: (slotId: string, infoKey: string) => void;
  onInfo: (infoKey: string) => void;
  onHover: (slotId: string | null) => void;
}

function CabinetSlot({
  slot,
  rect,
  art,
  placedItem,
  violation,
  selecting,
  onPlace,
  onClear,
  onSlotClick,
  onInfo,
  onHover,
}: CabinetSlotProps) {
  const [over, setOver] = useState(false);
  const fixed = slot.locked || !!slot.prefilledItemId;

  // Statuslogik bewusst identisch zur Kartenansicht (SlotCard in Board.tsx).
  let status: 'neutral' | 'ok' | 'err' = 'neutral';
  if (!fixed) {
    if (violation && violation.code !== 'SLOT_EMPTY') status = 'err';
    else if (placedItem) status = 'ok';
  }

  // Vorgesteckte Geräte (SLS, Zähler) sind bereits in die Grafik gerendert –
  // ihr Steckplatz ist hier nur noch Klickfläche fürs Infofeld.
  const partArt = placedItem ? art.parts[placedItem.id] : undefined;

  const cls = [
    'cabinet-slot',
    fixed ? 'fixed' : '',
    over ? 'dropactive' : '',
    selecting && !fixed ? 'targetable' : '',
    status === 'ok' ? 'status-ok' : '',
    status === 'err' ? 'status-err' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cls}
      style={{
        left: `${rect.x * 100}%`,
        top: `${rect.y * 100}%`,
        width: `${rect.w * 100}%`,
        height: `${rect.h * 100}%`,
      }}
      onClick={() => onSlotClick(slot.id, slot.infoKey)}
      onMouseEnter={() => onHover(slot.id)}
      onMouseLeave={() => onHover(null)}
      onDragOver={(e) => {
        if (fixed) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (fixed) return;
        e.preventDefault();
        setOver(false);
        const itemId = e.dataTransfer.getData('text/plain');
        if (itemId) onPlace(slot.id, itemId);
      }}
      title={`${slot.bmk} – ${slot.title}`}
    >
      {partArt && placedItem && <PartImage art={partArt} label={placedItem.label} />}

      {status === 'ok' && <span className="cabinet-mark ok">✓</span>}
      {status === 'err' && <span className="cabinet-mark err">!</span>}

      <div className="cabinet-slot-actions">
        <button
          className="cabinet-btn"
          title="Fachliche Infos"
          onClick={(e) => {
            e.stopPropagation();
            onInfo(slot.infoKey);
          }}
        >
          i
        </button>
        {!fixed && placedItem && (
          <button
            className="cabinet-btn"
            title="Bauteil entfernen"
            onClick={(e) => {
              e.stopPropagation();
              onClear(slot.id);
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
