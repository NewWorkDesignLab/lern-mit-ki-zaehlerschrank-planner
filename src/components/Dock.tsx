// ---------------------------------------------------------------------------
// Katalog-Dock unten (Handy / Tablet hoch): ein Bereich, drei Ansichten –
// Bauteile, Eigenschaften, Stückliste. Wählt man ein Bauteil im Schrank,
// springt das Dock auf "Eigenschaften", hebt man die Auswahl auf, zurück.
//
// Bauteile liegen in einer waagerecht scrollenden Leiste. Nach oben ziehen
// holt ein Teil heraus (quer zur Scrollrichtung), Antippen wählt es zum
// Platzieren aus. Aufgeklappt wird die Leiste zum Raster mit Suche.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { CATALOG, CATEGORY_ORDER, MANUFACTURERS } from '../catalog/parts';
import type { CatalogPart, PartCategory } from '../domain/types';
import { formatTe } from './CabinetCanvas';
import { IconChevronUp, IconClose, IconSearch } from './Icons';
import { filterCatalog } from './Library';
import { PartThumb } from './PartGraphic';

/** Kurze Kategorienamen für die Filter-Chips. */
const CATEGORY_SHORT: Record<PartCategory, string> = {
  sls: 'SLS',
  zaehler: 'Zähler',
  uss: 'ÜSS',
  rcd: 'FI (RCD)',
  'fi-ls': 'FI/LS',
  ls: 'LS',
  sicherung: 'Sicherungen',
  steuerung: 'Steuerung',
  schalter: 'Schalter',
  sonstiges: 'Sonstiges',
  klemme: 'Klemmen',
};

/** Angetippter Platz im Schrank: Katalog zeigt nur, was dort hinpasst. */
export interface DockSlot {
  label: string;
  fits: (part: CatalogPart) => boolean;
}

type Tab = 'parts' | 'props' | 'bom';

interface Props {
  armedPartId: string | null;
  selectionCount: number;
  bomCount: number;
  slot: DockSlot | null;
  /** Ein Bauteil wird gerade aus dem Katalog gezogen – aufgeklapptes Dock einklappen. */
  draggingFromCatalog: boolean;
  properties: ReactNode;
  bom: ReactNode;
  onTilePointerDown: (partId: string, e: ReactPointerEvent) => void;
  onTileClick: (partId: string) => void;
  onCloseSlot: () => void;
}

export function Dock(props: Props) {
  const { selectionCount, slot } = props;
  const [tab, setTab] = useState<Tab>('parts');
  const [expanded, setExpanded] = useState(false);

  // Auswahl im Schrank -> Eigenschaften, Auswahl aufgehoben -> zurück zum Katalog.
  const hasSelection = selectionCount > 0;
  useEffect(() => {
    setTab((t) => (hasSelection ? 'props' : t === 'props' ? 'parts' : t));
  }, [hasSelection]);
  useEffect(() => {
    if (slot) setTab('parts');
  }, [slot]);
  useEffect(() => {
    if (props.draggingFromCatalog) setExpanded(false);
  }, [props.draggingFromCatalog]);

  const tabBtn = (id: Tab, label: string, badge?: number) => (
    <button
      role="tab"
      aria-selected={tab === id}
      className={`dock-tab ${tab === id ? 'active' : ''}`}
      onClick={() => setTab(id)}
    >
      {label}
      {!!badge && <span className="dock-badge">{badge}</span>}
    </button>
  );

  return (
    <section className={`dock ${expanded && tab === 'parts' ? 'expanded' : ''}`} aria-label="Katalog und Eigenschaften">
      <div className="dock-head" role="tablist">
        {tabBtn('parts', 'Bauteile')}
        {tabBtn('props', 'Eigenschaften', selectionCount > 1 ? selectionCount : undefined)}
        {tabBtn('bom', 'Stückliste', props.bomCount)}
        {tab === 'parts' && (
          <button
            className={`btn icon ghost dock-toggle ${expanded ? 'open' : ''}`}
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Katalog einklappen' : 'Katalog aufklappen'}
            title={expanded ? 'Einklappen' : 'Aufklappen'}
          >
            <IconChevronUp />
          </button>
        )}
      </div>

      <div className="dock-body">
        {tab === 'parts' && <Catalog {...props} expanded={expanded} />}
        {tab === 'props' && <div className="dock-scroll">{props.properties}</div>}
        {tab === 'bom' && <div className="dock-scroll">{props.bom}</div>}
      </div>
    </section>
  );
}

