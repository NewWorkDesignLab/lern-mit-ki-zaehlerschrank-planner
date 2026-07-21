// ---------------------------------------------------------------------------
// Zentrale Level-Registry + Freischalt-Logik der Progression.
// Weitere Level = einfach hier importieren und einreihen.
// ---------------------------------------------------------------------------

import type { LevelDefinition } from '../domain/types';
import { ZS_PV_LEVEL } from './zs-pv';
import { ZS_WP_LEVEL } from './zs-wp';

/** Alle Level in Progressions-Reihenfolge. */
export const LEVEL_LIST: LevelDefinition[] = [ZS_PV_LEVEL, ZS_WP_LEVEL].sort(
  (a, b) => a.order - b.order,
);

export const LEVELS: Record<string, LevelDefinition> = Object.fromEntries(
  LEVEL_LIST.map((l) => [l.id, l]),
);

/**
 * Ein Level ist freigeschaltet, wenn es das erste ist oder das vorherige
 * Level bereits abgeschlossen wurde.
 */
export function isUnlocked(levelId: string, completed: ReadonlySet<string>): boolean {
  const idx = LEVEL_LIST.findIndex((l) => l.id === levelId);
  if (idx <= 0) return true;
  return completed.has(LEVEL_LIST[idx - 1].id);
}

/** Nächstes Level in der Reihenfolge (oder undefined am Ende). */
export function nextLevel(levelId: string): LevelDefinition | undefined {
  const idx = LEVEL_LIST.findIndex((l) => l.id === levelId);
  return idx >= 0 ? LEVEL_LIST[idx + 1] : undefined;
}
