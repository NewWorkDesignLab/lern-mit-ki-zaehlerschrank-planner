// ---------------------------------------------------------------------------
// ScrollCue: schwebender Hinweis, dass weiter unten noch eine Aufgabe wartet.
//
// Elegant heißt hier vor allem: verschwindet von selbst. Sobald das Ziel im
// Blickfeld ist, hat der Hinweis seinen Job erledigt und blendet sich aus –
// statt dauerhaft am Rand zu kleben.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import type { ReactNode, RefObject } from 'react';

interface Props {
  /** Abschnitt, auf den der Hinweis zeigt. */
  targetRef: RefObject<HTMLElement>;
  /** Nur einblenden, solange die Aufgabe dort offen ist. */
  active: boolean;
  children: ReactNode;
}

export function ScrollCue({ targetRef, active, children }: Props) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = targetRef.current;
    if (!el || !active) return;
    // rootMargin schneidet das untere Drittel weg: der Hinweis bleibt, solange
    // das Ziel nur am unteren Rand hereinlugt, und geht erst, wenn man wirklich
    // dort ist. Funktioniert auch, wenn der Abschnitt höher als der Viewport ist.
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '0px 0px -30% 0px',
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [targetRef, active]);

  if (!active || inView) return null;

  return (
    <button
      className="scroll-cue"
      onClick={() => targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
      title="Zum Lastmanagement springen"
    >
      <span className="scroll-cue-text">{children}</span>
      <span className="scroll-cue-arrow">↓</span>
    </button>
  );
}
