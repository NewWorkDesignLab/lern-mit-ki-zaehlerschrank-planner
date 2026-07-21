// ---------------------------------------------------------------------------
// Level-Definition: PV-Schrank (ZS-PV) – rein datengetrieben.
// Abgeleitet aus dem realen Schaltplan / der Komponentenliste (Blatt 4):
//   +ZS2-F1 SLS E35A (locked) · +ZS2-P1 Zähler · +ZS2-J1 Energy Meter
//   +ZS2-E1 ÜSS · +ZS2-F2 LS K20A (WR) · +ZS2-F3 RCD Typ B (WR/WB-Zweig)
//   +ZS2-F4 LS K20A (WB) · +ZS2-F5 RCD Typ A (Kammschiene)
//   +ZS2-F6..F9 LS B16A (Endstromkreise)
//
// Spätere Level (ZS-WP, ZS-WB) sind einfach weitere Dateien dieses Formats.
// ---------------------------------------------------------------------------

import type { LevelDefinition } from '../domain/types';

export const ZS_PV_LEVEL: LevelDefinition = {
  id: 'zs-pv',
  order: 1,
  icon: '☀️',
  title: 'Zählerschrank PV',
  subtitle: 'Prosumer-Anschluss: PV-Erzeuger, Wallbox & Endstromkreise',
  concept: 'Schutztechnik: richtiger RCD-Typ (A/B), Leitungsschutz & Überspannungsschutz',
  narrative:
    'Haus 3 im Quartier wird zum Prosumer: Auf dem Dach liegt eine PV-Anlage, vor der ' +
    'Tür eine Wallbox. Bau den Zählerschrank fachgerecht auf, damit erzeugter Strom ' +
    'sicher ins Netz, ins Auto und zu den Verbrauchern fließt.',

  branches: [
    {
      id: 'einspeisung',
      title: 'Einspeisung & Messung',
      slots: [
        {
          id: 'slot-sls',
          bmk: '+ZS2-F1',
          title: 'SLS (Netzbetreiber)',
          accepts: 'SLS',
          description: 'Selektiver Hauptleitungsschutz E 35 A – plombiert, fest vorgegeben.',
          infoKey: 'sls',
          locked: true,
          prefilledItemId: 'pf-sls',
        },
        {
          id: 'slot-meter',
          bmk: '+ZS2-P1/J1',
          title: 'Zähler & Energy Meter',
          accepts: 'METER',
          description: 'Zweirichtungszähler und Messeinrichtung – fester Bestandteil.',
          infoKey: 'meter',
          locked: true,
          prefilledItemId: 'pf-meter',
        },
        {
          id: 'slot-uss',
          bmk: '+ZS2-E1',
          title: 'Überspannungsschutz',
          accepts: 'USS',
          description:
            'PV-Strings verlaufen über Dach – erhöhtes Risiko. Gehört hier ein ÜSS hin?',
          infoKey: 'uss',
          requiresUssBecauseExternalWiring: true,
        },
      ],
    },
    {
      id: 'erzeuger-wallbox',
      title: 'Erzeuger- & Wallbox-Zweig',
      slots: [
        {
          id: 'slot-ls-wr',
          bmk: '+ZS2-F2',
          title: 'LS Wechselrichter',
          accepts: 'LS',
          description: 'Abgang Wechselrichter, NYM-J 5×2,5 mm². Welcher LS passt?',
          infoKey: 'ls-cross-section',
          loadDemandA: 16,
          conductor: { type: 'NYM-J', crossSectionMm2: 2.5, cores: 5 },
          requiredTripChar: 'K',
        },
        {
          id: 'slot-rcd-wr',
          bmk: '+ZS2-F3',
          title: 'RCD Wechselrichter/Wallbox',
          accepts: 'RCD',
          description:
            'Fehlerstromschutz für den Zweig mit Wechselrichter und Wallbox. Typ A oder B?',
          infoKey: 'rcd-type-b',
          sourceFaultCurrent: 'smooth-DC',
          requiredRcdType: 'B',
        },
        {
          id: 'slot-ls-wb',
          bmk: '+ZS2-F4',
          title: 'LS Wallbox',
          accepts: 'LS',
          description: 'Abgang Wallbox, H07RN-F 5×2,5 mm². Passenden LS wählen.',
          infoKey: 'ls-cross-section',
          loadDemandA: 16,
          conductor: { type: 'H07RN-F', crossSectionMm2: 2.5, cores: 5 },
          requiredTripChar: 'K',
        },
      ],
    },
    {
      id: 'endstromkreise',
      title: 'Endstromkreise (über Kammschiene)',
      slots: [
        {
          id: 'slot-rcd-end',
          bmk: '+ZS2-F5',
          title: 'RCD Endstromkreise',
          accepts: 'RCD',
          description:
            'Fehlerstromschutz vor der Kammschiene für Steckdosen & Abgänge. Typ A oder B?',
          infoKey: 'rcd-type-choice',
          sourceFaultCurrent: 'AC',
          requiredRcdType: 'A',
        },
        {
          id: 'slot-ls-mf',
          bmk: '+ZS2-F6',
          title: 'LS Medienfeld-Steckdose',
          accepts: 'LS',
          description: 'Steckdosenstromkreis, H07V2-K 1,5 mm². Welcher LS?',
          infoKey: 'ls-cross-section',
          loadDemandA: 12,
          conductor: { type: 'H07V2-K', crossSectionMm2: 1.5 },
          requiredTripChar: 'B',
        },
        {
          id: 'slot-ls-ab1',
          bmk: '+ZS2-F7',
          title: 'LS Abgang',
          accepts: 'LS',
          description: 'Abgang NYM-J 3×2,5 mm². Passenden LS wählen.',
          infoKey: 'ls-cross-section',
          loadDemandA: 14,
          conductor: { type: 'NYM-J', crossSectionMm2: 2.5, cores: 3 },
          requiredTripChar: 'B',
        },
      ],
    },
  ],

  palette: [
    // Vorgesteckte, gesperrte Bauteile (erscheinen nicht als ziehbar).
    { id: 'pf-sls', kind: 'SLS', label: 'SLS E 35 A', ratingA: 35, tripChar: 'E', infoKey: 'sls' },
    { id: 'pf-meter', kind: 'METER', label: 'Zähler + Energy Meter', infoKey: 'meter' },

    // Ziehbare Bauteile (inkl. bewusst falscher Alternativen).
    { id: 'uss', kind: 'USS', label: 'Überspannungsschutz', infoKey: 'uss' },

    { id: 'rcd-a', kind: 'RCD', label: 'RCD Typ A · 30 mA', rcdType: 'A', ratedResidualMa: 30, infoKey: 'rcd-type-choice' },
    { id: 'rcd-b', kind: 'RCD', label: 'RCD Typ B · 30 mA', rcdType: 'B', ratedResidualMa: 30, infoKey: 'rcd-type-b' },

    { id: 'ls-b16', kind: 'LS', label: 'LS B 16 A', ratingA: 16, tripChar: 'B', infoKey: 'ls-cross-section' },
    { id: 'ls-b25', kind: 'LS', label: 'LS B 25 A', ratingA: 25, tripChar: 'B', infoKey: 'ls-cross-section' },
    { id: 'ls-k20', kind: 'LS', label: 'LS K 20 A', ratingA: 20, tripChar: 'K', infoKey: 'ls-characteristic' },
  ],
};
