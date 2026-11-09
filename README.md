# Zählerschrank-Planer (Prototyp)

Planungswerkzeug für Auszubildende **Elektroniker:in FR Energie- und
Gebäudetechnik**: Zählerschrank frei aufbauen, Bauteile nach Hersteller aus
einer Bibliothek wählen, beschriften – und den fertigen Aufbau als Bild oder
Link/QR-Code aufs Handy mitnehmen, um ihn real umzusetzen.

## Schnellstart

```bash
npm install
npm run dev        # Dev-Server (http://localhost:5173)
npm test           # Unit-Tests der Belegungslogik
npm run build      # Typecheck + Produktions-Build
```

## Bedienung

- **Schrankvorlage** oben wählen (Zählerfeld, Verteilerfeld, APZ …).
- Bauteil aus der **Bibliothek** in den Schrank **ziehen** – oder anklicken und
  dann auf eine Hutschiene klicken (mehrfach, `Esc` beendet).
- Bauteile rasten im **TE-Raster** (halbe TE) ein; Überlappung und Überlauf
  werden verhindert, belegte Stellen weichen auf die nächste freie Position aus.
- Platzierte Teile verschieben (ziehen oder `←`/`→`). Am gewählten Teil:
  Duplizieren-Knopf darüber, rotes × darunter. Löschen außerdem mit `Entf` oder
  durch Ziehen in die roten Flächen, die beim Ziehen links/rechts erscheinen.
- **BMK** wird automatisch vorgeschlagen (`-F1`, `-K1`, `-X1` …) und ist wie eine
  **Notiz** pro Bauteil editierbar. Eckdaten stehen direkt da, weitere
  Herstellerangaben (Artikel-Nr., Norm, Datenblatt …) hinter dem **i**-Knopf.
- `Strg+Z` / `Strg+Y`: Rückgängig / Wiederholen. Der Stand wird automatisch im
  Browser gespeichert.

## Export

- **Als Bild exportieren:** PNG mit Schrankansicht, BMK, Stückliste und Notizen.
- **Speichern / Öffnen:** Projekt als `.zsplan.json`-Datei.
- **Teilen / QR:** Der gesamte Aufbau steckt komprimiert im Link (`#p=…`), kein
  Server-Speicher. Am Handy funktioniert der Link, sobald die App gehostet ist.

## Daten erweitern

- **Bauteile:** `src/catalog/parts.ts` – Hersteller, Kategorie, Breite in TE,
  Eckdaten (`specs`), Herstellerangaben (`details`, `datasheetUrl`), optional ein Foto (`src/catalog/art.ts`, Gerätebereich in
  Pixeln vermessen). Ohne Foto wird eine generische Gerätegrafik gezeichnet.
  Die enthaltenen Daten sind **Beispieldaten** und mit Datenblättern abzugleichen.
  Generische Testbauteile (ohne Foto) liegen in `src/catalog/generic.ts`.
- **Schränke:** `src/catalog/templates.ts` – Felder mit Zonen (Hutschiene mit
  TE-Anzahl, Zählerplatz, freier Raum). Die aktuellen Vorlagen sind
  Platzhalter; die konkreten Sachsen-Energie-Schränke werden hier ergänzt.

## Projektstruktur

```
src/
  catalog/     parts.ts (Bibliothek), templates.ts (Schränke), art.ts (Fotos)
  domain/      types.ts, geometry.ts (mm-Maße), layout.ts (Belegung) + Tests,
               target.ts (Drop-Ziel), serialize.ts (Link-Format)
  state/       store.ts – Reducer mit Undo/Redo + Autosave
  export/      png.ts, share.ts (Link/QR), file.ts (JSON)
  components/  Toolbar, Library, CabinetCanvas, PartGraphic,
               PropertiesPanel, BillOfMaterials, ShareDialog
```
