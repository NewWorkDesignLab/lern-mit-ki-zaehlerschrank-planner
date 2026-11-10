// ---------------------------------------------------------------------------
// Katalog-Dock unten (Handy / Tablet hoch): ein Bereich, drei Ansichten –
// Bauteile, Eigenschaften, Stückliste. Wählt man ein Bauteil im Schrank,
// springt das Dock auf "Eigenschaften", hebt man die Auswahl auf, zurück.
//
// Bauteile liegen in einer waagerecht scrollenden Leiste. Nach oben ziehen
// holt ein Teil heraus (quer zur Scrollrichtung), Antippen wählt es zum
// Platzieren aus. Aufgeklappt wird die Leiste zum Raster mit Suche.
// ---------------------------------------------------------------------------

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { CATEGORY_ORDER, MANUFACTURERS } from '../catalog/parts';
import type { PartCategory } from '../domain/types';
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

type Tab = 'parts' | 'props' | 'bom';

interface Props {
  armedPartId: string | null;
  selectionCount: number;
  bomCount: number;
  /** Ein Bauteil wird gerade aus dem Katalog gezogen – aufgeklapptes Dock einklappen. */
  draggingFromCatalog: boolean;
  properties: ReactNode;
  bom: ReactNode;
  onTilePointerDown: (partId: string, e: ReactPointerEvent) => void;
  onTileClick: (partId: string) => void;
}

export function Dock(props: Props) {
  const { selectionCount } = props;
  const [tab, setTab] = useState<Tab>('parts');
  const [expanded, setExpanded] = useState(false);

  // Auswahl im Schrank -> Eigenschaften, Auswahl aufgehoben -> zurück zum Katalog.
  const hasSelection = selectionCount > 0;
  useEffect(() => {
    setTab((t) => (hasSelection ? 'props' : t === 'props' ? 'parts' : t));
  }, [hasSelection]);
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
  expanded,
  onTilePointerDown,
  onTileClick,
}: Props & { expanded: boolean }) {
  const [category, setCategory] = useState<PartCategory | ''>('');
  const [manufacturer, setManufacturer] = useState('');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);

  const found = useMemo(() => filterCatalog(manufacturer, query), [manufacturer, query]);
  const categories = useMemo(() => CATEGORY_ORDER.filter((c) => found.some((p) => p.category === c)), [found]);
  const items = useMemo(() => {
    const sorted = [...found].sort(
      (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
    );
    return category ? sorted.filter((p) => p.category === category) : sorted;
  }, [found, category]);

  /** Zuletzt angetipptes oder gezogenes Teil – bleibt beim Auf-/Zuklappen im Blick. */
  const focusId = useRef<string | null>(null);

  // Neue Filter -> Leiste an den Anfang.
  useEffect(() => {
    stripRef.current?.scrollTo({ left: 0, top: 0 });
  }, [category, query, manufacturer]);

  // Auf-/Zuklappen -> Leiste bzw. Raster zum gewählten Teil scrollen statt an den Anfang.
  useLayoutEffect(() => {
    const strip = stripRef.current;
    const id = armedPartId ?? focusId.current;
    const tile = id ? strip?.querySelector<HTMLElement>(`[data-part="${CSS.escape(id)}"]`) : null;
    if (!strip || !tile) return;
    const s = strip.getBoundingClientRect();
    const t = tile.getBoundingClientRect();
    strip.scrollTo(
      expanded
        ? { top: strip.scrollTop + t.top - s.top - (s.height - t.height) / 2 }
        : { left: strip.scrollLeft + t.left - s.left - (s.width - t.width) / 2 },
    );
  }, [expanded]);

  const chip = (id: PartCategory | '', label: string) => (
    <button key={id || 'all'} className={`dock-chip ${category === id ? 'active' : ''}`} onClick={() => setCategory(id)}>
      {label}
    </button>
  );

  return (
    <>
      {searching ? (
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
          <p className="muted dock-empty">Keine Bauteile gefunden.</p>
        )}
        {items.map((part) => (
          <button
            key={part.id}
            data-part={part.id}
            className={`tile ${armedPartId === part.id ? 'armed' : ''}`}
            onPointerDown={(e) => {
              focusId.current = part.id;
              onTilePointerDown(part.id, e);
            }}
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
