// ---------------------------------------------------------------------------
// Palette: ziehbare Bauteile. Gesperrte / vorgesteckte Bauteile (SLS, Zähler)
// erscheinen hier bewusst NICHT – sie sind Netzbetreiber-/Werksseitig gesetzt.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import type { LevelDefinition, PaletteItem, ViewMode } from '../domain/types';
import { ComponentSymbol } from './ComponentSymbol';
import { PartImage } from './PartImage';

/** Seitenverhältnis von .chip-sym.photo – begrenzt breite Geräte im Chip. */
const CHIP_ASPECT = 52 / 44;

interface Props {
  level: LevelDefinition;
  view: ViewMode;
  selectedItemId: string | null;
  onSelect: (itemId: string, infoKey: string) => void;
}

const GROUP_LABEL: Record<string, string> = {
  USS: 'Überspannungsschutz',
  CONTACTOR: 'Lastmanagement / Steuerung',
  RCD: 'Fehlerstromschutz (RCD)',
  LS: 'Leitungsschutz (LS)',
};

export function Palette({ level, view, selectedItemId, onSelect }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);

  // Nur nicht-vorgesteckte Bauteile sind ziehbar.
  const draggable = level.palette.filter(
    (p) => p.id !== 'pf-sls' && p.id !== 'pf-meter',
  );

  const groups: Record<string, PaletteItem[]> = {};
  for (const item of draggable) {
    (groups[item.kind] ??= []).push(item);
  }

  return (
    <aside className="panel palette">
      <h2 className="panel-title">Bauteile</h2>
      {Object.entries(groups).map(([kind, items]) => (
        <div className="palette-group" key={kind}>
          <p className="palette-group-label">{GROUP_LABEL[kind] ?? kind}</p>
          {items.map((item) => (
            <button
              key={item.id}
              className={`chip ${dragId === item.id ? 'dragging' : ''} ${
                selectedItemId === item.id ? 'selected' : ''
              }`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', item.id);
                e.dataTransfer.effectAllowed = 'copy';
                setDragId(item.id);
              }}
              onDragEnd={() => setDragId(null)}
              onClick={() => onSelect(item.id, item.infoKey)}
              title="Klick zum Auswählen, dann Steckplatz anklicken · oder ziehen"
            >
              <ChipSymbol level={level} view={view} item={item} />
              <span className="chip-body">
                <b>{item.label}</b>
                <span>{chipSubtitle(item)}</span>
              </span>
            </button>
          ))}
        </div>
      ))}
      <p className="palette-hint">
        <b>Bauteil anklicken</b> zum Auswählen, dann den <b>Steckplatz</b> anklicken –
        oder per Drag &amp; Drop ziehen. Der <b>SLS</b> ist plombiert (Netzbetreiber) und
        daher nicht wählbar.
      </p>
    </aside>
  );
}

/**
 * Symbol im Chip: in der Spielansicht das echte Bauteilfoto – dasselbe Bild,
 * das später im Schrank steckt. Die Fachansicht bleibt beim Schaltzeichen.
 */
function ChipSymbol({
  level,
  view,
  item,
}: {
  level: LevelDefinition;
  view: ViewMode;
  item: PaletteItem;
}) {
  const art = view === 'game' ? level.cabinet?.parts[item.id] : undefined;
  if (!art) {
    return (
      <span className="chip-sym">
        <ComponentSymbol kind={item.kind} item={item} view={view} size={28} />
      </span>
    );
  }
  return (
    <span className="chip-sym photo">
      <PartImage art={art} label={item.label} fill={0.92} boxAspect={CHIP_ASPECT} />
    </span>
  );
}

function chipSubtitle(item: PaletteItem): string {
  if (item.kind === 'RCD') return `${item.ratedResidualMa ?? 30} mA · Erkennungstyp ${item.rcdType}`;
  if (item.kind === 'LS') return `Charakteristik ${item.tripChar} · ${item.ratingA} A`;
  if (item.kind === 'USS') return 'transiente Überspannung ableiten';
  if (item.kind === 'CONTACTOR') return 'schaltet die WP aktiv (SG-Ready)';
  return '';
}
