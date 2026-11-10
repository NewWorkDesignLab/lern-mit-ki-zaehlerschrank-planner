// ---------------------------------------------------------------------------
// Steuerung (nur Desktop): Maus- und Tastenkürzel als Übersicht.
// Öffnet über den Knopf unter der Bauteilliste oder mit der Taste "?".
// ---------------------------------------------------------------------------

import { Fragment, useEffect } from 'react';
import type { ReactNode } from 'react';

const MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const MOD = MAC ? '⌘' : 'Strg';

/** Tastenkombination: k('Strg', 'Z') -> <kbd>Strg</kbd> + <kbd>Z</kbd>. */
const k = (...keys: string[]) => (
  <>
    {keys.map((key, i) => (
      <Fragment key={i}>
        {i > 0 && ' + '}
        <kbd>{key}</kbd>
      </Fragment>
    ))}
  </>
);

type Group = { title: string; rows: [ReactNode, string][] };

const GROUPS: Group[] = [
  {
    title: 'Platzieren',
    rows: [
      ['Bauteil aus der Liste ziehen (Drag & Drop)', 'Platzieren'],
      ['Bauteil anklicken, dann Klick in den Schrank', 'Mehrfach platzieren'],
      [<>{k('Shift')} + Klick</>, 'Einmal platzieren und beenden'],
      [<>Rechtsklick / {k('Esc')}</>, 'Platzieren beenden'],
    ],
  },
  {
    title: 'Bewegen',
    rows: [
      ['Bauteil ziehen', 'Verschieben'],
      [<>{k('←')} / {k('→')}</>, 'Um ½ TE verschieben'],
    ],
  },
  {
    title: 'Auswählen',
    rows: [
      ['Klick', 'Bauteil auswählen'],
      ['Klick + Ziehen auf leerer Fläche', 'Auswahlpinsel'],
      [<>Rechtsklick / {k('Esc')}</>, 'Auswahl aufheben'],
      [<>{k(MOD)} + Klick</>, 'Hinzufügen / abwählen'],
      [<>{k('Shift')} + Klick</>, 'Bereich auswählen'],
      [<>{k(MOD, 'Shift')} + Klick</>, 'Bereich hinzufügen'],
      [k(MOD, 'A'), 'Alles auswählen'],
    ],
  },
  {
    title: 'Löschen',
    rows: [
      [<>{k('Entf')} / {k('⌫')}</>, 'Auswahl löschen'],
      ['Rotes × am Bauteil', 'Löschen'],
      ['Bauteil in rote Fläche ziehen', 'Löschen'],
    ],
  },
  {
    title: 'Verlauf',
    rows: [
      [k(MOD, 'Z'), 'Rückgängig'],
      [<>{k(MOD, 'Y')} / {k(MOD, 'Shift', 'Z')}</>, 'Wiederholen'],
    ],
  },
];

/** Zwei etwa gleich hohe Spalten: links Platzieren, Bewegen, Löschen – rechts Auswählen, Verlauf. */
const [PLACE, MOVE, SELECT, DELETE, HISTORY] = GROUPS;
const COLUMNS = [
  [PLACE, MOVE, DELETE],
  [SELECT, HISTORY],
];

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog shortcuts" role="dialog" aria-label="Steuerung" onClick={(e) => e.stopPropagation()}>
        <h2>Steuerung</h2>
        <p className="muted">Maus- und Tastenkürzel für den Schrank-Editor.</p>
        <div className="shortcuts-cols">
          {COLUMNS.map((groups, c) => (
            <div key={c} className="shortcuts-col">
              {groups.map((g) => (
                <section key={g.title} className="shortcuts-group">
                  <h3>{g.title}</h3>
                  <dl>
                    {g.rows.map(([keys, label], i) => (
                      <div key={i} className="shortcuts-row">
                        <dt>{keys}</dt>
                        <dd>{label}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          ))}
        </div>
        <div className="dialog-actions">
          <button className="btn primary" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
