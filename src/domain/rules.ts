// ---------------------------------------------------------------------------
// Regelwerk / Validierungs-Engine
// Reine Funktionen, keine Seiteneffekte -> gut unit-testbar.
// Jede Regel prüft die aktuelle Belegung gegen die fachlichen Sollvorgaben.
// ---------------------------------------------------------------------------

import type { LevelDefinition, PaletteItem, Placement, Slot } from './types';

/** Maschinenlesbarer Fehlercode – Grundlage für den adaptiven Hinweis. */
export type ErrorCode =
  | 'RCD_TYPE_MISSING_TYPE_B' // Typ A wo Typ B (glatter DC) nötig ist
  | 'RCD_TYPE_UNNECESSARY_TYPE_B' // Typ B "sicherheitshalber" ohne fachlichen Grund
  | 'LS_RATING_TOO_HIGH' // LS-Nennstrom > Belastbarkeit des Querschnitts
  | 'LS_RATING_TOO_LOW' // LS löst schon im Normalbetrieb der Last aus
  | 'LS_WRONG_TRIP_CHAR' // falsche Auslösecharakteristik
  | 'USS_MISSING' // Überspannungsschutz fehlt trotz Anlagenrisiko
  | 'CONTROL_ELEMENT_MISSING' // WP fest verdrahtet statt über SG-Ready schaltbar
  | 'WRONG_COMPONENT_KIND' // völlig falsche Bauteilart im Slot
  | 'SLOT_EMPTY'; // Pflicht-Slot noch unbelegt

export interface Violation {
  slotId: string;
  bmk: string;
  code: ErrorCode;
  /** Kurztext fürs UI (eine Zeile). */
  message: string;
  /** Verweis auf das passende Infofeld. */
  infoKey: string;
}

export interface ValidationResult {
  violations: Violation[];
  /** Anteil korrekt & vollständig belegter Pflicht-Slots (0..1). */
  progress: number;
  solved: boolean;
}

/**
 * Belastbarkeit (Bemessungsstrom-Obergrenze) je Querschnitt – vereinfachte
 * Referenzwerte für Verlegeart B2/C, wie sie im 1./2. Lehrjahr vermittelt
 * werden. Bewusste Prototyp-Vereinfachung, im Infofeld als solche erklärt.
 */
const AMPACITY_BY_CROSS_SECTION: Record<number, number> = {
  1.5: 16,
  2.5: 20,
  4: 25,
  6: 32,
  10: 50,
  16: 63,
  25: 80,
};

/** Findet ein Palette-Item über seine id. */
function itemById(level: LevelDefinition, id: string | null | undefined): PaletteItem | undefined {
  if (!id) return undefined;
  return level.palette.find((p) => p.id === id);
}

/** Effektiv im Slot liegendes Bauteil (vorgesteckt ODER platziert). */
export function effectiveItem(
  level: LevelDefinition,
  slot: Slot,
  placement: Placement,
): PaletteItem | undefined {
  const placedId = slot.prefilledItemId ?? placement[slot.id];
  return itemById(level, placedId);
}

/** Alle Slots eines Levels flach. */
export function allSlots(level: LevelDefinition): Slot[] {
  return level.branches.flatMap((b) => b.slots);
}

/**
 * Prüft einen einzelnen Slot und liefert (höchstens) eine Verletzung zurück.
 * Reihenfolge der Prüfungen ist bewusst gewählt: erst grobe, dann feine Fehler.
 */
