// Infofeld: fachliche Erklärung + Anwendungsbeispiel zum gewählten Bauteil.
import { getInfo } from '../content/infotexts';

export function InfoPanel({ infoKey }: { infoKey: string | null }) {
  const info = infoKey ? getInfo(infoKey) : undefined;
  return (
    <div className="panel info">
      <h2 className="panel-title">Fachwissen</h2>
      {info ? (
        <>
          <h4>{info.title}</h4>
          <p>{info.body}</p>
          <div className="example">
            <b>Beispiel · </b>
            {info.example}
          </div>
        </>
      ) : (
        <p className="info-empty">
          Klicke auf ein Bauteil in der Palette oder im Schrank, um die passende
          fachliche Erklärung zu sehen. Bei wiederholten Fehlern öffnet sich das
          richtige Infofeld automatisch.
        </p>
      )}
    </div>
  );
}
