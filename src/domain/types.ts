// ---------------------------------------------------------------------------
// Fachliches Datenmodell (Single Source of Truth)
// Spielansicht und Fachansicht werden BEIDE aus diesen Strukturen gerendert.
// Es gibt keine zwei parallelen Wahrheiten – nur zwei Renderer über einem State.
// ---------------------------------------------------------------------------

/** Bauteilart im Zählerschrank. */
export type ComponentKind =
  | 'SLS' //   Selektiver Hauptleitungsschutzschalter (plombiert, Netzbetreiber)
  | 'METER' //   Zähler (EVU)
  | 'ENERGY_METER' //   Energie Meter / Messeinrichtung
  | 'USS' //   Überspannungsschutzgerät
  | 'LS' //   Leitungsschutzschalter
  | 'RCD' //   Fehlerstromschutzschalter (RCD/FI)
  | 'CONTACTOR' //   Schütz / SG-Ready-Steuerkontakt (aktives Schalten fürs Lastmanagement)
  | 'KAMMSCHIENE' //   Sammelschiene für Endstromkreise
  | 'LOAD'; //   Verbraucher / Abgang (Ziel)

/** Auslösecharakteristik eines Leitungsschutzschalters. */
export type TripChar = 'B' | 'K' | 'E';

/**
 * RCD-Erkennungstyp. WICHTIG: Kein Stärke-Ranking!
 * Typ A und Typ B erkennen unterschiedliche Fehlerstromarten.
 */
export type RcdType = 'A' | 'B';

/**
 * Art des Fehlerstroms, den eine Quelle im Fehlerfall erzeugen kann.
 * - 'AC'          : reiner Wechselfehlerstrom
 * - 'pulsating-DC': pulsierender Gleichfehlerstrom (Typ A erkennt das)
 * - 'smooth-DC'   : glatter Gleichfehlerstrom hinter einem Wechselrichter
 *                   -> erfordert Typ B, Typ A würde "erblinden"
 */
export type FaultCurrentKind = 'AC' | 'pulsating-DC' | 'smooth-DC';

/** Leiter/Kabel mit realem Querschnitt. */
export interface Conductor {
  type: 'H07V-K' | 'NYM-J' | 'H07RN-F' | 'H07V2-K';
  crossSectionMm2: number;
  cores?: number;
}

/**
 * Ein konkretes Bauteil aus der Palette, das der Azubi platzieren kann.
 * Enthält alle fachlich relevanten Eigenschaften.
 */
export interface PaletteItem {
  id: string;
  kind: ComponentKind;
  label: string;
  /** Nennstrom in Ampere (LS, RCD, SLS). */
  ratingA?: number;
  /** Auslösecharakteristik (nur LS/SLS). */
  tripChar?: TripChar;
  /** Erkennungstyp (nur RCD). */
  rcdType?: RcdType;
  /** Bemessungsdifferenzstrom in mA (nur RCD). */
  ratedResidualMa?: number;
  /** Schlüssel für den Infotext (siehe content/infotexts.ts). */
  infoKey: string;
}

/**
 * Ein Steckplatz im Schrank (Hutschienen-Platz). Der Azubi zieht ein
 * passendes Bauteil hinein. Der Slot kennt seine fachliche Sollvorgabe.
 */
export interface Slot {
  id: string;
  /** Betriebsmittelkennzeichen aus dem realen Schaltplan, z.B. '+ZS2-F3'. */
  bmk: string;
  title: string;
  /** Welche Bauteilart hier fachlich hingehört. */
  accepts: ComponentKind;
  /** Kurzbeschreibung des Zweigs / der Aufgabe. */
  description: string;
  infoKey: string;

  // --- Zustand: was liegt aktuell drin? ---
  /** Fest vorgegeben & unveränderbar (z.B. SLS = Netzbetreiber). */
  locked?: boolean;
  /** Bereits ab Werk gestecktes Bauteil (SLS, Zähler ...). */
  prefilledItemId?: string;

  // --- Sollvorgaben für die Regel-Engine ---
  /** Fehlerstromart der Quelle hinter diesem RCD-Zweig. */
  sourceFaultCurrent?: FaultCurrentKind;
  /** Geforderter RCD-Typ (didaktisch abgeleitet aus sourceFaultCurrent). */
  requiredRcdType?: RcdType;
  /** Strombedarf der Last in Ampere (für LS-Dimensionierung). */
  loadDemandA?: number;
  /** Verlegter Leiter (bestimmt zulässigen LS-Nennstrom). */
  conductor?: Conductor;
  /** Geforderte Auslösecharakteristik (falls relevant). */
  requiredTripChar?: TripChar;
  /** Erhöhtes Anlagenrisiko durch Außen-/Dachleitungen -> ÜSS nötig. */
  requiresUssBecauseExternalWiring?: boolean;
}

/** Eine logische Gruppe von Slots (ein "Zweig" im Schrank). */
export interface Branch {
  id: string;
  title: string;
  slots: Slot[];
}

/**
 * Ein Situations-Szenario für die SG-Ready-„Ampel" (Lastmanagement).
 * Der Azubi entscheidet, ob die Wärmepumpe freigegeben, normal betrieben oder
 * gesperrt/gedrosselt werden soll.
 */
export type AmpelState = 'FREIGABE' | 'NORMAL' | 'SPERRE';

export interface AmpelSituation {
  id: string;
  label: string;
  detail: string;
  correct: AmpelState;
  explanation: string;
}

/** Optionaler, levelspezifischer Lastmanagement-Teil (aktive „Ampel"-Mechanik). */
export interface LoadManagement {
  intro: string;
  situations: AmpelSituation[];
}

/** Eine vollständige Level-Definition, rein datengetrieben. */
export interface LevelDefinition {
  id: string;
  /** Reihenfolge in der Progression (1 = erstes Level). */
  order: number;
  /** Emoji-Kürzel für die Level-Auswahl. */
  icon: string;
  title: string;
  subtitle: string;
  /** Kurzbeschreibung des Lernfokus (für die Level-Auswahl). */
  concept: string;
  /** Rahmenerzählung (Modus B, minimal). */
  narrative: string;
  branches: Branch[];
  palette: PaletteItem[];
  /** Optional: aktives Lastmanagement (nur für Level mit „Ampel"-Mechanik). */
  loadManagement?: LoadManagement;
}

/** Ansichtsmodus für den Dual-View-Toggle. */
export type ViewMode = 'game' | 'schematic';

/** Belegung: welches Palette-Item liegt in welchem Slot. */
export type Placement = Record<string, string | null>;
