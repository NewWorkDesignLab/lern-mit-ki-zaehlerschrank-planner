import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { getPart } from './catalog/parts';
import { TEMPLATES, getTemplate } from './catalog/templates';
import { BillOfMaterials } from './components/BillOfMaterials';
import { CabinetCanvas, formatTe } from './components/CabinetCanvas';
import type { Preview } from './components/CabinetCanvas';
import { Dock } from './components/Dock';
import type { DockSlot } from './components/Dock';
import { IconFit, IconList, IconMinus, IconMultiSelect, IconPlus } from './components/Icons';
import { Library } from './components/Library';
import { PartThumb } from './components/PartGraphic';
import { PropertiesPanel, PropertiesSection } from './components/PropertiesPanel';
import { ShareDialog } from './components/ShareDialog';
import { Toolbar } from './components/Toolbar';
import { TE_MM, computeGeometry, zoneAt } from './domain/geometry';
import {
  canPlace,
  firstFreeSpot,
  nearestFreeTe,
  planGroupMove,
  railZones,
  rangeBetween,
  retainFitting,
  snapTe,
  usedTe,
} from './domain/layout';
import type { GroupPlan } from './domain/layout';
import { computeTarget, wishAt } from './domain/target';
import { readProjectFile, saveProjectFile } from './export/file';
import { exportPng } from './export/png';
import { HASH_PREFIX, decodeProject } from './export/share';
import { useLayoutMode } from './state/layout';
import { newUid, useProject } from './state/store';
import { useCanvasZoom } from './state/useCanvasZoom';

/** Ab dieser Mausbewegung (px) wird aus einem Klick ein Ziehen. */
const DRAG_THRESHOLD = 5;

interface Pointer {
  partId: string;
  /** Gesetzt, wenn ein bereits platziertes Bauteil bewegt wird. */
  uid?: string;
  /** Gesetzt, wenn eine Mehrfachauswahl als Block bewegt wird (uid = gegriffenes Teil). */
  group?: string[];
  /** Tippen ohne Ziehen wählt das Teil ab (Auswahl-Modus auf Touch). */
  tapToggle?: boolean;
  startX: number;
  startY: number;
  x: number;
  y: number;
  dragging: boolean;
}

/** Auswahl-Pinsel: Ziehen über leere Fläche wählt alle überfahrenen Bauteile. */
interface Brush {
  startX: number;
  startY: number;
  last: { x: number; y: number };
  active: boolean;
  /** Auswahl vor dem Pinselstrich (bei Strg/Shift wird ergänzt, sonst ersetzt). */
  base: string[];
  hits: Set<string>;
}

/** Abstand (px) der Prüfpunkte zwischen zwei Mauspositionen beim Pinseln. */
const BRUSH_STEP = 6;

const isMod = (e: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }) => e.ctrlKey || e.metaKey || e.shiftKey;
const isCtrl = (e: { ctrlKey: boolean; metaKey: boolean }) => e.ctrlKey || e.metaKey;

/** Angetippter Platz im Schrank (Handy): Hutschiene/Zählerplatz und Wunsch-TE. */
interface Slot {
  field: number;
  zone: number;
  te: number;
}

