// ---------------------------------------------------------------------------
// Teilen-Dialog: Link (Projekt steckt komplett im URL-Hash) + QR-Code.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { Project } from '../domain/types';
import { projectLink } from '../export/share';

/** Byte-Kapazität eines QR-Codes (Version 40, Fehlerkorrektur L). */
const QR_MAX = 2953;

export function ShareDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const [link, setLink] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const l = await projectLink(project);
        if (!alive) return;
        setLink(l);
        if (l.length <= QR_MAX) {
          const data = await QRCode.toDataURL(l, { errorCorrectionLevel: 'L', margin: 2, width: 320 });
          if (alive) setQr(data);
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [project]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const host = window.location.hostname;
  const local = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog" role="dialog" aria-label="Projekt teilen" onClick={(e) => e.stopPropagation()}>
        <h2>Projekt teilen</h2>
        <p className="muted">
          Der komplette Schrankaufbau steckt im Link – kein Konto, kein Server-Speicher. Den QR-Code mit dem
          Handy scannen, um den Aufbau dort zu öffnen.
        </p>

        {local && (
          <p className="notice">
            Die App läuft gerade lokal (<code>{host}</code>). Am Handy funktioniert der Link erst, wenn die App
            gehostet ist. Bis dahin: <b>Als Bild exportieren</b> und das PNG aufs Handy übertragen.
          </p>
        )}

        {error && <p className="notice err">{error}</p>}

        {qr ? (
          <img className="qr" src={qr} alt="QR-Code mit Link zum Projekt" />
        ) : (
          link && <p className="notice">Der Aufbau ist zu groß für einen QR-Code – bitte den Link verwenden.</p>
        )}

        {link && (
          <div className="share-link">
            <input readOnly value={link} onFocus={(e) => e.target.select()} />
            <button
              className="btn"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? 'Kopiert ✓' : 'Kopieren'}
            </button>
          </div>
        )}

        <div className="dialog-actions">
          <button className="btn primary" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
