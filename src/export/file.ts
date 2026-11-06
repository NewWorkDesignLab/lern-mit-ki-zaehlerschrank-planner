// ---------------------------------------------------------------------------
// Datei-Helfer: Download auslösen, Projekt als .json speichern/öffnen.
// ---------------------------------------------------------------------------

import { getTemplate } from '../catalog/templates';
import { normalizeProject } from '../domain/layout';
import type { Project } from '../domain/types';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function fileSlug(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'zaehlerschrank';
}

export function saveProjectFile(project: Project) {
  const data = JSON.stringify({ app: 'zaehlerschrank-planer', ...project }, null, 2);
  downloadBlob(new Blob([data], { type: 'application/json' }), `${fileSlug(project.name)}.zsplan.json`);
}

export async function readProjectFile(file: File): Promise<Project> {
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw new Error('Die Datei ist keine gültige Projektdatei (JSON).');
  }
  return normalizeProject(raw, getTemplate);
}
