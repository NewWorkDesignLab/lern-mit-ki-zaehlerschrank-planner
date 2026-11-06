// ---------------------------------------------------------------------------
// Rechte Spalte: Eigenschaften des gewählten Bauteils + Stückliste.
// Der Nachschlagetext zur Bauteilart liegt hinter dem i-Button.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { CATEGORY_LABEL, getPart } from '../catalog/parts';
import { getInfo } from '../content/infotexts';
import type { CabinetTemplate, Placement, Project } from '../domain/types';
import { formatTe } from './CabinetCanvas';
import { BillOfMaterials } from './BillOfMaterials';
import { PartThumb } from './PartGraphic';

interface Props {
  project: Project;
  template: CabinetTemplate;
  selected: Placement | null;
  onUpdate: (uid: string, patch: Partial<Pick<Placement, 'bmk' | 'note'>>) => void;
}

export function PropertiesPanel({ project, template, selected, onUpdate }: Props) {
  const [showInfo, setShowInfo] = useState(false);
  const selectedPart = selected ? getPart(selected.partId) : undefined;
  const hasInfo = !!selectedPart?.infoKey && !!getInfo(selectedPart.infoKey);
  return (
    <aside className="sidebar">
      <section className="panel props">
        <div className="panel-head">
          <h2 className="panel-title">Eigenschaften</h2>
          {hasInfo && (
            <button
              className={`info-btn ${showInfo ? 'active' : ''}`}
              onClick={() => setShowInfo((v) => !v)}
              title={showInfo ? 'Hintergrundinfo ausblenden' : 'Hintergrundinfo anzeigen'}
              aria-pressed={showInfo}
            >
              i
            </button>
          )}
        </div>
        {selected ? (
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
            Flächen, die beim Ziehen neben dem Schrank erscheinen.
          </p>
        )}
      </section>
      <BillOfMaterials project={project} />
    </aside>
  );
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
  const info = part.infoKey ? getInfo(part.infoKey) : undefined;
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

      {showInfo && info && (
        <div className="info-box">
          <b>{info.title}</b>
          <p>{info.body}</p>
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
