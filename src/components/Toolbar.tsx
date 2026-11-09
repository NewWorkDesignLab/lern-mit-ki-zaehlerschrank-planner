// ---------------------------------------------------------------------------
// Kopfzeile: Projektname, Schrankvorlage, Bearbeiten, Datei, Export.
// ---------------------------------------------------------------------------

import { useLayoutEffect, useRef, useState } from 'react';
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
  const nameRef = useRef<HTMLInputElement>(null);
  const template = TEMPLATES.find((t) => t.id === project.templateId);
  const needsName = project.name.trim() === '';
  // Zähler statt Boolean: jeder Klick startet die Wackel-Animation neu (key-Wechsel).
  const [nudge, setNudge] = useState(0);

  // Bricht die Kopfzeile um, läge die schwebende Sprechblase über den Buttons der
  // nächsten Zeile – dann wird sie in den Fluss gesetzt (siehe .toolbar.is-wrapped).
  const headerRef = useRef<HTMLElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [wrapped, setWrapped] = useState(false);
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const check = () => {
      const p = projectRef.current?.getBoundingClientRect();
      const a = actionsRef.current?.getBoundingClientRect();
      // Höhenunabhängig: Stehen die Aktionen nicht mehr rechts vom Projektbereich,
      // sind sie in eine neue Zeile gerutscht.
      if (p && a) setWrapped(a.left < p.right - 1);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  const handleExport = () => {
    if (needsName) {
      nameRef.current?.focus();
      setNudge((n) => n + 1);
      return;
    }
    props.onExportPng();
  };

  return (
    <header ref={headerRef} className={`toolbar ${wrapped ? 'is-wrapped' : ''}`}>
      <div className="brand">
        <img className="brand-logo" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={32} height={32} />
        <span className="brand-name">Zählerschrank-Planer</span>
      </div>

      <div ref={projectRef} className="toolbar-project">
        <span className="crumb-sep" aria-hidden="true">
          /
        </span>
        <div className="project-name-wrap">
          <input
            ref={nameRef}
            className={`project-name ${needsName ? 'needs-name' : ''}`}
            value={project.name}
            onChange={(e) => props.onRename(e.target.value)}
            placeholder="Unbenanntes Projekt"
            title="Projektname, z. B. EFH Musterstraße 12"
            aria-label="Projektname"
            aria-describedby={needsName ? 'name-hint' : undefined}
          />
          {needsName && (
            <div
              key={nudge}
              id="name-hint"
              className={`name-hint ${nudge > 0 ? 'is-nudged' : ''}`}
              role={nudge > 0 ? 'alert' : undefined}
            >
              <strong>Gib deinem Projekt einen Namen</strong>
              <span>
                {nudge > 0
                  ? 'Vor dem Export bitte einen Namen festlegen – er erscheint im Belegungsplan.'
                  : 'Er erscheint später im Belegungsplan.'}
              </span>
            </div>
          )}
        </div>
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

      <div ref={actionsRef} className="toolbar-actions">
        <button
          className="btn icon ghost"
          onClick={props.onUndo}
          disabled={!props.canUndo}
          title="Rückgängig (Strg+Z)"
          aria-label="Rückgängig"
        >
          <IconUndo />
        </button>
        <button
          className="btn icon ghost"
          onClick={props.onRedo}
          disabled={!props.canRedo}
          title="Wiederholen (Strg+Y)"
          aria-label="Wiederholen"
        >
          <IconRedo />
        </button>
        <span className="sep" />
        <div className="btn-group" role="group" aria-label="Datei">
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
        </div>
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
        <button className="btn" onClick={props.onShare} title="Link und QR-Code zum Projekt anzeigen">
          <IconShare />
          Teilen / QR
        </button>
        <button
          className="btn primary"
          onClick={handleExport}
          disabled={props.exporting}
          title={needsName ? 'Zuerst einen Projektnamen festlegen' : 'Schrankansicht als PNG-Bild speichern'}
        >
          <IconImage />
          {props.exporting ? 'Exportiere …' : 'Als Bild exportieren'}
        </button>
      </div>
    </header>
  );
}
