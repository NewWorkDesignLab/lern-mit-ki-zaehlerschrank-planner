// ---------------------------------------------------------------------------
// Rechte Spalte: Eigenschaften des gewählten Bauteils + Stückliste.
// Weitere Herstellerangaben (Norm, Artikel-Nr., Datenblatt …) liegen hinter dem i-Button.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { CATEGORY_LABEL, getPart } from '../catalog/parts';
import type { CabinetTemplate, CatalogPart, Placement, Project } from '../domain/types';
import { formatTe } from './CabinetCanvas';
import { BillOfMaterials } from './BillOfMaterials';
import { PartThumb } from './PartGraphic';

interface Props {
  project: Project;
  template: CabinetTemplate;
  selected: Placement | null;
  /** Alle gewählten Bauteile (bei Mehrfachauswahl > 1). */
  selection: Placement[];
  onUpdate: (uid: string, patch: Partial<Pick<Placement, 'bmk' | 'note'>>) => void;
  onRemoveMany: (uids: string[]) => void;
}

export function PropertiesPanel({ project, template, selected, selection, onUpdate, onRemoveMany }: Props) {
  const [showInfo, setShowInfo] = useState(false);
  const selectedPart = selected ? getPart(selected.partId) : undefined;
  const hasInfo = !!selectedPart && hasDetails(selectedPart);
  return (
    <aside className="sidebar">
      <section className="panel props">
        <div className="panel-head">
          <h2 className="panel-title">Eigenschaften</h2>
          {hasInfo && (
            <button
              className={`info-btn ${showInfo ? 'active' : ''}`}
              onClick={() => setShowInfo((v) => !v)}
              title={showInfo ? 'Herstellerangaben ausblenden' : 'Herstellerangaben anzeigen'}
              aria-pressed={showInfo}
            >
              i
            </button>
          )}
        </div>
        {selection.length > 1 ? (
          <MultiSelection selection={selection} onRemoveMany={onRemoveMany} />
        ) : selected ? (
          <SelectedPart
            key={selected.uid}
            placement={selected}
            template={template}
            showInfo={showInfo}
            onUpdate={onUpdate}
          />
        ) : (
          <p className="muted">
            Ein Bauteil im Schrank anklicken, um BMK, Notiz und technische Daten zu sehen. Verschieben per Ziehen oder mit{' '}
            <kbd>←</kbd>/<kbd>→</kbd>; löschen mit <kbd>Entf</kbd>, dem roten × oder durch Ziehen in eine der roten
            Flächen, die beim Ziehen neben dem Schrank erscheinen. Mehrere Bauteile wählen: auf leerer Fläche klicken
            und mit gedrückter Maustaste darüberfahren.
          </p>
        )}
      </section>
      <BillOfMaterials project={project} />
    </aside>
  );
}

function MultiSelection({
  selection,
  onRemoveMany,
}: {
  selection: Placement[];
  onRemoveMany: Props['onRemoveMany'];
}) {
  return (
    <div className="props-body multi-sel">
      <b>{selection.length} Bauteile ausgewählt</b>
      <ul className="multi-sel-list">
        {selection.map((p) => (
          <li key={p.uid}>
            <span className="multi-sel-bmk">{p.bmk || '–'}</span>
            <span className="multi-sel-name">{getPart(p.partId)?.name ?? p.partId}</span>
          </li>
        ))}
      </ul>
      <button className="btn danger" onClick={() => onRemoveMany(selection.map((p) => p.uid))}>
        Auswahl löschen
      </button>
      <p className="muted">
        Gemeinsam verschieben: ein gewähltes Bauteil ziehen oder <kbd>←</kbd>/<kbd>→</kbd>. Mit <kbd>Strg</kbd>+Klick
        einzelne Bauteile hinzufügen oder abwählen, <kbd>Esc</kbd> hebt die Auswahl auf.
      </p>
    </div>
  );
}

function hasDetails(part: CatalogPart): boolean {
  return !!part.articleNo || !!part.datasheetUrl || Object.keys(part.details ?? {}).length > 0;
}

function SelectedPart({
  placement,
  template,
  showInfo,
  onUpdate,
}: {
  placement: Placement;
  template: CabinetTemplate;
  showInfo: boolean;
  onUpdate: Props['onUpdate'];
}) {
  const part = getPart(placement.partId);
  if (!part) return null;
  const field = template.fields[placement.field];
  const zone = field?.zones[placement.zone];
  const position =
    zone?.kind === 'rail'
      ? `${field.name} · ${zone.label} · TE ${formatTe(placement.te + 1)}–${formatTe(placement.te + part.widthTE)}`
      : `${field?.name} · ${zone?.label}`;

  return (
    <div className="props-body">
      <div className="props-head">
        <span className="props-thumb">
          <PartThumb part={part} size={64} />
        </span>
        <div>
          <b>{part.name}</b>
          <span className="muted">
            {part.manufacturer}
            {part.articleNo ? ` · ${part.articleNo}` : ''}
          </span>
          <span className="muted">{CATEGORY_LABEL[part.category]}</span>
        </div>
      </div>

      {showInfo && hasDetails(part) && (
        <div className="info-box">
          <b>Herstellerangaben</b>
          <dl className="specs">
            <dt>Hersteller</dt>
            <dd>{part.manufacturer}</dd>
            {part.articleNo && (
              <>
                <dt>Artikel-Nr.</dt>
                <dd>{part.articleNo}</dd>
              </>
            )}
            {Object.entries(part.details ?? {}).map(([k, v]) => (
              <div key={k} className="specs-row">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {part.datasheetUrl && (
            <a href={part.datasheetUrl} target="_blank" rel="noreferrer">
              Datenblatt öffnen
            </a>
          )}
          <span className="info-note">Beispieldaten – vor dem Aufbau mit dem Datenblatt abgleichen.</span>
        </div>
      )}

      <label className="field">
        <span>BMK</span>
        <input value={placement.bmk} onChange={(e) => onUpdate(placement.uid, { bmk: e.target.value })} />
      </label>
      <label className="field">
        <span>Notiz (z. B. Stromkreis)</span>
        <textarea
          rows={2}
          value={placement.note ?? ''}
          placeholder="z. B. Küche Steckdosen, 3×2,5 mm²"
          onChange={(e) => onUpdate(placement.uid, { note: e.target.value })}
        />
      </label>

      <dl className="specs">
        <dt>Position</dt>
        <dd>{position}</dd>
        {part.mount === 'rail' && (
          <>
            <dt>Breite</dt>
            <dd>
              {formatTe(part.widthTE)} TE ({formatTe(part.widthTE * 17.5)} mm)
            </dd>
          </>
        )}
        {Object.entries(part.specs).map(([k, v]) => (
          <div key={k} className="specs-row">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
