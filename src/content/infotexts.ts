// ---------------------------------------------------------------------------
// Nachschlagetexte zu Bauteilarten. Werden im Eigenschaften-Panel angezeigt,
// wenn ein Bauteil mit passendem infoKey ausgewählt ist.
// ---------------------------------------------------------------------------

export interface InfoText {
  title: string;
  body: string;
}

export const INFOTEXTS: Record<string, InfoText> = {
  sls: {
    title: 'SLS – Selektiver Hauptleitungsschutzschalter',
    body:
      'Der SLS sitzt vor dem Zähler im oberen Anschlussraum und schützt die Hauptleitung. ' +
      'Er ist plombiert und liegt in der Verantwortung des Netzbetreibers. Größe und ' +
      'Charakteristik (E) gibt der Netzbetreiber vor.',
  },
  meter: {
    title: 'Zähler & Messeinrichtung',
    body:
      'Der Zähler wird vom Messstellenbetreiber gestellt und auf dem Zählerplatz montiert ' +
      '(3-Punkt-Befestigung oder BKE/eHZ). Bei Erzeugungsanlagen kommt ein ' +
      'Zweirichtungszähler zum Einsatz.',
  },
  uss: {
    title: 'ÜSS – Überspannungsschutz',
    body:
      'Ein Überspannungsschutzgerät leitet transiente Überspannungen (z. B. durch ' +
      'Blitzeinwirkung) gegen Erde ab. Ob er nötig ist, hängt vom Anlagenrisiko ab – ' +
      'insbesondere von Leitungen im Außen- und Dachbereich (z. B. PV-Strings).',
  },
  'rcd-type-choice': {
    title: 'RCD – Typ A oder Typ B',
    body:
      'Typ A und Typ B sind keine Stärkestufen, sondern erkennen unterschiedliche ' +
      'Fehlerstromarten. Gewählt wird nach der Fehlerstromquelle: Wo kein glatter ' +
      'Gleichfehlerstrom entstehen kann, ist Typ A die richtige und wirtschaftliche Wahl.',
  },
  'rcd-type-b': {
    title: 'RCD Typ B',
    body:
      'Typ B erkennt zusätzlich glatte Gleichfehlerströme, wie sie z. B. hinter ' +
      'Wechselrichtern oder in Ladeeinrichtungen entstehen können. Ein Typ A kann ' +
      'durch solche Ströme „erblinden“.',
  },
  'ls-cross-section': {
    title: 'Leitungsschutzschalter & Querschnitt',
    body:
      'Der LS schützt die Leitung vor Überlast und Kurzschluss. Sein Nennstrom muss zum ' +
      'Querschnitt und zur Verlegeart passen. Faustwerte (vereinfacht): 1,5 mm² → 16 A, ' +
      '2,5 mm² → 20/25 A, 6 mm² → 32 A.',
  },
  'ls-characteristic': {
    title: 'Auslösecharakteristik B / C / K',
    body:
      'Die Charakteristik beschreibt, wie schnell der Schalter bei Kurzschluss magnetisch ' +
      'auslöst. B für typische Endstromkreise, C/K für Lasten mit hohen Einschaltströmen ' +
      '(Motoren, Wechselrichter, induktive Lasten).',
  },
  'sg-ready': {
    title: 'Steuerung / SG-Ready',
    body:
      'SG-Ready ist eine Schnittstelle aus zwei potentialfreien Kontakten an der ' +
      'Wärmepumpe. Ein Relais- oder Steuermodul im Schrank schaltet diese Kontakte ' +
      'und gibt so Freigabe, Normalbetrieb oder Sperre vor – den Betrieb regelt die WP selbst.',
  },
};

export function getInfo(infoKey: string): InfoText | undefined {
  return INFOTEXTS[infoKey];
}
