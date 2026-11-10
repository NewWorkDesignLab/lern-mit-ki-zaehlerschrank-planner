// ---------------------------------------------------------------------------
// Bauteilbibliothek: Filter nach Hersteller, Suche, Gruppen nach Kategorie.
// Bauteil ziehen ODER anklicken (auswählen) und dann in den Schrank klicken.
// ---------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { CATALOG, CATEGORY_LABEL, CATEGORY_ORDER, MANUFACTURERS } from '../catalog/parts';
import type { CatalogPart } from '../domain/types';
import { formatTe } from './CabinetCanvas';
import { PartThumb } from './PartGraphic';

interface Props {
  armedPartId: string | null;
  onChipPointerDown: (partId: string, e: ReactPointerEvent) => void;
  onChipClick: (partId: string) => void;
}

/** Katalog nach Hersteller und Suchbegriff filtern (auch fürs Katalog-Dock). */
export function filterCatalog(manufacturer: string, query: string): CatalogPart[] {
  const q = query.trim().toLowerCase();
  return CATALOG.filter(
    (p) =>
      (!manufacturer || p.manufacturer === manufacturer) &&
      (!q ||
        [p.name, p.manufacturer, p.articleNo ?? '', CATEGORY_LABEL[p.category], ...Object.values(p.specs)]
          .join(' ')
          .toLowerCase()
          .includes(q)),
  );
}

export function Library({ armedPartId, onChipPointerDown, onChipClick }: Props) {
  const [manufacturer, setManufacturer] = useState('');
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const list = filterCatalog(manufacturer, query);
    return CATEGORY_ORDER.map((cat) => ({ cat, items: list.filter((p) => p.category === cat) })).filter(
      (g) => g.items.length > 0,
    );
  }, [manufacturer, query]);

  return (
    <aside className="panel library">
      <h2 className="panel-title">Bauteile</h2>
      <div className="library-filters">
        <select value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} aria-label="Hersteller">
          <option value="">Alle Hersteller</option>
          {MANUFACTURERS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Suchen (z. B. B16, Typ B)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="library-list">
        {groups.length === 0 && <p className="muted">Keine Bauteile gefunden.</p>}
        {groups.map(({ cat, items }) => (
          <div className="library-group" key={cat}>
            <p className="library-group-label">{CATEGORY_LABEL[cat]}</p>
            {items.map((part) => (
              <Chip
                key={part.id}
                part={part}
                armed={armedPartId === part.id}
                onPointerDown={onChipPointerDown}
                onClick={onChipClick}
              />
            ))}
          </div>
        ))}
      </div>

      <p className="library-hint">
        Bauteil in den Schrank <b>ziehen</b> – oder <b>anklicken</b> und dann auf eine Hutschiene
        klicken (mehrfach möglich; Rechtsklick, <kbd>Esc</kbd> oder daneben klicken beendet). Technische Daten sind Beispieldaten –
        vor dem Aufbau mit dem Datenblatt abgleichen.
      </p>
    </aside>
  );
}

function Chip({
  part,
  armed,
  onPointerDown,
  onClick,
}: {
  part: CatalogPart;
  armed: boolean;
  onPointerDown: (partId: string, e: ReactPointerEvent) => void;
  onClick: (partId: string) => void;
}) {
  const sub = Object.values(part.specs).slice(0, 3).join(' · ');
  return (
    <button
      className={`chip ${armed ? 'armed' : ''}`}
      onPointerDown={(e) => onPointerDown(part.id, e)}
      onClick={() => onClick(part.id)}
      title={part.articleNo ? `${part.name} (${part.articleNo})` : part.name}
    >
      <span className="chip-thumb">
        <PartThumb part={part} />
      </span>
      <span className="chip-body">
        <b>{part.name}</b>
        <span>
          {part.manufacturer}
          {sub ? ` · ${sub}` : ''}
        </span>
      </span>
      {part.mount === 'rail' && <span className="chip-te">{formatTe(part.widthTE)} TE</span>}
    </button>
  );
}
