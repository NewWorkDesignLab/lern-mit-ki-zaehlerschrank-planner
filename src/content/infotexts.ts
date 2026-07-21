// ---------------------------------------------------------------------------
// Fachliche Infotexte pro Bauteil / Konzept.
// Zentrale, fest hinterlegte Inhalte (keine LLM-Generierung).
// Diese Texte setzen die "fachlichen Leitplanken" aus dem Scope um.
// ---------------------------------------------------------------------------

export interface InfoText {
  title: string;
  body: string;
  /** Konkretes Anwendungsbeispiel. */
  example: string;
}

export const INFOTEXTS: Record<string, InfoText> = {
  sls: {
    title: 'SLS – Selektiver Hauptleitungsschutzschalter',
    body:
      'Der SLS sitzt vor dem Zähler und schützt die Hauptleitung. Er ist plombiert und ' +
      'liegt in der Verantwortung des Netzbetreibers – als Elektroniker:in wählst oder ' +
      'tauschst du ihn nicht selbst aus. Im Schrank ist er fest vorgegeben.',
    example:
      'Hier im PV-Schrank: +ZS2-F1, ein E 35 A (3-polig). Er ist gesperrt dargestellt – ' +
      'deine Zuständigkeit beginnt erst dahinter.',
  },

  meter: {
    title: 'Zähler & Messeinrichtung',
    body:
      'Der EVU-Zähler erfasst die bezogene (und bei PV die eingespeiste) Energie. ' +
      'Die moderne Messeinrichtung / das Energy Meter liefert zusätzlich Messwerte ' +
      'für Steuerung und Monitoring. Beide sind fester Bestandteil des Zählerfelds.',
    example: 'Hier: +ZS2-P1 (Zweirichtungszähler) und +ZS2-J1 (Energy Meter).',
  },

  uss: {
    title: 'ÜSS – Überspannungsschutz',
    body:
      'Ein Überspannungsschutzgerät leitet transiente Überspannungen (z. B. durch ' +
      'Blitzeinwirkung) gegen Erde ab. Ob er nötig ist, hängt vom Anlagenrisiko ab – ' +
      'insbesondere von Leitungen im Außen- und Dachbereich. Es ist KEINE reine ' +
      '„PV-Regel“: PV macht ihn hier nur besonders relevant, weil die Strings über Dach geführt werden.',
    example:
      'Hier: +ZS2-E1, direkt hinter der Messung. Ohne ihn steht die empfindliche ' +
      'Elektronik (Wechselrichter, Energy Meter) bei Überspannung ungeschützt da.',
  },

  'rcd-type-choice': {
    title: 'RCD – Typ A oder Typ B wählen',
    body:
      'Typ A und Typ B sind KEINE Stärkestufen. Sie erkennen unterschiedliche ' +
      'Fehlerstromarten. Du wählst nach der Fehlerstromquelle, nicht nach dem Motto ' +
      '„Typ B ist sicherer“. Wo kein glatter Gleichfehlerstrom entstehen kann, ist ' +
      'Typ A die richtige und wirtschaftliche Wahl.',
    example:
      'Endstromkreise hinter der Kammschiene (+ZS2-F5): hier reicht Typ A. ' +
      'Am Wechselrichter-/Wallbox-Zweig dagegen braucht es Typ B.',
  },

  'rcd-type-b': {
    title: 'RCD Typ B – warum hinter dem Wechselrichter?',
    body:
      'Typ A erkennt Wechsel- und pulsierende Gleichfehlerströme. Ein Wechselrichter ' +
      'kann im Fehlerfall aber GLATTE Gleichfehlerströme erzeugen – die „übersieht“ ein ' +
      'Typ A, er kann sogar blockieren. Typ B erkennt zusätzlich diese glatten ' +
      'Gleichfehlerströme und schützt daher zuverlässig.',
    example:
      'Hier: +ZS2-F3 am Abgang Wechselrichter/Wallbox. Deshalb Typ B, 32 A / 30 mA.',
  },

  'ls-cross-section': {
    title: 'Leitungsschutzschalter & Leitungsquerschnitt',
    body:
      'Der LS schützt die Leitung vor Überlast. Sein Nennstrom muss zum Querschnitt ' +
      'passen: zu groß gewählt, überhitzt die Leitung, bevor er auslöst; zu klein ' +
      'gewählt, löst er schon im Normalbetrieb aus. Faustwerte (vereinfacht): ' +
      '1,5 mm² → bis 16 A, 2,5 mm² → bis 20/25 A, 6 mm² → bis 32 A.',
    example:
      'Endstromkreis mit 1,5 mm² (+ZS2-F6): B 16 A. Wallbox-/WR-Zweig mit 2,5 mm²: K 20 A.',
  },

  'ls-characteristic': {
    title: 'Auslösecharakteristik B / K / E',
    body:
      'Die Charakteristik beschreibt, wie schnell der LS bei Kurzschluss magnetisch ' +
      'auslöst. B löst früh aus (typische Endstromkreise), K/C erlauben höhere ' +
      'Einschaltströme (Motoren, Wechselrichter, induktive Lasten). Es geht NICHT um ' +
      '„stärker“, sondern um das Einschaltverhalten der Last.',
    example: 'Endstromkreise: B 16 A. Wechselrichter-/Wallbox-Abgang: K 20 A.',
  },

  kammschiene: {
    title: 'Kammschiene (Sammelschiene)',
    body:
      'Die Kammschiene verteilt eine Phase (oder mehrere) sauber auf mehrere ' +
      'nebeneinander liegende LS. Sie spart Einzelverdrahtung und sorgt für einen ' +
      'übersichtlichen, normgerechten Aufbau der Endstromkreise.',
    example: 'Hier speist +ZS2-F5 (RCD Typ A) über die Kammschiene die LS +ZS2-F6…F9.',
  },

  'fault-trip': {
    title: 'Warum „rot“ nicht sofort echt ist',
    body:
      'Zur Veranschaulichung färbt sich eine überlastete Leitung hier sofort rot. In ' +
      'Wirklichkeit folgt ein LS einer Zeit-Strom-Kennlinie: bei leichter Überlast löst ' +
      'er thermisch verzögert aus, bei Kurzschluss magnetisch sehr schnell. Das ' +
      'Sofort-Feedback ist also eine bewusste Vereinfachung dieses Trainers.',
    example: 'Ein 16-A-LS trägt kurzfristig mehr als 16 A – er löst nicht in derselben Sekunde aus.',
  },

  'sg-ready': {
    title: 'SG-Ready-Schütz – die „Ampel" der Wärmepumpe',
    body:
      'SG-Ready („Smart Grid Ready") ist eine Schnittstelle, über die das ' +
      'Lastmanagement die Wärmepumpe aktiv steuert – anders als ein Schutzschalter, ' +
      'der nur im Fehlerfall auslöst. Über ein Schütz (schaltbarer Leistungskontakt) ' +
      'wird die WP freigegeben, normal betrieben oder gesperrt/gedrosselt. Eine feste ' +
      'Verdrahtung ohne Schütz kann das Lastmanagement nicht steuern.',
    example:
      'Hier: +ZS2-Q1. Bei PV-Überschuss → Freigabe (grün); in der Abendspitze oder bei ' +
      'EVU-Sperrsignal → Sperre (rot), damit der Hausanschluss nicht überlastet wird.',
  },

  'energy-meter': {
    title: 'Zähler & Energy Meter (fürs Lastmanagement)',
    body:
      'Der Zähler erfasst die Energie; das Energy Meter misst zusätzlich den aktuellen ' +
      'Leistungsfluss am Hausanschluss. Diese Messwerte braucht das Lastmanagement, um ' +
      'zu entscheiden, wann die „Ampel" der Wärmepumpe auf Freigabe oder Sperre geht.',
    example: 'Hier: +ZS2-P1 (Zähler) und +ZS2-J1 (Energy Meter) – fest im Zählerfeld.',
  },

  speicherheizung: {
    title: 'Speicher-/Zusatzheizung',
    body:
      'Die Speicherheizung lädt einen Wärmespeicher. Genau er macht das Lastmanagement ' +
      'möglich: Wird die WP bei PV-Überschuss freigegeben, „lädt" sie Wärme vor, die die ' +
      'Abendspitze überbrückt, wenn die Ampel auf Sperre steht.',
    example: 'Hier: +ZS2-X3, abgesichert mit einem eigenen Leitungsschutzschalter.',
  },

  load: {
    title: 'Verbraucher / Abgang',
    body:
      'Das Ziel jedes Stromkreises: Wallbox, Steckdosen (Medienfeld), Beleuchtung oder ' +
      'andere Abgänge. Jeder Verbraucher stellt Anforderungen an Querschnitt, LS und ' +
      'RCD des zuführenden Stromkreises.',
    example: 'Hier u. a. Abgang Wallbox, Medienfeld-Steckdose (+ZS2-X2) und weitere Abgänge.',
  },
};

export function getInfo(infoKey: string): InfoText | undefined {
  return INFOTEXTS[infoKey];
}
