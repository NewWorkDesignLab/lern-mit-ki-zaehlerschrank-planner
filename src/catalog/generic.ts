// ---------------------------------------------------------------------------
// Generische Testbauteile (Hersteller „Generisch“, ohne Foto).
//
// Typische Geräte aus Zähler- und Verteilerschränken, damit sich realistische
// Aufbauten durchspielen lassen. Breiten und Angaben sind übliche Richtwerte,
// keine Herstellerdaten – beim Austausch gegen echte Produkte ersetzen.
// ---------------------------------------------------------------------------

import type { CatalogPart } from '../domain/types';

type Gen = Omit<CatalogPart, 'manufacturer' | 'mount'>;

const gen = (p: Gen): CatalogPart => ({ manufacturer: 'Generisch', mount: 'rail', ...p });

const LS_DETAILS = { Norm: 'DIN EN 60898-1', Bemessungsspannung: '230/400 V AC', Energiebegrenzungsklasse: '3' };
const RCD_DETAILS = { Norm: 'DIN EN 61008-1', Bemessungsspannung: '230/400 V AC' };

export const GENERIC_PARTS: CatalogPart[] = [
  // --- Leitungsschutzschalter ------------------------------------------------
  ...(
    [
      ['B', 10, 1],
      ['B', 20, 1],
      ['C', 16, 1],
      ['B', 20, 3],
      ['B', 32, 3],
      ['C', 32, 3],
    ] as const
  ).map(([char, amps, poles]) =>
    gen({
      id: `gen-ls-${char.toLowerCase()}${amps}-${poles}p`,
      category: 'ls',
      name: `LS-Schalter ${char}${amps} ${poles}-polig`,
      widthTE: poles,
      poles,
      specs: { Charakteristik: char, Nennstrom: `${amps} A`, Pole: String(poles), Schaltvermögen: '6 kA' },
      details: LS_DETAILS,
    }),
  ),
  gen({
    id: 'gen-ls-b16-1pn',
    category: 'ls',
    name: 'LS-Schalter B16 1+N',
    widthTE: 2,
    poles: 2,
    specs: { Charakteristik: 'B', Nennstrom: '16 A', Pole: '1+N', Schaltvermögen: '6 kA' },
    details: LS_DETAILS,
  }),

  // --- RCD / FI-LS -------------------------------------------------------------
  gen({
    id: 'gen-rcd-a-40-2p',
    category: 'rcd',
    name: 'FI-Schutzschalter Typ A 40/0,03 2-polig',
    widthTE: 2,
    poles: 2,
    specs: { Typ: 'A', Nennstrom: '40 A', 'IΔn': '30 mA', Pole: '2' },
    details: RCD_DETAILS,
  }),
  gen({
    id: 'gen-rcd-a-63-4p',
    category: 'rcd',
    name: 'FI-Schutzschalter Typ A 63/0,03 4-polig',
    widthTE: 4,
    poles: 4,
    specs: { Typ: 'A', Nennstrom: '63 A', 'IΔn': '30 mA', Pole: '4' },
    details: RCD_DETAILS,
  }),
  gen({
    id: 'gen-rcd-f-40-4p',
    category: 'rcd',
    name: 'FI-Schutzschalter Typ F 40/0,03 4-polig',
    widthTE: 4,
    poles: 4,
    specs: { Typ: 'F', Nennstrom: '40 A', 'IΔn': '30 mA', Pole: '4' },
    details: RCD_DETAILS,
  }),
  gen({
    id: 'gen-rcbo-b16-a',
    category: 'fi-ls',
    name: 'FI/LS B16 Typ A 30 mA 1+N',
    widthTE: 2,
    poles: 2,
    specs: { Charakteristik: 'B', Nennstrom: '16 A', 'IΔn': '30 mA', Pole: '1+N' },
    details: { Norm: 'DIN EN 61009-1', 'FI-Typ': 'A', Schaltvermögen: '6 kA' },
  }),

  // --- Überspannungsschutz -----------------------------------------------------
  gen({
    id: 'gen-uss-t1t2-3n',
    category: 'uss',
    name: 'Kombiableiter Typ 1+2, 3+N',
    widthTE: 4,
    poles: 4,
    specs: { Typ: 'T1+T2', Pole: '3+N', Iimp: '12,5 kA je Pol' },
    details: { Norm: 'DIN EN 61643-11', Einbauort: 'Vorzählerbereich / Hauptleitungsabzweig' },
  }),

  // --- Schmelzsicherungen -------------------------------------------------------
  gen({
    id: 'gen-neozed-d02-3p',
    category: 'sicherung',
    name: 'NEOZED-Lasttrennschalter D02 3-polig',
    label: 'D02',
    widthTE: 3,
    poles: 3,
    specs: { Baugröße: 'D02', Nennstrom: 'max. 63 A', Pole: '3' },
    details: { Norm: 'DIN VDE 0636-3', Bemessungsspannung: '400 V AC' },
  }),
  gen({
    id: 'gen-neozed-d01-1p',
    category: 'sicherung',
    name: 'NEOZED-Sicherungssockel D01 1-polig',
    label: 'D01',
    widthTE: 1,
    poles: 1,
    specs: { Baugröße: 'D01', Nennstrom: 'max. 16 A', Pole: '1' },
    details: { Norm: 'DIN VDE 0636-3', Bemessungsspannung: '400 V AC' },
  }),

  // --- Steuerung -----------------------------------------------------------------
  gen({
    id: 'gen-zeitschaltuhr',
    category: 'steuerung',
    name: 'Digitale Zeitschaltuhr, 1 Kanal',
    label: 'Uhr',
    widthTE: 2,
    specs: { Kanäle: '1', Kontakt: '1 Wechsler 16 A', Programm: 'Wochenprogramm' },
    details: { Versorgung: '230 V AC', Gangreserve: 'ja' },
  }),
  gen({
    id: 'gen-steuerbox-14a',
    category: 'steuerung',
    name: 'Steuerbox (§ 14a EnWG)',
    label: 'Steuerbox',
    widthTE: 4,
    specs: { Ausgänge: '4 Relais', Einsatz: 'Steuerung steuerbarer Verbraucher' },
    details: { Bereitstellung: 'durch Messstellenbetreiber', Einbauort: 'APZ / Raum für Zusatzanwendungen' },
  }),
  gen({
    id: 'gen-rse',
    category: 'steuerung',
    name: 'Rundsteuerempfänger',
    label: 'RSE',
    widthTE: 4,
    specs: { Ausgänge: '4 Relais', Einsatz: 'Netzbetreiber-Steuerung' },
    details: { Bereitstellung: 'durch Netzbetreiber', Einbauort: 'APZ / Raum für Zusatzanwendungen' },
  }),

  // --- Schalter / Schütze ------------------------------------------------------------
  gen({
    id: 'gen-stromstoss-16',
    category: 'schalter',
    name: 'Stromstoßschalter 16 A, 1 S',
    widthTE: 1,
    poles: 1,
    specs: { Nennstrom: '16 A', Kontakte: '1 Schließer', Spule: '230 V AC' },
    details: { Norm: 'DIN EN 60669-2-2' },
  }),
  gen({
    id: 'gen-treppenlicht',
    category: 'schalter',
    name: 'Treppenlichtzeitschalter',
    label: 'TLZ',
    widthTE: 1,
    poles: 1,
    specs: { Nennstrom: '16 A', Zeit: '0,5–20 min', Anschluss: '3-/4-Leiter' },
    details: { Norm: 'DIN EN 60669-2-3', Versorgung: '230 V AC' },
  }),
  gen({
    id: 'gen-schuetz-40-4s',
    category: 'schalter',
    name: 'Installationsschütz 40 A, 4 S',
    widthTE: 3,
    poles: 4,
    specs: { Nennstrom: '40 A', Kontakte: '4 Schließer', Spule: '230 V AC' },
    details: { Norm: 'DIN EN 61095', Einsatz: 'z. B. Wallbox, Heizstab' },
  }),
  gen({
    id: 'gen-hauptschalter-40',
    category: 'schalter',
    name: 'Lasttrennschalter 40 A 3-polig',
    widthTE: 3,
    poles: 3,
    specs: { Nennstrom: '40 A', Pole: '3' },
    details: { Norm: 'DIN EN 60947-3', Bemessungsspannung: '400 V AC' },
  }),

  // --- Versorgung / Sonstiges ----------------------------------------------------------
  gen({
    id: 'gen-klingeltrafo',
    category: 'sonstiges',
    name: 'Klingeltransformator 8/12 V',
    label: 'Trafo',
    bmkLetter: 'T',
    widthTE: 2,
    specs: { Ausgang: '8 / 12 V AC', Leistung: '8 VA' },
    details: { Norm: 'DIN EN 61558-2-8', Eingang: '230 V AC' },
  }),
  gen({
    id: 'gen-netzteil-24',
    category: 'sonstiges',
    name: 'Hutschienen-Netzteil 24 V DC',
    label: '24 V',
    bmkLetter: 'T',
    widthTE: 2,
    specs: { Ausgang: '24 V DC', Strom: '1,25 A' },
    details: { Eingang: '230 V AC', Leistung: '30 W' },
  }),
  gen({
    id: 'gen-steckdose',
    category: 'sonstiges',
    name: 'Hutschienen-Steckdose Schutzkontakt',
    label: 'SD',
    bmkLetter: 'X',
    widthTE: 2.5,
    poles: 1,
    specs: { Nennstrom: '16 A', Ausführung: 'Schutzkontakt' },
    details: { Norm: 'DIN VDE 0620-1', Bemessungsspannung: '230 V AC' },
  }),
  gen({
    id: 'gen-phasenlampe',
    category: 'sonstiges',
    name: 'Phasenkontrollleuchte L1–L3',
    label: 'L1-3',
    bmkLetter: 'P',
    widthTE: 1,
    specs: { Anzeige: '3 × LED', Spannung: '230/400 V AC' },
  }),
  gen({
    id: 'gen-rj45',
    category: 'sonstiges',
    name: 'RJ45-Hutschienenkupplung (Datenanschluss)',
    label: 'RJ45',
    bmkLetter: 'X',
    widthTE: 1,
    specs: { Kategorie: 'Cat. 6A', Einsatz: 'Datenanschluss Zählerplatz / APZ' },
  }),

  // --- Klemmen ---------------------------------------------------------------------------
  gen({
    id: 'gen-l-klemmen',
    category: 'klemme',
    name: 'Reihenklemmen L (grau), 4 mm²',
    widthTE: 2,
    specs: { Leiter: 'L', Querschnitt: '4 mm²' },
  }),
];