export function App() {
  const { project, canUndo, canRedo, dispatch } = useProject();
  const template = getTemplate(project.templateId) ?? TEMPLATES[0];
  const geo = useMemo(() => computeGeometry(template), [template]);

  const layout = useLayoutMode();
  /** Handy / Tablet hoch: Schrank im Vollbild, Katalog & Eigenschaften im Dock. */
  const compact = layout === 'compact';
  /** Tablet & Handy: Zoom, Wischen verschiebt den Schrank. */
  const touchUi = layout !== 'desktop';

  const undoHint = touchUi ? 'Rückgängig' : 'Strg+Z';

  const svgRef = useRef<SVGSVGElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedRaw, setSelectedUids] = useState<string[]>([]);
  const [armedPartId, setArmedPartId] = useState<string | null>(null);
  const [pointer, setPointer] = useState<Pointer | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);
  /** Tablet: Seitenleiste mit Stückliste auch ohne Auswahl eingeblendet. */
  const [bomOpen, setBomOpen] = useState(false);
  /** Unterdrückt den Klick, der nach einem Ziehen ausgelöst wird. */
  const suppressClick = useRef(false);
  /** Rote Löschflächen links und rechts neben dem Schrank. */
  const trashLeft = useRef<HTMLDivElement>(null);
  const trashRight = useRef<HTMLDivElement>(null);
  const overTrash = useCallback((x: number, y: number) => {
    return [trashLeft.current, trashRight.current].some((el) => {
      const r = el?.getBoundingClientRect();
      return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });
  }, []);

  // Nur existierende Bauteile zählen (z. B. nach Rückgängig).
  const selectedUids = useMemo(
    () => selectedRaw.filter((uid) => project.placements.some((p) => p.uid === uid)),
    [selectedRaw, project.placements],
  );
  const selectedList = useMemo(
    () => project.placements.filter((p) => selectedUids.includes(p.uid)),
    [project.placements, selectedUids],
  );
  /** Genau ein gewähltes Bauteil (Eigenschaften, Duplizieren, Pfeiltasten). */
  const selected = selectedList.length === 1 ? selectedList[0] : null;

  const [brushPoints, setBrushPoints] = useState<{ x: number; y: number }[] | null>(null);
  const brushRef = useRef<Brush | null>(null);

  const zoom = useCanvasZoom(scrollRef, svgRef, geo, touchUi, () => {
    setPointer(null);
    brushRef.current = null;
    setBrushPoints(null);
  });

  // Layoutwechsel (z. B. Tablet drehen): wieder den ganzen Schrank zeigen.
  const resetZoom = zoom.reset;
  useEffect(() => resetZoom(), [layout, resetZoom]);

  // Platz-Auswahl gilt nur, solange nichts gewählt ist und das Dock sichtbar ist.
  useEffect(() => {
    if (selectedUids.length > 0 || !compact) setSlot(null);
  }, [selectedUids.length, compact]);
  useEffect(() => setSlot(null), [project.templateId]);

  /** Nach dem Hinzufügen: auf Desktop/Tablet auswählen, im Dock bleibt der Katalog offen. */
  const selectAdded = (uid: string) => {
    if (!compact) setSelectedUids([uid]);
  };

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
        notify(`${p.name ? `„${p.name}“` : 'Projekt'} aus Link geladen – Rückgängig stellt deinen vorherigen Stand wieder her.`);
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
  const beginPointer = (
    partId: string,
    e: ReactPointerEvent,
    uid?: string,
    group?: string[],
    tapToggle?: boolean,
  ) => {
    if (e.button !== 0) return;
    setPointer({
      partId,
      uid,
      group,
      tapToggle,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      dragging: false,
    });
  };

  // --- Auswahl per Klick ---------------------------------------------------------
  /** Anker für Shift+Klick (zuletzt einzeln angeklicktes Bauteil). */
  const anchorRef = useRef<string | null>(null);
  /** Auswahl-Modus für Touch: Tippen wählt hinzu/ab, Wischen über leere Fläche pinselt. */
  const [selectMode, setSelectMode] = useState(false);

  const handlePartPointerDown = (uid: string, e: ReactPointerEvent) => {
    e.stopPropagation();
    const p = project.placements.find((x) => x.uid === uid);
    if (!p) return;
    // Touch-Layout: nicht gewählte Teile erst antippen (Wischen scrollt den Schrank).
    if (touchUi && e.pointerType === 'touch' && !selectMode && !selectedUids.includes(uid)) return;
    setArmedPartId(null);

    if (e.shiftKey) {
      // Bereich wie im Datei-Explorer; mit Strg zusätzlich zur bestehenden Auswahl.
      const anchor = anchorRef.current ?? uid;
      anchorRef.current = anchor;
      const range = rangeBetween(project.placements, anchor, uid);
      setSelectedUids((s) => (isCtrl(e) ? [...new Set([...s, ...range])] : range));
      return;
    }
    if (isCtrl(e)) {
      anchorRef.current = uid;
      setSelectedUids((s) => (s.includes(uid) ? s.filter((x) => x !== uid) : [...s, uid]));
      return;
    }
    if (selectMode) {
      anchorRef.current = uid;
      if (selectedUids.includes(uid)) {
        // Gewähltes Teil: Ziehen bewegt die Auswahl, Tippen wählt es ab.
        beginPointer(p.partId, e, uid, selectedUids, true);
      } else {
        setSelectedUids((s) => [...s, uid]);
      }
      return;
    }
    anchorRef.current = uid;
    if (selectedUids.length > 1 && selectedUids.includes(uid)) {
      beginPointer(p.partId, e, uid, selectedUids);
      return;
    }
    setSelectedUids([uid]);
    beginPointer(p.partId, e, uid);
  };

  const handlePartTap = (uid: string) => {
    if (suppressClick.current || selectMode || selectedUids.includes(uid)) return;
    // Nur relevant, wenn pointerdown die Auswahl ausgelassen hat (Touch, siehe oben).
    anchorRef.current = uid;
    setArmedPartId(null);
    setSelectedUids([uid]);
  };

  /**
   * Plan für das Verschieben einer Gruppe: Versatz = Unterschied der Wunschstellen
   * zwischen Start- und aktueller Mausposition (so bleibt der Griffpunkt erhalten).
   */
  const groupPlanAt = useCallback(
    (p: Pointer, clientX: number, clientY: number): GroupPlan | null => {
      const anchor = p.uid ? project.placements.find((x) => x.uid === p.uid) : undefined;
      const part = anchor && getPart(anchor.partId);
      const from = toSvg(p.startX, p.startY);
      const to = toSvg(clientX, clientY);
      if (!p.group || !anchor || !part || !from || !to) return null;
      const a = wishAt(geo, part, from.x, from.y);
      const b = wishAt(geo, part, to.x, to.y);
      if (!a || !b || a.kind !== 'rail' || b.kind !== 'rail') {
        // Gruppen mit Zähler trotzdem melden, damit der Hinweis kommt.
        const plan = planGroupMove(template, project.placements, p.group, { dField: 0, dRail: 0, dTe: 0 });
        return plan.hasMeter ? plan : null;
      }
      const offset = {
        dField: b.field - a.field,
        dRail: railZones(template, b.field).indexOf(b.zone) - railZones(template, a.field).indexOf(a.zone),
        dTe: b.te - a.te,
      };
      return planGroupMove(template, project.placements, p.group, offset);
    },
    [project.placements, toSvg, geo, template],
  );

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
      if (!p.dragging) {
        // Klick (ohne Ziehen) auf ein Teil der Mehrfachauswahl: nur dieses behalten.
        const uid = p.uid;
        if (p.tapToggle && uid) setSelectedUids((s) => s.filter((x) => x !== uid));
        else if (p.group && uid) setSelectedUids([uid]);
        return;
      }
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 0);
      if (p.group) {
        if (overTrash(e.clientX, e.clientY)) {
          dispatch({ type: 'REMOVE_MANY', uids: p.group });
          setSelectedUids([]);
          notify(`${p.group.length} Bauteile entfernt – ${undoHint} holt sie zurück.`);
          return;
        }
        const plan = groupPlanAt(p, e.clientX, e.clientY);
        if (!plan) return;
        if (plan.hasMeter) notify('Zähler bitte einzeln verschieben.');
        else if (!plan.valid) notify('Dort ist nicht für alle ausgewählten Bauteile Platz.');
        else dispatch({ type: 'MOVE_MANY', moves: plan.moves });
        return;
      }
      if (p.uid && overTrash(e.clientX, e.clientY)) {
        const removed = p.uid;
        dispatch({ type: 'REMOVE', uid: removed });
        setSelectedUids((s) => s.filter((x) => x !== removed));
        notify(`Bauteil entfernt – ${undoHint} holt es zurück.`);
        return;
      }
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
        if (!compact) setSelectedUids([uid]);
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
  }, [pointer, targetAt, groupPlanAt, dispatch, notify, overTrash, compact, undoHint]);

  // --- Auswahl-Pinsel ------------------------------------------------------------
  const beginBrush = (e: ReactPointerEvent) => {
    if (e.button !== 0 || armedPartId) return;
    // Auf Touch scrollt Wischen den Schrank – gepinselt wird nur im Auswahl-Modus.
    if (e.pointerType === 'touch' && !selectMode) return;
    brushRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      last: { x: e.clientX, y: e.clientY },
      active: false,
      base: isMod(e) || selectMode ? selectedUids : [],
      hits: new Set(),
    };
    setBrushPoints([]);
  };

  const brushing = brushPoints !== null;
  useEffect(() => {
    if (!brushing) return;
    const move = (e: PointerEvent) => {
      const b = brushRef.current;
      if (!b) return;
      if (!b.active && Math.hypot(e.clientX - b.startX, e.clientY - b.startY) <= DRAG_THRESHOLD) return;
      const first = !b.active;
      b.active = true;
      // Zwischenpunkte prüfen, damit schnelle Bewegungen keine Bauteile überspringen.
      const from = first ? { x: b.startX, y: b.startY } : b.last;
      const steps = Math.max(1, Math.ceil(Math.hypot(e.clientX - from.x, e.clientY - from.y) / BRUSH_STEP));
      let found = false;
      for (let i = 0; i <= steps; i++) {
        const x = from.x + ((e.clientX - from.x) * i) / steps;
        const y = from.y + ((e.clientY - from.y) * i) / steps;
        for (const el of document.elementsFromPoint(x, y)) {
          const uid = el.closest('[data-uid]')?.getAttribute('data-uid');
          if (uid && !b.hits.has(uid)) {
            b.hits.add(uid);
            found = true;
          }
        }
      }
      b.last = { x: e.clientX, y: e.clientY };
      if (found || first) setSelectedUids([...new Set([...b.base, ...b.hits])]);
      const pts = first ? [{ x: b.startX, y: b.startY }, b.last] : [b.last];
      setBrushPoints((cur) => [...(cur ?? []), ...pts]);
    };
    const up = () => {
      const b = brushRef.current;
      brushRef.current = null;
      setBrushPoints(null);
      if (b?.active) {
        // Den Klick nach dem Pinselstrich nicht als "Auswahl aufheben" werten.
        suppressClick.current = true;
        setTimeout(() => (suppressClick.current = false), 0);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [brushing]);

  const brushPath = useMemo(() => {
    if (!brushPoints || brushPoints.length < 2) return null;
    return brushPoints.flatMap((p) => {
      const s = toSvg(p.x, p.y);
      return s ? [{ x: s.x, y: s.y }] : [];
    });
  }, [brushPoints, toSvg]);

  /** Ein platziertes Bauteil (oder eine Gruppe) wird gerade gezogen (Löschflächen aktiv). */
  const draggingPlaced = !!(pointer?.dragging && pointer.uid);
  const trashHot = draggingPlaced && !!pointer && overTrash(pointer.x, pointer.y);
  const movingUids = useMemo(
    () => (pointer?.dragging && pointer.uid ? (pointer.group ?? [pointer.uid]) : []),
    [pointer],
  );

  const previews: Preview[] = useMemo(() => {
    if (pointer?.dragging) {
      if (pointer.uid && overTrash(pointer.x, pointer.y)) return [];
      if (pointer.group) {
        const plan = groupPlanAt(pointer, pointer.x, pointer.y);
        if (!plan || plan.hasMeter) return [];
        return plan.moves.flatMap((m) => {
          const src = project.placements.find((x) => x.uid === m.uid);
          const part = src && getPart(src.partId);
          if (!part || m.zone < 0) return [];
          return [{ part, target: { field: m.field, zone: m.zone, te: m.te, valid: !plan.invalidUids.includes(m.uid) } }];
        });
      }
      const hit = targetAt(pointer.partId, pointer.x, pointer.y, pointer.uid);
      return hit ? [hit] : [];
    }
    // Klick-Platzieren: dieselbe Vorschau an der Mausposition.
    if (armedPartId && hover && !pointer) {
      const hit = targetAt(armedPartId, hover.x, hover.y);
      return hit ? [hit] : [];
    }
    return [];
  }, [pointer, armedPartId, hover, targetAt, groupPlanAt, overTrash, project.placements]);

  // --- Klick-Platzierung mit ausgewähltem Bibliotheksteil ------------------------
  const handleCanvasClick = (clientX: number, clientY: number) => {
    if (suppressClick.current) return;
    if (!armedPartId) {
      // Im Auswahl-Modus hebt ein versehentliches Tippen daneben die Auswahl nicht auf.
      if (selectMode) return;
      if (compact && selectedUids.length === 0) {
        setSlot(slotAt(clientX, clientY));
        return;
      }
      setSelectedUids([]);
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
    selectAdded(uid);
  };

  // --- Platz antippen -> Dock zeigt, was dort hinpasst (Handy) -------------------
  const slotAt = (clientX: number, clientY: number): Slot | null => {
    const p = toSvg(clientX, clientY);
    const z = p && zoneAt(geo, p.x, p.y);
    if (!p || !z) return null;
    if (z.zone.kind === 'rail') return { field: z.field, zone: z.index, te: snapTe((p.x - z.railX) / TE_MM) };
    if (z.zone.kind === 'meter') return { field: z.field, zone: z.index, te: 0 };
    return null;
  };

  /** Freie Stelle für ein Bauteil im Platz – nahe der angetippten Stelle. */
  const slotSpot = useCallback(
    (s: Slot, partId: string) => {
      const part = getPart(partId);
      if (!part) return null;
      const te = nearestFreeTe(template, project.placements, part, s.field, s.zone, s.te - part.widthTE / 2);
      return te === null ? null : { part, te };
    },
    [template, project.placements],
  );

  const dockSlot: DockSlot | null = useMemo(() => {
    if (!slot) return null;
    const field = template.fields[slot.field];
    const zone = field?.zones[slot.zone];
    if (!zone) return null;
    const free =
      zone.kind === 'rail' ? ` · ${formatTe(zone.te - usedTe(project.placements, slot.field, slot.zone))} TE frei` : '';
    return {
      label: `${field.name} · ${zone.label}${free}`,
      fits: (part) => slotSpot(slot, part.id) !== null,
    };
  }, [slot, template, project.placements, slotSpot]);

  const placeInSlot = (partId: string) => {
    if (!slot) return;
    const spot = slotSpot(slot, partId);
    if (!spot) {
      notify('Dort ist kein Platz für dieses Bauteil.');
      return;
    }
    dispatch({ type: 'ADD', uid: newUid(), partId, field: slot.field, zone: slot.zone, te: spot.te });
    // Das nächste Teil landet rechts daneben.
    setSlot({ ...slot, te: spot.te + spot.part.widthTE * 1.5 });
  };

  // --- Aktionen ------------------------------------------------------------------
  const remove = useCallback(
    (uid: string) => {
      dispatch({ type: 'REMOVE', uid });
      setSelectedUids((s) => s.filter((x) => x !== uid));
    },
    [dispatch],
  );

  const removeMany = useCallback(
    (uids: string[]) => {
      if (uids.length === 0) return;
      dispatch({ type: 'REMOVE_MANY', uids });
      setSelectedUids([]);
      if (uids.length > 1) notify(`${uids.length} Bauteile entfernt – ${undoHint} holt sie zurück.`);
    },
    [dispatch, notify, undoHint],
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
    setSelectedUids([newId]);
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
    setSelectedUids([]);
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
      } else if (mod && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedUids(project.placements.map((p) => p.uid));
      } else if (e.key === 'Escape') {
        setArmedPartId(null);
        setSlot(null);
        setSelectedUids([]);
        setSelectMode(false);
      } else if (selectedUids.length > 0 && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        if (selected) remove(selected.uid);
        else removeMany(selectedUids);
      } else if (selectedUids.length > 1 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const dTe = e.key === 'ArrowLeft' ? -0.5 : 0.5;
        const plan = planGroupMove(template, project.placements, selectedUids, { dField: 0, dRail: 0, dTe });
        if (plan.valid) {
          e.preventDefault();
          dispatch({ type: 'MOVE_MANY', moves: plan.moves });
        }
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
  }, [dispatch, selected, selectedUids, remove, removeMany, template, project.placements]);

  const dragPart = pointer?.dragging ? getPart(pointer.partId) : undefined;

  const handleChipClick = (partId: string) => {
    if (suppressClick.current) return;
    if (slot) placeInSlot(partId);
    else setArmedPartId((cur) => (cur === partId ? null : partId));
  };

  const propertiesProps = {
    template,
    selected,
    selection: selectedList,
    onUpdate: (uid: string, patch: { bmk?: string; note?: string }) => dispatch({ type: 'UPDATE_PLACEMENT', uid, patch }),
    onRemoveMany: removeMany,
    touch: touchUi,
  };
  const sidebarOpen = selectedUids.length > 0 || bomOpen;

  return (
    <div
      className={`app layout-${layout} ${pointer?.dragging ? 'is-dragging' : ''} ${brushing ? 'is-brushing' : ''}`}
    >
      <Toolbar
        project={project}
        compact={compact}
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
          setSelectedUids([]);
        }}
        onSave={() => saveProjectFile(project)}
        onOpen={async (file) => {
          try {
            dispatch({ type: 'LOAD', project: await readProjectFile(file) });
            setSelectedUids([]);
            notify(`„${file.name}“ geöffnet.`);
          } catch (e) {
            notify(e instanceof Error ? e.message : 'Datei konnte nicht geöffnet werden.');
          }
        }}
        onExportPng={handleExport}
        onShare={() => setSharing(true)}
      />

      <main className="app-main">
        {!compact && (
          <Library
            armedPartId={armedPartId}
            onChipPointerDown={(partId, e) => beginPointer(partId, e)}
            onChipClick={handleChipClick}
          />
        )}

        <section className="panel canvas-panel">
          <div className="canvas-stage">
            {armedPartId && (
              // Schwebt über dem Schrank – verschiebt das Layout nicht.
              <div className="armed-bar" role="status">
                <span>
                  <b>{getPart(armedPartId)?.name}</b> – auf eine freie Stelle im Schrank {touchUi ? 'tippen' : 'klicken'}.
                </span>
                <button className="btn small" onClick={() => setArmedPartId(null)}>
                  {touchUi ? 'Fertig' : 'Fertig (Esc)'}
                </button>
              </div>
            )}
            {!armedPartId && (
              // Werkzeug nur auf Touch-Geräten (CSS) – ersetzt Strg+Klick und den Maus-Pinsel.
              <button
                className={`tool-btn touch-only ${selectMode ? 'active' : ''}`}
                onClick={() => setSelectMode((v) => !v)}
                aria-pressed={selectMode}
                title={
                  selectMode
                    ? 'Mehrfachauswahl beenden'
                    : 'Mehrere Bauteile antippen oder überwischen'
                }
              >
                <IconMultiSelect />
                {selectMode ? 'Auswahl beenden' : 'Mehrfachauswahl'}
              </button>
            )}
            {layout === 'tablet' && !sidebarOpen && (
              <button className="tool-btn bom-btn" onClick={() => setBomOpen(true)}>
                <IconList />
                Stückliste
                {project.placements.length > 0 && <span className="dock-badge">{project.placements.length}</span>}
              </button>
            )}
            {touchUi && (
              <div className="zoom-ctrl" role="group" aria-label="Zoom">
                <button onClick={() => zoom.zoomBy(1 / 1.5)} disabled={zoom.zoom <= 1} aria-label="Verkleinern">
                  <IconMinus />
                </button>
                <button onClick={zoom.reset} disabled={zoom.zoom <= 1} aria-label="Ganzen Schrank zeigen" title="Einpassen">
                  <IconFit />
                </button>
                <button onClick={() => zoom.zoomBy(1.5)} aria-label="Vergrößern">
                  <IconPlus />
                </button>
              </div>
            )}
            <TrashZone side="left" ref={trashLeft} active={draggingPlaced} hot={trashHot} />
            <TrashZone side="right" ref={trashRight} active={draggingPlaced} hot={trashHot} />
            <div ref={scrollRef} className="canvas-scroll">
              <CabinetCanvas
                svgRef={svgRef}
                project={project}
                geo={geo}
                selectedUids={selectedUids}
                previews={previews}
                movingUids={movingUids}
                brushPath={brushPath}
                armed={!!armedPartId}
                selectMode={selectMode}
                touchPan={touchUi}
                slotZone={slot}
                style={zoom.size}
                onPartPointerDown={handlePartPointerDown}
                onPartTap={handlePartTap}
                onBackgroundPointerDown={beginBrush}
                onBackgroundClick={handleCanvasClick}
                onHover={setHover}
                onDuplicate={duplicate}
                onRemove={remove}
              />
            </div>
          </div>
        </section>

        {!compact && (
          <PropertiesPanel
            project={project}
            {...propertiesProps}
            className={layout === 'tablet' ? `drawer ${sidebarOpen ? 'open' : ''}` : ''}
            onClose={
              layout === 'tablet'
                ? () => {
                    setSelectedUids([]);
                    setBomOpen(false);
                  }
                : undefined
            }
          />
        )}
      </main>

      {compact && (
        <Dock
          armedPartId={armedPartId}
          selectionCount={selectedUids.length}
          bomCount={project.placements.length}
          slot={dockSlot}
          draggingFromCatalog={!!pointer?.dragging && !pointer.uid}
          properties={<PropertiesSection {...propertiesProps} />}
          bom={<BillOfMaterials project={project} />}
          onTilePointerDown={(partId, e) => beginPointer(partId, e)}
          onTileClick={handleChipClick}
          onCloseSlot={() => setSlot(null)}
        />
      )}

      {dragPart && pointer && previews.length === 0 && (
        // Frei schwebender Geist am Mauszeiger, solange das Teil nirgends einrastet.
        <div className={`drag-ghost ${trashHot ? 'delete' : ''}`} style={{ left: pointer.x, top: pointer.y }}>
          <span className="drag-ghost-part">
            <PartThumb part={dragPart} size={84} />
          </span>
          <span className="drag-ghost-label">
            {pointer.group
              ? `${pointer.group.length} Bauteile${trashHot ? ' entfernen' : ''}`
              : trashHot
                ? `${dragPart.name} entfernen`
                : dragPart.name}
          </span>
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

/** Rote Ablagefläche zum Löschen platzierter Bauteile (Treffer wird in App geprüft). */
const TrashZone = forwardRef<HTMLDivElement, { side: 'left' | 'right'; active: boolean; hot: boolean }>(
  function TrashZone({ side, active, hot }, ref) {
    return (
      <div ref={ref} className={`trash-zone ${side} ${active ? 'active' : ''} ${hot ? 'hot' : ''}`} aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
        </svg>
        <span>Hierher ziehen zum Löschen</span>
      </div>
    );
  },
);
