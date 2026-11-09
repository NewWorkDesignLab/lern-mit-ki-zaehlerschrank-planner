// ---------------------------------------------------------------------------
// Kopfzeile: Projektname, Schrankvorlage, Bearbeiten, Datei, Export.
// ---------------------------------------------------------------------------

import { useRef } from 'react';
import { TEMPLATES } from '../catalog/templates';
import type { Project } from '../domain/types';
import { IconImage, IconNew, IconOpen, IconRedo, IconSave, IconShare, IconUndo } from './Icons';

interface Props {
  project: Project;
  canUndo: boolean;
  canRedo: boolean;
  exporting: boolean;
  onRename: (name: string) => void;
  onTemplate: (templateId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onNew: () => void;
  onSave: () => void;
  onOpen: (file: File) => void;
  onExportPng: () => void;
  onShare: () => void;
}

export function Toolbar(props: Props) {
  const { project } = props;
  const fileRef = useRef<HTMLInputElement>(null);
  const template = TEMPLATES.find((t) => t.id === project.templateId);

  return (
    <header className="toolbar">
      <div className="brand">
        <img className="brand-logo" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={32} height={32} />
        <span className="brand-name">Zählerschrank-Planer</span>
      </div>

      <div className="toolbar-project">
        <input
          className="project-name"
          value={project.name}
          onChange={(e) => props.onRename(e.target.value)}
          placeholder="Projektname, z. B. EFH Musterstraße 12"
          aria-label="Projektname"
        />
        <select
          value={project.templateId}
          onChange={(e) => props.onTemplate(e.target.value)}
          aria-label="Schrankvorlage"
          title={template?.description}
        >
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="toolbar-actions">
        <button
          className="btn icon"
          onClick={props.onUndo}
          disabled={!props.canUndo}
          title="Rückgängig (Strg+Z)"
          aria-label="Rückgängig"
        >
          <IconUndo />
        </button>
        <button
          className="btn icon"
          onClick={props.onRedo}
          disabled={!props.canRedo}
          title="Wiederholen (Strg+Y)"
          aria-label="Wiederholen"
        >
          <IconRedo />
        </button>
        <span className="sep" />
        <button className="btn" onClick={props.onNew} title="Neues, leeres Projekt">
          <IconNew />
          Neu
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()} title="Gespeichertes Projekt öffnen">
          <IconOpen />
          Öffnen
        </button>
        <button className="btn" onClick={props.onSave} title="Projekt als .json-Datei speichern">
          <IconSave />
          Speichern
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) props.onOpen(file);
            e.target.value = '';
          }}
        />
        <span className="sep" />
        <button className="btn" onClick={props.onShare}>
          <IconShare />
          Teilen / QR
        </button>
        <button className="btn primary" onClick={props.onExportPng} disabled={props.exporting}>
          <IconImage />
          {props.exporting ? 'Exportiere …' : 'Als Bild exportieren'}
        </button>
      </div>
    </header>
  );
}