function Catalog({
  armedPartId,
  slot,
  expanded,
  onTilePointerDown,
  onTileClick,
  onCloseSlot,
}: Props & { expanded: boolean }) {
  const [category, setCategory] = useState<PartCategory | ''>('');
  const [manufacturer, setManufacturer] = useState('');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);

  const found = useMemo(() => filterCatalog(manufacturer, query), [manufacturer, query]);
  const categories = useMemo(() => CATEGORY_ORDER.filter((c) => found.some((p) => p.category === c)), [found]);
  const items = useMemo(() => {
    // Platz-Modus: nur was dort passt, unabhängig von Kategorie und Suche.
    const sorted = [...found].sort(
      (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
    );
    if (slot) return CATALOG.filter(slot.fits);
    return category ? sorted.filter((p) => p.category === category) : sorted;
  }, [found, category, slot]);

  // Neue Filter -> Leiste an den Anfang.
  useEffect(() => {
    stripRef.current?.scrollTo({ left: 0, top: 0 });
  }, [category, query, manufacturer, slot]);

  const chip = (id: PartCategory | '', label: string) => (
    <button key={id || 'all'} className={`dock-chip ${category === id ? 'active' : ''}`} onClick={() => setCategory(id)}>
      {label}
    </button>
  );

  return (
    <>
      {slot ? (
        <div className="dock-filter slot">
          <span className="dock-slot-label">
            Passt in <b>{slot.label}</b>
          </span>
          <button className="btn icon ghost" onClick={onCloseSlot} aria-label="Platz-Auswahl beenden" title="Beenden">
            <IconClose />
          </button>
        </div>
      ) : searching ? (
        <div className="dock-filter">
          <input
            type="search"
            autoFocus
            placeholder="Suchen (z. B. B16, Typ B)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {expanded && (
            <select value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} aria-label="Hersteller">
              <option value="">Alle Hersteller</option>
              {MANUFACTURERS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
          <button
            className="btn icon ghost"
            onClick={() => {
              setSearching(false);
              setQuery('');
              setManufacturer('');
            }}
            aria-label="Suche schließen"
          >
            <IconClose />
          </button>
        </div>
      ) : (
        <div className="dock-filter">
          <button className="btn icon dock-search" onClick={() => setSearching(true)} aria-label="Suchen">
            <IconSearch />
          </button>
          <div className="dock-chips">
            {chip('', 'Alle')}
            {categories.map((c) => chip(c, CATEGORY_SHORT[c]))}
          </div>
        </div>
      )}

      <div ref={stripRef} className="dock-strip">
        {items.length === 0 && (
          <p className="muted dock-empty">{slot ? 'Hier passt kein Bauteil mehr hin.' : 'Keine Bauteile gefunden.'}</p>
        )}
        {items.map((part) => (
          <button
            key={part.id}
            className={`tile ${armedPartId === part.id ? 'armed' : ''}`}
            onPointerDown={(e) => onTilePointerDown(part.id, e)}
            onClick={() => onTileClick(part.id)}
            title={part.articleNo ? `${part.name} (${part.articleNo})` : part.name}
          >
            <span className="tile-thumb">
              <PartThumb part={part} size={52} />
            </span>
            <span className="tile-name">{part.name}</span>
            <span className="tile-meta">
              {part.manufacturer}
              {part.mount === 'rail' ? ` · ${formatTe(part.widthTE)} TE` : ''}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
