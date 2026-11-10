// ---------------------------------------------------------------------------
// Kopfzeile: Projektname, Schrankvorlage, Bearbeiten, Datei, Export.
// Kompakt (Handy / Tablet hoch): eine Zeile, Datei & Export im ⋯-Menü.
// ---------------------------------------------------------------------------

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TEMPLATES } from "../catalog/templates";
import type { Project } from "../domain/types";
import {
  IconArrowRight,
  IconImage,
  IconMore,
  IconNew,
  IconOpen,
  IconRedo,
  IconSave,
  IconShare,
  IconUndo,
} from "./Icons";

interface Props {
  project: Project;
  compact: boolean;
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
  const needsName = project.name.trim() === "";
  // Geführter Export: Export ohne Namen angestoßen – Fläche abgedunkelt, Name
  // eintippen, Enter (oder Chip / Quick-Export) setzt den Export fort.
  const [guided, setGuided] = useState(false);
  // Zähler statt Boolean: jeder Versuch startet die Wackel-Animation neu (key-Wechsel).
  const [nudge, setNudge] = useState(0);

  // Esc bricht den geführten Export ab.
  useEffect(() => {
    if (!guided) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setGuided(false);
        nameRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guided]);

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
  }, [props.compact]);

  const handleExport = () => {
    if (props.exporting) return;
    if (needsName) {
      setGuided(true);
      setNudge((n) => n + 1);
      nameRef.current?.focus();
      return;
    }
    setGuided(false);
    nameRef.current?.blur();
    props.onExportPng();
  };

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept=".json,application/json"
      hidden
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) props.onOpen(file);
        e.target.value = "";
      }}
    />
  );

  const nameInput = (
    <input
      ref={nameRef}
      className={`project-name ${needsName ? "needs-name" : ""}`}
      value={project.name}
      onChange={(e) => props.onRename(e.target.value)}
      onKeyDown={(e) => {
        // Im geführten Export: Name tippen, Enter – weiter geht's.
        if (!guided || e.key !== "Enter" || e.nativeEvent.isComposing) return;
        e.preventDefault();
        handleExport();
      }}
      enterKeyHint={guided ? "go" : "done"}
      placeholder="Zählerschrank benennen"
      title="Projektname, z. B. EFH Musterstraße 12"
      aria-label="Projektname"
      aria-describedby={guided && needsName ? "name-hint" : undefined}
    />
  );

  // Desktop, geführter Export: leer nur ein blasses ↵ im Feld; ab dem ersten
  // Buchstaben schiebt sich rechts neben dem Feld ein Export-Button ein.
  const enterHint = guided && !props.compact && needsName && (
    <span className="name-enter-hint" aria-hidden="true">
      ↵
    </span>
  );
  const exportChip = guided && !props.compact && (
    <button
      type="button"
      className={`btn primary name-export-btn ${needsName ? "" : "is-shown"}`}
      // Fokus im Namensfeld lassen
      onMouseDown={(e) => e.preventDefault()}
      onClick={handleExport}
      disabled={needsName}
      tabIndex={-1}
      title="Exportieren (Enter)"
      aria-hidden={needsName}
    >
      <span className="enter-key" aria-hidden="true">
        ↵
      </span>
      Enter
    </button>
  );

  // Erscheint nur im geführten Export, solange der Name noch fehlt.
  const nameHint = guided && needsName && (
    <div
      key={nudge}
      id="name-hint"
      className="name-hint is-nudged"
      role="alert"
    >
      <strong>Gib deinem Projekt einen Namen</strong>
      <span>
        Er erscheint im Belegungsplan – danach geht der Export direkt weiter.
      </span>
    </div>
  );

  // Mobil: Quick-Export ersetzt im geführten Export Rückgängig/Wiederholen.
  const quickExport = (
    <button
      className={`btn primary quick-export ${needsName ? "is-idle" : ""}`}
      onPointerDown={(e) => e.preventDefault()}
      onClick={handleExport}
      title="Exportieren"
    >
      <IconArrowRight />
      Export
    </button>
  );

  // Abgedunkelte Fläche unterhalb der Kopfzeile; Klick bricht ab.
  const scrim = guided && (
    <div
      className="guide-scrim"
      onPointerDown={(e) => {
        e.preventDefault();
        setGuided(false);
        nameRef.current?.blur();
      }}
      aria-hidden="true"
    />
  );

  const templateSelect = (
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
  );

  const undoRedo = (
    <>
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
    </>
  );

  if (props.compact) {
    return (
      <>
        <header className={`toolbar compact ${guided ? "is-guided" : ""}`}>
          <img
            className="brand-logo"
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt=""
            width={28}
            height={28}
          />
          <div className="project-name-wrap">
            {nameInput}
            {nameHint}
          </div>
          {guided ? quickExport : undoRedo}
          <CompactMenu
            templateSelect={templateSelect}
            exporting={props.exporting}
            onNew={props.onNew}
            onOpen={() => fileRef.current?.click()}
            onSave={props.onSave}
            onShare={props.onShare}
            onExport={handleExport}
          />
          {fileInput}
        </header>
        {scrim}
      </>
    );
  }

  return (
    <>
      <header
        ref={headerRef}
        className={`toolbar ${wrapped ? "is-wrapped" : ""} ${guided ? "is-guided" : ""}`}
      >
        <div className="brand">
          <img
            className="brand-logo"
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt=""
            width={32}
            height={32}
          />
          <span className="brand-name">Zählerschrank-Planer</span>
        </div>

        <div ref={projectRef} className="toolbar-project">
          <span className="crumb-sep" aria-hidden="true">
            /
          </span>
          <div className="project-name-wrap">
            {nameInput}
            {enterHint}
            {nameHint}
          </div>
          {exportChip}
          {templateSelect}
        </div>

        <div ref={actionsRef} className="toolbar-actions">
          {undoRedo}
          <span className="sep" />
          <div className="btn-group" role="group" aria-label="Datei">
            <button
              className="btn"
              onClick={props.onNew}
              title="Neues, leeres Projekt"
              aria-label="Neu"
            >
              <IconNew />
              <span className="btn-label">Neu</span>
            </button>
            <button
              className="btn"
              onClick={() => fileRef.current?.click()}
              title="Gespeichertes Projekt öffnen"
              aria-label="Öffnen"
            >
              <IconOpen />
              <span className="btn-label">Öffnen</span>
            </button>
            <button
              className="btn"
              onClick={props.onSave}
              title="Projekt als .json-Datei speichern"
              aria-label="Speichern"
            >
              <IconSave />
              <span className="btn-label">Speichern</span>
            </button>
          </div>
          {fileInput}
          <span className="sep" />
          <button
            className="btn"
            onClick={props.onShare}
            title="Link und QR-Code zum Projekt anzeigen"
          >
            <IconShare />
            Teilen / QR
          </button>
          <button
            className={`btn primary ${guided ? "is-waiting" : ""}`}
            onMouseDown={(e) => guided && e.preventDefault()}
            onClick={handleExport}
            disabled={props.exporting}
            title={
              needsName
                ? "Zuerst einen Projektnamen festlegen"
                : "Schrankansicht als PNG-Bild speichern"
            }
          >
            {props.exporting ? (
              <>
                <IconImage />
                Exportiere …
              </>
            ) : !guided ? (
              <>
                <IconImage />
                Als Bild exportieren
              </>
            ) : needsName ? (
              <>
                <IconImage />
                In Arbeit …
              </>
            ) : (
              <>
                <IconArrowRight />
                Exportieren
              </>
            )}
          </button>
        </div>
      </header>
      {scrim}
    </>
  );
}

