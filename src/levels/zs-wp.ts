// ---------------------------------------------------------------------------
// Level-Definition: Wärmepumpen-Schrank (ZS-WP) – rein datengetrieben.
// Abgeleitet aus dem realen Schaltplan / der Komponentenliste (Blatt 4):
//   +ZS2-F1 SLS E35A (locked) · +ZS2-P1 Zähler · +ZS2-J1 Energy Meter
//   +ZS2-F2 RCD Typ A 32A/30mA · +ZS2-F3 LS B16 Außengerät WP
//   +ZS2-Q1 Schalter/Schütz (SG-Ready-Kontakt) · +ZS2-X3 Speicherheizung
//   +ZS2-F4 LS B16 Medienfeld · +ZS2-F5 LS B16 2. Außengerät
//
// NEUER LERNASPEKT gegenüber Level 1: AKTIVES Lastmanagement (SG-Ready) als
// „Ampel" – im Kontrast zum passiven Schutz. Der WP-Zweig muss über ein
// schaltbares Steuerelement (Schütz) laufen, damit das Lastmanagement die
// Wärmepumpe je nach PV-Überschuss / Netzsignal freigeben oder sperren kann.
// ---------------------------------------------------------------------------

import type { LevelDefinition } from '../domain/types';

export const ZS_WP_LEVEL: LevelDefinition = {
  id: 'zs-wp',
  order: 2,
  icon: '🔥',
  title: 'Zählerschrank Wärmepumpe',
  subtitle: 'Wärmepumpe smart einbinden: Schutz + aktives Lastmanagement',
  concept: 'Lastmanagement: SG-Ready als „Ampel" – aktive Steuerung statt passivem Schutz',
  narrative:
    'Haus 3 bekommt eine Wärmepumpe. Sie ist ein großer, steuerbarer Verbraucher: ' +
    'Läuft sie mittags mit PV-Überschuss, ist das ideal – in der Abendspitze mit ' +
    'ladendem Auto würde sie den Hausanschluss überlasten. Baue den Schrank fachgerecht ' +
    'auf und richte das SG-Ready-Lastmanagement als „Ampel" richtig ein.',

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
          description:
            'Der Zähler misst; das Energy Meter liefert dem Lastmanagement die Messwerte.',
          infoKey: 'energy-meter',
          locked: true,
          prefilledItemId: 'pf-meter',
        },
        {
          id: 'slot-rcd',
          bmk: '+ZS2-F2',
          title: 'RCD Wärmepumpen-Zweig',
          accepts: 'RCD',
          description:
            'Fehlerstromschutz für die WP-Stromkreise, H07V-K 10 mm². Welcher Typ?',
          infoKey: 'rcd-type-choice',
          sourceFaultCurrent: 'pulsating-DC',
          requiredRcdType: 'A',
        },
      ],
    },
    {
      id: 'waermepumpe',
      title: 'Wärmepumpe: Schutz & Steuerung',
      slots: [
        {
          id: 'slot-ls-wp',
          bmk: '+ZS2-F3',
          title: 'LS Außengerät (Schutz)',
          accepts: 'LS',
          description: 'Leitungsschutz für das WP-Außengerät, H07V-K 1,5 mm².',
          infoKey: 'ls-cross-section',
          loadDemandA: 13,
          conductor: { type: 'H07V-K', crossSectionMm2: 1.5 },
          requiredTripChar: 'B',
        },
        {
          id: 'slot-sg-ready',
          bmk: '+ZS2-Q1',
          title: 'SG-Ready-Steuerung („Ampel")',
          accepts: 'CONTACTOR',
          description:
            'Über dieses Element gibt das Lastmanagement die WP frei oder sperrt sie. ' +
            'Feste Verdrahtung wäre hier falsch.',
          infoKey: 'sg-ready',
        },
        {
          id: 'slot-ls-speicher',
          bmk: '+ZS2-X3',
          title: 'LS Speicherheizung',
          accepts: 'LS',
          description: 'Leitungsschutz für die Speicher-/Zusatzheizung, H07V-K 1,5 mm².',
          infoKey: 'speicherheizung',
          loadDemandA: 13,
          conductor: { type: 'H07V-K', crossSectionMm2: 1.5 },
          requiredTripChar: 'B',
        },
      ],
    },
    {
      id: 'endstromkreise',
      title: 'Weitere Endstromkreise',
      slots: [
        {
          id: 'slot-ls-mf',
          bmk: '+ZS2-F4',
          title: 'LS Medienfeld-Steckdose',
          accepts: 'LS',
          description: 'Steckdosenstromkreis, NYM 4×1,5 mm². Welcher LS?',
          infoKey: 'ls-cross-section',
          loadDemandA: 12,
          conductor: { type: 'NYM-J', crossSectionMm2: 1.5, cores: 4 },
          requiredTripChar: 'B',
        },
        {
          id: 'slot-ls-aussen2',
          bmk: '+ZS2-F5',
          title: 'LS 2. Außengerät',
          accepts: 'LS',
          description: 'Zweiter Außengeräte-Abgang, H07RN-F 5×1,5 mm².',
          infoKey: 'ls-cross-section',
          loadDemandA: 13,
          conductor: { type: 'H07RN-F', crossSectionMm2: 1.5, cores: 5 },
          requiredTripChar: 'B',
        },
      ],
    },
  ],

  palette: [
    { id: 'pf-sls', kind: 'SLS', label: 'SLS E 35 A', ratingA: 35, tripChar: 'E', infoKey: 'sls' },
    { id: 'pf-meter', kind: 'METER', label: 'Zähler + Energy Meter', infoKey: 'energy-meter' },

    // Das neue Steuerelement fürs Lastmanagement.
    { id: 'sg-schuetz', kind: 'CONTACTOR', label: 'SG-Ready-Schütz', infoKey: 'sg-ready' },

    { id: 'rcd-a', kind: 'RCD', label: 'RCD Typ A · 30 mA', rcdType: 'A', ratedResidualMa: 30, infoKey: 'rcd-type-choice' },
    { id: 'rcd-b', kind: 'RCD', label: 'RCD Typ B · 30 mA', rcdType: 'B', ratedResidualMa: 30, infoKey: 'rcd-type-b' },

    { id: 'ls-b16', kind: 'LS', label: 'LS B 16 A', ratingA: 16, tripChar: 'B', infoKey: 'ls-cross-section' },
    { id: 'ls-b25', kind: 'LS', label: 'LS B 25 A', ratingA: 25, tripChar: 'B', infoKey: 'ls-cross-section' },
    { id: 'ls-k20', kind: 'LS', label: 'LS K 20 A', ratingA: 20, tripChar: 'K', infoKey: 'ls-characteristic' },
  ],

  loadManagement: {
    intro:
      'Das SG-Ready-Schütz ist die „Ampel" der Wärmepumpe. Entscheide je Situation, ob ' +
      'die WP freigegeben (grün), normal betrieben (gelb) oder gesperrt/gedrosselt (rot) ' +
      'werden soll. Anders als ein Schutzschalter greift die Ampel aktiv im Normalbetrieb.',
    situations: [
      {
        id: 'sit-pv',
        label: 'Sonniger Mittag, PV-Überschuss',
        detail: 'Die PV-Anlage liefert mehr, als das Haus gerade braucht.',
        correct: 'FREIGABE',
        explanation:
          'Freigabe (grün): Jetzt soll die WP laufen und den günstigen PV-Überschuss ' +
          'nutzen – idealerweise lädt sie den Wärmespeicher vor.',
      },
      {
        id: 'sit-peak',
        label: 'Abendspitze, Auto lädt an der Wallbox',
        detail: 'Hoher Hausverbrauch, der Netzanschluss ist nahe an seiner Grenze.',
        correct: 'SPERRE',
        explanation:
          'Sperre/Drosselung (rot): Um den Hausanschluss nicht zu überlasten, nimmt das ' +
          'Lastmanagement die WP jetzt zurück – der Wärmespeicher überbrückt die Spitze.',
      },
      {
        id: 'sit-grid',
        label: 'EVU-Steuersignal (§14a-Netzsteuerung)',
        detail: 'Der Netzbetreiber sendet ein Signal zur temporären Leistungsreduzierung.',
        correct: 'SPERRE',
        explanation:
          'Sperre (rot): Das Netzbetreiber-Signal hat Vorrang – die steuerbare ' +
          'Verbrauchseinrichtung wird wie vorgeschrieben reduziert.',
      },
      {
        id: 'sit-normal',
        label: 'Bewölkter Vormittag, normaler Verbrauch',
        detail: 'Kein PV-Überschuss, aber auch keine Netz-/Lastspitze.',
        correct: 'NORMAL',
        explanation:
          'Normalbetrieb (gelb): Kein Grund für Freigabe-Anreiz oder Sperre – die WP ' +
          'heizt nach ihrem üblichen Bedarf.',
      },
    ],
  },
};
