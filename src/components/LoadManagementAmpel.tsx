// ---------------------------------------------------------------------------
// Interaktive „Ampel"-Mechanik (nur Level 2 / Lastmanagement).
// Der Azubi entscheidet je Situation, ob die Wärmepumpe freigegeben (grün),
// normal (gelb) oder gesperrt (rot) werden soll. Aktive Steuerung – der neue
// Lernaspekt gegenüber dem passiven Schutz aus Level 1.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import type { AmpelState, LoadManagement } from '../domain/types';

const OPTIONS: { state: AmpelState; label: string; cls: string }[] = [
  { state: 'FREIGABE', label: 'Freigabe', cls: 'gruen' },
  { state: 'NORMAL', label: 'Normalbetrieb', cls: 'gelb' },
  { state: 'SPERRE', label: 'Sperre', cls: 'rot' },
];

interface Props {
  data: LoadManagement;
  /** Vorbedingung: erst wenn der Schrank korrekt verdrahtet ist, ist die Ampel aktiv. */
  enabled: boolean;
  onSolvedChange: (solved: boolean) => void;
}

export function LoadManagementAmpel({ data, enabled, onSolvedChange }: Props) {
  const [answers, setAnswers] = useState<Record<string, AmpelState>>({});

  const allCorrect =
    data.situations.length > 0 &&
    data.situations.every((s) => answers[s.id] === s.correct);

  useEffect(() => {
    onSolvedChange(allCorrect);
  }, [allCorrect, onSolvedChange]);

  // Moment des Freischaltens hervorheben: der Wechsel gesperrt -> scharf soll
  // sichtbar sein, auch wenn man erst danach herunterscrollt.
  const [justUnlocked, setJustUnlocked] = useState(false);
  const wasEnabled = useRef(enabled);
  useEffect(() => {
    const unlockedNow = enabled && !wasEnabled.current;
    wasEnabled.current = enabled;
    if (!unlockedNow) return;
    setJustUnlocked(true);
    const timer = setTimeout(() => setJustUnlocked(false), 2600);
    return () => clearTimeout(timer);
  }, [enabled]);

  return (
    <section
      className={`panel lm ${enabled ? '' : 'lm-disabled'} ${justUnlocked ? 'lm-unlocking' : ''}`}
    >
      <div className="lm-head">
        <span className="lm-badge">🚦</span>
        <div>
          <h3>SG-Ready-Lastmanagement</h3>
          <p>{data.intro}</p>
        </div>
      </div>

      {!enabled && (
        <p className="lm-lock">
          🔒 Baue und verdrahte den Schaltschrank zuerst fachgerecht. Danach kannst du
          ausprobieren, wie die SG-Ready-Ampel auf verschiedene Netzsituationen reagiert.
        </p>
      )}

      {enabled && !allCorrect && (
        <p className="lm-live">
          🔓 Der Schrank steht – die Ampel ist scharf. Jetzt entscheidest du je Situation,
          ob die Wärmepumpe laufen darf.
        </p>
      )}

      <div className="lm-grid">
        {data.situations.map((sit) => {
          const chosen = answers[sit.id];
          const correct = chosen === sit.correct;
          const answered = chosen !== undefined;
          return (
            <div
              key={sit.id}
              className={`lm-card ${answered ? (correct ? 'ok' : 'err') : ''}`}
            >
              <div className="lm-card-head">
                <b>{sit.label}</b>
                <span>{sit.detail}</span>
              </div>

              <div className="lm-options">
                {OPTIONS.map((o) => (
                  <button
                    key={o.state}
                    className={`lm-opt ${o.cls} ${chosen === o.state ? 'active' : ''}`}
                    disabled={!enabled}
                    onClick={() =>
                      setAnswers((a) => ({ ...a, [sit.id]: o.state }))
                    }
                  >
                    <span className="lm-dot" />
                    {o.label}
                  </button>
                ))}
              </div>

              {answered && (
                <p className={`lm-feedback ${correct ? 'ok' : 'err'}`}>
                  {correct ? '✓ ' : '✗ '}
                  {correct ? sit.explanation : 'Noch nicht richtig – denk an PV-Überschuss, Hausanschluss-Grenze und Netzsignal.'}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
