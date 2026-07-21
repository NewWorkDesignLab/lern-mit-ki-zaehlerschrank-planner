# Lern mit KI · Zählerschrank-Trainer (Prototyp)

Spielerischer Trainer für Auszubildende **Elektroniker:in FR Energie- und
Gebäudetechnik** (1./2. Lehrjahr). Der Prototyp macht den Aufbau eines
Zählerschranks für Erzeugeranlagen (PV, Wallbox) interaktiv erfahrbar –
fachlich korrekt nach realer Vorlage (EBZ Dresden, **ZS-PV**).

## Schnellstart

```bash
npm install
npm run dev        # Dev-Server (http://localhost:5173)
npm test           # Unit-Tests der Regel-/Hinweis-Engine
npm run build      # Typecheck + Produktions-Build
```

## Kernideen

- **Ein Datenmodell, zwei Ansichten:** Spiel- und Fachansicht werden aus
  demselben State gerendert (Toggle oben rechts). Keine zwei Wahrheiten.
- **Fachlich korrekt:** echte Bauteile, Werte, Kabeltypen und BMK (`+ZS2-F3` …).
  Das Kernpuzzle: **RCD Typ B** am Wechselrichter-/Wallbox-Zweig (glatte
  Gleichfehlerströme), **Typ A** an den Endstromkreisen.
- **Adaptiver Hinweis-Mechanismus (ohne LLM):** wiederholte Fehler eskalieren in
  drei Stufen – Markierung → Erklärtext → automatisch geöffnetes Infofeld.
- **Fachliche Leitplanken** aus dem Konzept sind umgesetzt: SLS ist plombiert
  (nicht wählbar), ÜSS hängt am Anlagenrisiko (nicht „PV-exklusiv"), Typ A/B ist
  Erkennungsmuster statt Stärke-Ranking, Sofort-„rot" ist als Vereinfachung
  gegenüber der realen Zeit-Strom-Kennlinie gekennzeichnet.

## Bedienung

Bauteil in der Palette **anklicken** (auswählen), dann den **Steckplatz**
anklicken – oder per **Drag & Drop** ziehen. Klick auf das `i` an jedem Slot
öffnet die fachliche Erklärung.

## Projektstruktur

```
src/
  domain/      Typen, Regel-Engine (rules.ts), Hinweis-Engine (hints.ts) + Tests
  levels/      zs-pv.ts  – Level rein datengetrieben (weitere Level = neue Dateien)
  content/     infotexts.ts – fachliche Erklärungen pro Bauteil
  state/       store.ts  – Reducer (Belegung + adaptive Fehlerhistorie)
  components/  Toolbar, Palette, Board, ComponentSymbol, Info-/Hint-Panel, …
```

## Erweiterbarkeit

Weitere Zählerschränke (ZS-WP mit SG-Ready/Lastmanagement als „Ampel", ZS-WB)
sind reine neue Level-Dateien im Format von `src/levels/zs-pv.ts`. Ein optionaler
LLM-Chat ließe sich später ergänzen, ohne die regelbasierte Kernlogik zu ersetzen.
