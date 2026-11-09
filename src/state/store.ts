// ---------------------------------------------------------------------------
// Projekt-State: Reducer mit Rückgängig/Wiederholen + Autosave im Browser.
// ---------------------------------------------------------------------------

import { useEffect, useReducer } from 'react';
import { getPart } from '../catalog/parts';
import { DEFAULT_TEMPLATE_ID, getTemplate } from '../catalog/templates';
import { canPlace, normalizeProject, retainFitting, suggestBmk } from '../domain/layout';
import type { Placement, Project } from '../domain/types';

export type Action =
  | { type: 'ADD'; uid: string; partId: string; field: number; zone: number; te: number }
  | { type: 'MOVE'; uid: string; field: number; zone: number; te: number }
  | { type: 'REMOVE'; uid: string }
  | { type: 'UPDATE_PLACEMENT'; uid: string; patch: Partial<Pick<Placement, 'bmk' | 'note'>> }
  | { type: 'RENAME'; name: string }
  | { type: 'SET_TEMPLATE'; templateId: string }
  | { type: 'LOAD'; project: Project }
  | { type: 'NEW' }
  | { type: 'UNDO' }
  | { type: 'REDO' };

export interface History {
  past: Project[];
  present: Project;
  future: Project[];
  /** Schlüssel der letzten Texteingabe – Tippen erzeugt nur einen Undo-Schritt. */
  coalesceKey: string | null;
}

const MAX_HISTORY = 100;
const STORAGE_KEY = 'zs-planer:project';

export function newProject(): Project {
  return { version: 1, name: '', templateId: DEFAULT_TEMPLATE_ID, placements: [] };
}

export function newUid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function apply(p: Project, action: Action): Project {
  const template = getTemplate(p.templateId);
  if (!template) return p;

  switch (action.type) {
    case 'ADD': {
      const part = getPart(action.partId);
      if (!part || !canPlace(template, p.placements, part, action.field, action.zone, action.te)) return p;
      const placement: Placement = {
        uid: action.uid,
        partId: part.id,
        field: action.field,
        zone: action.zone,
        te: action.te,
        bmk: suggestBmk(p.placements, part),
      };
      return { ...p, placements: [...p.placements, placement] };
    }
    case 'MOVE': {
      const cur = p.placements.find((x) => x.uid === action.uid);
      const part = cur && getPart(cur.partId);
      if (!cur || !part) return p;
      if (!canPlace(template, p.placements, part, action.field, action.zone, action.te, cur.uid)) return p;
      if (cur.field === action.field && cur.zone === action.zone && cur.te === action.te) return p;
      return {
        ...p,
        placements: p.placements.map((x) =>
          x.uid === action.uid ? { ...x, field: action.field, zone: action.zone, te: action.te } : x,
        ),
      };
    }
    case 'REMOVE':
      return { ...p, placements: p.placements.filter((x) => x.uid !== action.uid) };
    case 'UPDATE_PLACEMENT':
      return {
        ...p,
        placements: p.placements.map((x) => (x.uid === action.uid ? { ...x, ...action.patch } : x)),
      };
    case 'RENAME':
      return { ...p, name: action.name };
    case 'SET_TEMPLATE': {
      const next = getTemplate(action.templateId);
      if (!next || next.id === p.templateId) return p;
      return { ...p, templateId: next.id, placements: retainFitting(next, p.placements) };
    }
    case 'LOAD':
      return action.project;
    case 'NEW':
      return newProject();
    default:
      return p;
  }
}

function coalesceKeyOf(action: Action): string | null {
  if (action.type === 'UPDATE_PLACEMENT') return `u:${action.uid}:${Object.keys(action.patch).join()}`;
  if (action.type === 'RENAME') return 'rename';
  return null;
}

export function historyReducer(state: History, action: Action): History {
  if (action.type === 'UNDO') {
    const prev = state.past[state.past.length - 1];
    if (!prev) return state;
    return {
      past: state.past.slice(0, -1),
      present: prev,
      future: [state.present, ...state.future],
      coalesceKey: null,
    };
  }
  if (action.type === 'REDO') {
    const [next, ...rest] = state.future;
    if (!next) return state;
    return { past: [...state.past, state.present], present: next, future: rest, coalesceKey: null };
  }

  const present = apply(state.present, action);
  if (present === state.present) return state;

  const key = coalesceKeyOf(action);
  if (key && key === state.coalesceKey) {
    return { ...state, present, future: [] };
  }
  return {
    past: [...state.past, state.present].slice(-MAX_HISTORY),
    present,
    future: [],
    coalesceKey: key,
  };
}

function loadSaved(): Project {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeProject(JSON.parse(raw), getTemplate);
  } catch {
    // Kein oder beschädigter Speicherstand – mit leerem Projekt starten.
  }
  return newProject();
}

export function useProject() {
  const [state, dispatch] = useReducer(historyReducer, undefined, () => ({
    past: [],
    present: loadSaved(),
    future: [],
    coalesceKey: null,
  }));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.present));
    } catch {
      // Speichern nicht möglich (z. B. privater Modus) – kein Abbruch.
    }
  }, [state.present]);

  return {
    project: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    dispatch,
  };
}
