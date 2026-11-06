import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { getPart } from './catalog/parts';
import { TEMPLATES, getTemplate } from './catalog/templates';
import { CabinetCanvas } from './components/CabinetCanvas';
import type { Preview } from './components/CabinetCanvas';
import { Library } from './components/Library';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ShareDialog } from './components/ShareDialog';
import { Toolbar } from './components/Toolbar';
import { computeGeometry } from './domain/geometry';
import { canPlace, firstFreeSpot, retainFitting } from './domain/layout';
import { computeTarget } from './domain/target';
import { readProjectFile, saveProjectFile } from './export/file';
import { exportPng } from './export/png';
import { HASH_PREFIX, decodeProject } from './export/share';
import { newUid, useProject } from './state/store';

/** Ab dieser Mausbewegung (px) wird aus einem Klick ein Ziehen. */
const DRAG_THRESHOLD = 5;

interface Pointer {
  partId: string;
  /** Gesetzt, wenn ein bereits platziertes Bauteil bewegt wird. */
  uid?: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  dragging: boolean;
}

export function App() {
  const { project, canUndo, canRedo, dispatch } = useProject();
  const template = getTemplate(project.templateId) ?? TEMPLATES[0];
  const geo = useMemo(() => computeGeometry(template), [template]);

  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [armedPartId, setArmedPartId] = useState<string | null>(null);
  const [pointer, setPointer] = useState<Pointer | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [exporting, setExporting] = useState(false);
  /** Unterdrückt den Klick, der nach einem Ziehen ausgelöst wird. */
  const suppressClick = useRef(false);

  const selected = project.placements.find((p) => p.uid === selectedUid) ?? null;

  const notify = useCallback((msg: string) => setToast(msg), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // --- Projekt aus Link laden (einmalig beim Start) ---------------------------
  useEffect(() => {
    const { hash } = window.location;
    if (!hash.startsWith(HASH_PREFIX)) return;
    decodeProject(hash.slice(HASH_PREFIX.length))
      .then((p) => {
        dispatch({ type: 'LOAD', project: p });
        notify(`„${p.name}“ aus Link geladen – Rückgängig stellt deinen vorherigen Stand wieder her.`);
      })
      .catch((e: unknown) => notify(e instanceof Error ? e.message : 'Link konnte nicht gelesen werden.'))
      .finally(() => history.replaceState(null, '', window.location.pathname + window.location.search));
  }, [dispatch, notify]);

  // --- Bildschirm- -> SVG-Koordinaten --------------------------------------------
  const toSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(ctm.inverse());
  }, []);

  const targetAt = useCallback(
    (partId: string, clientX: number, clientY: number, excludeUid?: string) => {
      const part = getPart(partId);
      const p = toSvg(clientX, clientY);
      if (!part || !p) return null;
      const target = computeTarget(template, geo, project.placements, part, p.x, p.y, excludeUid);
      return target ? { part, target } : null;
    },
    [toSvg, template, geo, project.placements],
  );

  // --- Ziehen (Bibliothek -> Schrank, und Verschieben im Schrank) ----------------
  const beginPointer = (partId: string, e: ReactPointerEvent, uid?: string) => {
    if (e.button !== 0) return;
    setPointer({ partId, uid, startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY, dragging: false });
  };

  useEffect(() => {
    if (!pointer) return;
    const move = (e: PointerEvent) => {
      setPointer((p) => {
        if (!p) return p;
        const dragging = p.dragging || Math.hypot(e.clientX - p.startX, e.clientY - p.startY) > DRAG_THRESHOLD;
        return { ...p, x: e.clientX, y: e.clientY, dragging };
      });
    };
    const up = (e: PointerEvent) => {
      const p = pointer;
      setPointer(null);
      if (!p.dragging) return;
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 0);
      const hit = targetAt(p.partId, e.clientX, e.clientY, p.uid);
      if (!hit || !hit.target.valid) {
        if (hit) notify('Dort ist kein Platz für dieses Bauteil.');
        return;
      }
      const { field, zone, te } = hit.target;
      if (p.uid) {
        dispatch({ type: 'MOVE', uid: p.uid, field, zone, te });
      } else {
        const uid = newUid();
        dispatch({ type: 'ADD', uid, partId: p.partId, field, zone, te });
        setSelectedUid(uid);
      }
    };
    const cancel = () => setPointer(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    };
  }, [pointer, targetAt, dispatch, notify]);

  const preview: Preview | null = useMemo(() => {
    if (!pointer?.dragging) return null;
    const hit = targetAt(pointer.partId, pointer.x, pointer.y, pointer.uid);
    return hit ? { ...hit, movingUid: pointer.uid } : null;
  }, [pointer, targetAt]);

  // --- Klick-Platzierung mit ausgewähltem Bibliotheksteil ------------------------
  const handleCanvasClick = (clientX: number, clientY: number) => {
    if (suppressClick.current) return;
    if (!armedPartId) {
      setSelectedUid(null);
      return;
    }
    const hit = targetAt(armedPartId, clientX, clientY);
    if (!hit) return;
    if (!hit.target.valid) {
      notify('Dort ist kein Platz für dieses Bauteil.');
      return;
    }
    const uid = newUid();
    dispatch({ type: 'ADD', uid, partId: armedPartId, ...hit.target });
    setSelectedUid(uid);
  };

  // --- Aktionen ------------------------------------------------------------------
  const remove = useCallback(
    (uid: string) => {
      dispatch({ type: 'REMOVE', uid });
      setSelectedUid((s) => (s === uid ? null : s));
    },
    [dispatch],
  );

  const duplicate = (uid: string) => {
    const src = project.placements.find((p) => p.uid === uid);
    const part = src && getPart(src.partId);
    if (!src || !part) return;
    const spot = firstFreeSpot(template, project.placements, part, {
      field: src.field,
      zone: src.zone,
      te: src.te + part.widthTE,
    });
    if (!spot) {
      notify('Kein freier Platz mehr für dieses Bauteil.');
      return;
    }
    const newId = newUid();
    dispatch({ type: 'ADD', uid: newId, partId: part.id, ...spot });
    setSelectedUid(newId);
  };

  const changeTemplate = (templateId: string) => {
    const next = getTemplate(templateId);
    if (!next) return;
    const lost = project.placements.length - retainFitting(next, project.placements).length;
    if (
      lost > 0 &&
      !window.confirm(`${lost} Bauteil(e) passen nicht in „${next.name}“ und werden entfernt. Fortfahren?`)
    ) {
      return;
    }
    dispatch({ type: 'SET_TEMPLATE', templateId });
    setSelectedUid(null);
  };

  const handleExport = async () => {
    if (!svgRef.current) return;
    setExporting(true);
    try {
      await exportPng(svgRef.current, project, geo);
    } catch (e) {
      notify(`Export fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setExporting(false);
    }
  };

  // --- Tastatur ------------------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? 'REDO' : 'UNDO' });
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      } else if (e.key === 'Escape') {
        setArmedPartId(null);
        setSelectedUid(null);
      } else if (selected && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        remove(selected.uid);
      } else if (selected && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const part = getPart(selected.partId);
        const te = selected.te + (e.key === 'ArrowLeft' ? -0.5 : 0.5);
        if (part && canPlace(template, project.placements, part, selected.field, selected.zone, te, selected.uid)) {
          e.preventDefault();
          dispatch({ type: 'MOVE', uid: selected.uid, field: selected.field, zone: selected.zone, te });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, selected, remove, template, project.placements]);

  const dragPart = pointer?.dragging ? getPart(pointer.partId) : undefined;

  return (
    <div className={`app ${pointer?.dragging ? 'is-dragging' : ''}`}>
      <Toolbar
        project={project}
        canUndo={canUndo}
        canRedo={canRedo}
        exporting={exporting}
        onRename={(name) => dispatch({ type: 'RENAME', name })}
        onTemplate={changeTemplate}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        onNew={() => {
          if (project.placements.length && !window.confirm('Neues, leeres Projekt beginnen?')) return;
          dispatch({ type: 'NEW' });
          setSelectedUid(null);
        }}
        onSave={() => saveProjectFile(project)}
        onOpen={async (file) => {
          try {
            dispatch({ type: 'LOAD', project: await readProjectFile(file) });
            setSelectedUid(null);
            notify(`„${file.name}“ geöffnet.`);
          } catch (e) {
            notify(e instanceof Error ? e.message : 'Datei konnte nicht geöffnet werden.');
          }
        }}
        onExportPng={handleExport}
        onShare={() => setSharing(true)}
      />

      <main className="app-main">
        <Library
          armedPartId={armedPartId}
          onChipPointerDown={(partId, e) => beginPointer(partId, e)}
          onChipClick={(partId) => {
            if (suppressClick.current) return;
            setArmedPartId((cur) => (cur === partId ? null : partId));
          }}
        />

        <section className="panel canvas-panel">
          {armedPartId && (
            <div className="armed-bar">
              <span>
                <b>{getPart(armedPartId)?.name}</b> – auf eine freie Stelle im Schrank klicken.
              </span>
              <button className="btn small" onClick={() => setArmedPartId(null)}>
                Fertig (Esc)
              </button>
            </div>
          )}
          <div className="canvas-scroll">
            <CabinetCanvas
              svgRef={svgRef}
              project={project}
              geo={geo}
              selectedUid={selectedUid}
              preview={preview}
              armed={!!armedPartId}
              onPartPointerDown={(uid, e) => {
                e.stopPropagation();
                const p = project.placements.find((x) => x.uid === uid);
                if (!p) return;
                setSelectedUid(uid);
                setArmedPartId(null);
                beginPointer(p.partId, e, uid);
              }}
              onBackgroundClick={handleCanvasClick}
            />
          </div>
        </section>

        <PropertiesPanel
          project={project}
          template={template}
          selected={selected}
          onUpdate={(uid, patch) => dispatch({ type: 'UPDATE_PLACEMENT', uid, patch })}
          onRemove={remove}
          onDuplicate={duplicate}
        />
      </main>

      {dragPart && pointer && !preview && (
        <div className="drag-ghost" style={{ left: pointer.x, top: pointer.y }}>
          {dragPart.name}
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      {sharing && <ShareDialog project={project} onClose={() => setSharing(false)} />}
    </div>
  );
}
