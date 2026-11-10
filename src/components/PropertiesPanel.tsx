// ---------------------------------------------------------------------------
// Rechte Spalte: Eigenschaften des gewählten Bauteils + Stückliste.
// Weitere Herstellerangaben (Norm, Artikel-Nr., Datenblatt …) liegen hinter dem i-Button.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { CATEGORY_LABEL, getPart } from '../catalog/parts';
import type { CabinetTemplate, CatalogPart, Placement, Project } from '../domain/types';
import { formatTe } from './CabinetCanvas';
import { BillOfMaterials } from './BillOfMaterials';
import { IconClose } from './Icons';
import { PartThumb } from './PartGraphic';

interface Props {
  project: Project;
  template: CabinetTemplate;
  selected: Placement | null;
  /** Alle gewählten Bauteile (bei Mehrfachauswahl > 1). */
  selection: Placement[];
  onUpdate: (uid: string, patch: Partial<Pick<Placement, 'bmk' | 'note'>>) => void;
  onRemoveMany: (uids: string[]) => void;
  /** Bedienhinweise für Touch statt Maus und Tastatur. */
  touch?: boolean;
  /** Gesetzt, wenn die Spalte einblendbar ist (Tablet) – zeigt einen Schließen-Knopf. */
  onClose?: () => void;
  className?: string;
}

export function PropertiesPanel({ project, className = '', onClose, ...props }: Props) {
  return (
    <aside className={`sidebar ${className}`}>
      {onClose && (
        <button className="btn icon ghost sidebar-close" onClick={onClose} aria-label="Schließen" title="Schließen">
          <IconClose />
        </button>
      )}
      <PropertiesSection {...props} />
      <BillOfMaterials project={project} />
    </aside>
  );
}

/** Eigenschaften des gewählten Bauteils (bzw. der Mehrfachauswahl). */
export function PropertiesSection({
  template,
  selected,
  selection,
  onUpdate,
  onRemoveMany,
  touch,
}: Omit<Props, 'project' | 'onClose' | 'className'>) {
  const [showInfo, setShowInfo] = useState(false);
  const selectedPart = selected ? getPart(selected.partId) : undefined;
  // Touch: Herstellerangaben stehen immer unten, daher kein i-Button.
  const hasInfo = !touch && !!selectedPart && hasDetails(selectedPart);
  return (
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
        {selection.length > 1 && (
          <button className="btn danger props-delete" onClick={() => onRemoveMany(selection.map((p) => p.uid))}>
            {selection.length} löschen
          </button>
        )}
      </div>
      {selection.length > 1 ? (
        <MultiSelection selection={selection} touch={touch} />
      ) : selected ? (
        <SelectedPart
          key={selected.uid}
          placement={selected}
          template={template}
          showInfo={showInfo}
          infoAtEnd={touch}
          onUpdate={onUpdate}
        />
      ) : touch ? (
        <p className="muted">
          Ein Bauteil im Schrank antippen, um BMK, Notiz und technische Daten zu sehen. Ein gewähltes Bauteil lässt
          sich per Ziehen verschieben; löschen mit dem roten × oder durch Ziehen auf die rote Fläche. Mit zwei Fingern
          zoomen, mit einem Finger den Schrank verschieben.
        </p>
      ) : (
        <p className="muted">
          Ein Bauteil im Schrank anklicken, um BMK, Notiz und technische Daten zu sehen. Alle Maus- und Tastenkürzel
          unter „Steuerung“ links unten oder mit <kbd>?</kbd>.
        </p>
      )}
    </section>
  );
}

function MultiSelection({ selection, touch }: { selection: Placement[]; touch?: boolean }) {
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
      {touch ? (
        <p className="muted">
          Gemeinsam verschieben: ein gewähltes Bauteil ziehen. Im Modus „Mehrfachauswahl“ einzelne Bauteile antippen,
          um sie hinzuzufügen oder abzuwählen.
        </p>
      ) : (
        <p className="muted">
          Gemeinsam verschieben: ein gewähltes Bauteil ziehen oder <kbd>←</kbd>/<kbd>→</kbd>. Weitere Kürzel unter
          „Steuerung“ (<kbd>?</kbd>).
        </p>
      )}
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
  infoAtEnd,
  onUpdate,
}: {
  placement: Placement;
  template: CabinetTemplate;
  showInfo: boolean;
  /** Herstellerangaben immer zeigen, unter den technischen Daten (Touch). */
  infoAtEnd?: boolean;
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

  const infoBox = hasDetails(part) && (
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
  );

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

      {!infoAtEnd && showInfo && infoBox}

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

      {infoAtEnd && infoBox}
    </div>
  );
}
