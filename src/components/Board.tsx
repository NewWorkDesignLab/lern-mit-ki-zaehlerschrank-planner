// ---------------------------------------------------------------------------
// Board: rendert den Zählerschrank als Zweige mit Steckplätzen.
// EIN Datenmodell, zwei Renderer-Stile (Klasse mode-game / mode-schematic).
// Der View-Toggle ändert nur die Optik, nie die Daten.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import type { LevelDefinition, PaletteItem, Placement, Slot, ViewMode } from '../domain/types';
import type { Violation } from '../domain/rules';
import { ComponentSymbol } from './ComponentSymbol';
import { Cabinet } from './Cabinet';

interface BoardProps {
  level: LevelDefinition;
  view: ViewMode;
  placement: Placement;
  violationBySlot: Record<string, Violation>;
  /** Ist gerade ein Palette-Bauteil zum Platzieren ausgewählt? */
  selecting: boolean;
  onPlace: (slotId: string, itemId: string) => void;
  onClear: (slotId: string) => void;
  onSlotClick: (slotId: string, infoKey: string) => void;
  onInfo: (infoKey: string) => void;
}

export function Board({
  level,
  view,
  placement,
  violationBySlot,
  selecting,
  onPlace,
  onClear,
  onSlotClick,
  onInfo,
}: BoardProps) {
  // Level mit hinterlegter Schrankgrafik werden in der Spielansicht
  // fotorealistisch gezeichnet. Die Fachansicht bleibt immer das Kartenraster.
  if (view === 'game' && level.cabinet) {
    return (
      <Cabinet
        level={level}
        art={level.cabinet}
        placement={placement}
        violationBySlot={violationBySlot}
        selecting={selecting}
        onPlace={onPlace}
        onClear={onClear}
        onSlotClick={onSlotClick}
        onInfo={onInfo}
      />
    );
  }

  return (
    <section className={`panel board mode-${view}`}>
      {level.branches.map((branch) => (
        <div className="branch" key={branch.id}>
          <div className="branch-head">
            <span className="branch-rail" />
            <h3>{branch.title}</h3>
          </div>
          <div className="slot-row">
            {branch.slots.map((slot) => (
              <SlotCard
                key={slot.id}
                view={view}
                slot={slot}
                placedItem={resolveItem(level, slot, placement)}
                violation={violationBySlot[slot.id]}
                selecting={selecting}
                onPlace={onPlace}
                onClear={onClear}
                onSlotClick={onSlotClick}
                onInfo={onInfo}
              />
            ))}
          </div>
        </div>
      ))}
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

interface SlotProps {
  view: ViewMode;
  slot: Slot;
  placedItem?: PaletteItem;
  violation?: Violation;
  selecting: boolean;
  onPlace: (slotId: string, itemId: string) => void;
  onClear: (slotId: string) => void;
  onSlotClick: (slotId: string, infoKey: string) => void;
  onInfo: (infoKey: string) => void;
}

function SlotCard({
  view,
  slot,
  placedItem,
  violation,
  selecting,
  onPlace,
  onClear,
  onSlotClick,
  onInfo,
}: SlotProps) {
  const [over, setOver] = useState(false);
  const fixed = slot.locked || !!slot.prefilledItemId;

  // Status: leer -> neutral; belegt & korrekt -> ok; belegt & Verstoß -> err.
  let status: 'neutral' | 'ok' | 'err' = 'neutral';
  if (!fixed) {
    if (violation && violation.code !== 'SLOT_EMPTY') status = 'err';
    else if (placedItem) status = 'ok';
  }
  const energized = status === 'ok' || fixed;

  const cls = [
    'slot',
    fixed ? 'locked' : '',
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
      onClick={() => onSlotClick(slot.id, slot.infoKey)}
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
      title="Klick für fachliche Infos"
    >
      {fixed && <span className="slot-badge locked">fest</span>}
      {status === 'ok' && <span className="slot-badge ok">✓ korrekt</span>}
      {status === 'err' && <span className="slot-badge err">! prüfen</span>}

      <div className="slot-top">
        <span className="slot-bmk">{slot.bmk}</span>
      </div>
      <div className="slot-title">{slot.title}</div>

      <div className="slot-body">
        {placedItem ? (
          <div className="placed">
            <ComponentSymbol kind={placedItem.kind} item={placedItem} view={view} size={34} />
            <div className="placed-label">
              <b>{placedItem.label}</b>
              <span>{fixed ? 'vorgegeben' : slot.bmk}</span>
            </div>
          </div>
        ) : (
          <div className="slot-empty">
            {selecting && !fixed ? 'Hier platzieren' : 'Bauteil wählen & hier klicken'}
          </div>
        )}

        <div className="slot-actions">
          <button
            className="icon-btn"
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
              className="icon-btn"
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

      {energized && <div className="flow" />}
      {status === 'err' && <div className="fault" />}
    </div>
  );
}