export function validateSlot(
  level: LevelDefinition,
  slot: Slot,
  placement: Placement,
): Violation | null {
  // Vorgesteckte / gesperrte Slots (SLS, Zähler) sind per Definition korrekt.
  if (slot.locked || slot.prefilledItemId) return null;

  const item = effectiveItem(level, slot, placement);

  const v = (code: ErrorCode, message: string, infoKey = slot.infoKey): Violation => ({
    slotId: slot.id,
    bmk: slot.bmk,
    code,
    message,
    infoKey,
  });

  // 0) Pflicht-Slot leer?
  if (!item) {
    return v('SLOT_EMPTY', `${slot.bmk}: Hier fehlt noch ein Betriebsmittel.`);
  }

  // 1) Völlig falsche Bauteilart (z.B. RCD wo ein LS hingehört)?
  if (item.kind !== slot.accepts) {
    // Spezialfall Lastmanagement: WP-Freigabe braucht ein SCHALTBARES Steuerelement
    // (Schütz/SG-Ready), nicht einen fest verdrahteten Leitungsschutzschalter.
    if (slot.accepts === 'CONTACTOR') {
      return v(
        'CONTROL_ELEMENT_MISSING',
        `${slot.bmk}: Die Wärmepumpe muss über das Lastmanagement schaltbar sein – hier gehört ein SG-Ready-Schütz hin, keine feste Verdrahtung.`,
        'sg-ready',
      );
    }
    return v(
      'WRONG_COMPONENT_KIND',
      `${slot.bmk}: Ein ${item.label} passt hier fachlich nicht.`,
    );
  }

  // 2) RCD-Typ-Regeln (Kernpuzzle des PV-Levels)
  if (slot.accepts === 'RCD') {
    const needsB = slot.requiredRcdType === 'B' || slot.sourceFaultCurrent === 'smooth-DC';
    if (needsB && item.rcdType !== 'B') {
      return v(
        'RCD_TYPE_MISSING_TYPE_B',
        `${slot.bmk}: Hinter dem Wechselrichter können glatte Gleichfehlerströme auftreten – Typ A erkennt die nicht.`,
        'rcd-type-b',
      );
    }
    if (!needsB && item.rcdType === 'B') {
      return v(
        'RCD_TYPE_UNNECESSARY_TYPE_B',
        `${slot.bmk}: Typ B ist hier nicht die fachliche Antwort – kein glatter Gleichfehlerstrom zu erwarten.`,
        'rcd-type-choice',
      );
    }
  }

  // 3) LS-Dimensionierung
  if (slot.accepts === 'LS') {
    if (slot.requiredTripChar && item.tripChar && item.tripChar !== slot.requiredTripChar) {
      return v(
        'LS_WRONG_TRIP_CHAR',
        `${slot.bmk}: Für diesen Verbraucher ist Charakteristik ${slot.requiredTripChar} vorgesehen, nicht ${item.tripChar}.`,
        'ls-characteristic',
      );
    }
    const ampacity = slot.conductor
      ? AMPACITY_BY_CROSS_SECTION[slot.conductor.crossSectionMm2]
      : undefined;
    if (ampacity !== undefined && item.ratingA !== undefined && item.ratingA > ampacity) {
      return v(
        'LS_RATING_TOO_HIGH',
        `${slot.bmk}: ${item.ratingA} A schützt ${slot.conductor?.crossSectionMm2} mm² nicht – die Leitung überhitzt, bevor der LS auslöst.`,
        'ls-cross-section',
      );
    }
    if (
      slot.loadDemandA !== undefined &&
      item.ratingA !== undefined &&
      item.ratingA < slot.loadDemandA
    ) {
      return v(
        'LS_RATING_TOO_LOW',
        `${slot.bmk}: ${item.ratingA} A ist zu klein – der LS würde schon im Normalbetrieb auslösen.`,
        'ls-cross-section',
      );
    }
  }

  // 4) ÜSS bei erhöhtem Anlagenrisiko
  if (slot.accepts === 'USS' && slot.requiresUssBecauseExternalWiring && item.kind !== 'USS') {
    return v(
      'USS_MISSING',
      `${slot.bmk}: Diese Anlage hat Leitungen im Außen-/Dachbereich – ein Überspannungsschutz gehört hierher.`,
      'uss',
    );
  }

  return null;
}

/** Validiert das gesamte Level. */
export function validateLevel(level: LevelDefinition, placement: Placement): ValidationResult {
  const slots = allSlots(level);
  // Nur "echte" Aufgaben-Slots zählen für den Fortschritt (nicht SLS/Zähler).
  const taskSlots = slots.filter((s) => !s.locked && !s.prefilledItemId);

  const violations: Violation[] = [];
  let correct = 0;
  for (const slot of taskSlots) {
    const violation = validateSlot(level, slot, placement);
    if (violation) {
      violations.push(violation);
    } else {
      correct += 1;
    }
  }

  const progress = taskSlots.length === 0 ? 1 : correct / taskSlots.length;
  const solved = violations.length === 0 && correct === taskSlots.length;
  return { violations, progress, solved };
}
