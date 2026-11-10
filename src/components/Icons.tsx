// ---------------------------------------------------------------------------
// Kleine Strich-Icons für die Kopfzeile (16 px, Farbe = currentColor).
// ---------------------------------------------------------------------------

import type { ReactNode } from 'react';

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="ico"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconUndo = () => (
  <Icon>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </Icon>
);

export const IconRedo = () => (
  <Icon>
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
  </Icon>
);

/** Leeres Blatt mit Plus. */
export const IconNew = () => (
  <Icon>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6" />
    <path d="M12 12v6M9 15h6" />
  </Icon>
);

/** Geöffneter Ordner. */
export const IconOpen = () => (
  <Icon>
    <path d="M3 19V6a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v2" />
    <path d="M3 19l2.6-7.2A2 2 0 0 1 7.5 10.5H21l-2.8 7.7a2 2 0 0 1-1.9 1.3H3z" />
  </Icon>
);

/** Diskette. */
export const IconSave = () => (
  <Icon>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <path d="M17 21v-8H7v8" />
    <path d="M7 3v5h8" />
  </Icon>
);

/** QR-Code. */
export const IconShare = () => (
  <Icon>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3M21 14v.01M14 21h3M21 18v3" />
  </Icon>
);

/** Bild. */
export const IconImage = () => (
  <Icon>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-5-5L5 21" />
  </Icon>
);

/** Mehrfachauswahl: gestrichelter Auswahlrahmen mit zwei Häkchen-Feldern. */
export const IconMultiSelect = () => (
  <Icon>
    <rect x="2.5" y="2.5" width="19" height="19" rx="3" strokeDasharray="3 2.6" />
    <path d="m7 9.5 1.6 1.6L11.5 8" />
    <path d="m12.5 15.5 1.6 1.6 2.9-3.1" />
  </Icon>
);

export const IconMore = () => (
  <Icon>
    <circle cx="5" cy="12" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="19" cy="12" r="1.2" />
  </Icon>
);

export const IconSearch = () => (
  <Icon>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </Icon>
);

export const IconClose = () => (
  <Icon>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const IconPlus = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const IconMinus = () => (
  <Icon>
    <path d="M5 12h14" />
  </Icon>
);

/** Ansicht einpassen: vier Ecken. */
export const IconFit = () => (
  <Icon>
    <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
  </Icon>
);

/** Dock auf- oder zuklappen (Pfeil nach oben, per CSS drehbar). */
export const IconChevronUp = () => (
  <Icon>
    <path d="m6 15 6-6 6 6" />
  </Icon>
);

export const IconList = () => (
  <Icon>
    <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
  </Icon>
);