/** ⋯-Menü der kompakten Kopfzeile: Schrankvorlage, Datei, Teilen, Export. */
function CompactMenu(props: {
  templateSelect: JSX.Element;
  exporting: boolean;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onShare: () => void;
  onExport: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  const item = (
    label: string,
    icon: JSX.Element,
    onClick: () => void,
    cls = "",
  ) => (
    <button
      className={`menu-item ${cls}`}
      role="menuitem"
      onClick={() => {
        setOpen(false);
        onClick();
      }}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div ref={ref} className="compact-menu">
      <button
        className={`btn icon ${open ? "active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menü"
        title="Menü"
      >
        <IconMore />
      </button>
      {open && (
        <div className="menu-pop" role="menu">
          <label className="menu-field">
            <span>Schrankvorlage</span>
            {props.templateSelect}
          </label>
          <div className="menu-sep" />
          {item("Neu", <IconNew />, props.onNew)}
          {item("Öffnen", <IconOpen />, props.onOpen)}
          {item("Speichern", <IconSave />, props.onSave)}
          <div className="menu-sep" />
          {item("Teilen / QR", <IconShare />, props.onShare)}
          {item(
            props.exporting ? "Exportiere …" : "Als Bild exportieren",
            <IconImage />,
            props.onExport,
            "primary",
          )}
        </div>
      )}
    </div>
  );
}
