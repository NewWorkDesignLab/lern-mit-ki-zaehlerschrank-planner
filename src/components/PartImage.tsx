// ---------------------------------------------------------------------------
// PartImage: zeichnet ein Bauteilfoto so, dass der freigestellte Gerätebereich
// eine vorgegebene Höhe einnimmt und exakt mittig im Wrapper sitzt.
//
// Der Trick steckt in den Prozentwerten: `height` bezieht sich auf den Wrapper,
// `translate(...)` dagegen auf das Bild selbst. Damit landet die Mitte des
// Inhalts-Rechtecks auf der Wrapper-Mitte – unabhängig davon, wie viel
// transparenter Rand im PNG steckt.
//
// Im Schrank wird bewusst NUR nach Höhe skaliert: dann haben alle Geräte
// dieselbe Bauhöhe und ihre Breite ergibt sich aus dem echten Seitenverhältnis
// (1-poliger LS schmal, Relais breit) – wie auf einer realen Hutschiene.
// Für kleine Kästchen (Paletten-Chips) begrenzt `boxAspect` die Breite.
// ---------------------------------------------------------------------------

import type { CSSProperties } from 'react';
import type { PartArt } from '../domain/types';

interface Props {
  art: PartArt;
  label: string;
  /** Anteil der Wrapper-Höhe, den das Gerät einnehmen soll (0..1). */
  fill?: number;
  /** Seitenverhältnis des Wrappers. Gesetzt = Gerät passt garantiert hinein. */
  boxAspect?: number;
  className?: string;
}

export function PartImage({ art, label, fill = 0.94, boxAspect, className }: Props) {
  const { content } = art;

  // Ohne boxAspect darf das Gerät seitlich überstehen (Schrank-Ansicht).
  const height =
    boxAspect !== undefined && art.aspect > boxAspect ? fill * (boxAspect / art.aspect) : fill;

  const style: CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    height: `${(height * 100) / content.h}%`,
    width: 'auto',
    maxWidth: 'none',
    transform: `translate(${-(content.x + content.w / 2) * 100}%, ${
      -(content.y + content.h / 2) * 100
    }%)`,
    pointerEvents: 'none',
  };

  return <img className={className} src={art.src} alt={label} style={style} draggable={false} />;
}
