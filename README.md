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
- **Adaptiver Hinweis-Mechanismus (ohne LLM), gezielt gestaffelt:** zählt Fehler
  **pro Fehlstelle** (Slot + Fehlerart) und eskaliert inhaltlich –
  Stufe 1 = dezenter Anstoß (ohne Begründung) → Stufe 2 = fachliche Erklärung →
  Stufe 3 = automatisch geöffnetes Infofeld.
- **Fachliche Leitplanken:** SLS plombiert (nicht wählbar), ÜSS am Anlagenrisiko
  (nicht „PV-exklusiv"), RCD Typ A/B als Erkennungsmuster statt Stärke-Ranking,
  Sofort-„rot" als kenntlich gemachte Vereinfachung der Zeit-Strom-Kennlinie.

## Level & Progression

Level-Auswahl mit Freischaltung – Level 2 öffnet nach Abschluss von Level 1.

1. **Zählerschrank PV** – Schutztechnik. Kernpuzzle: **RCD Typ B** am
   Wechselrichter-/Wallbox-Zweig (glatte Gleichfehlerströme), **Typ A** an den
   Endstromkreisen; passende Leitungsschutz-Dimensionierung; Überspannungsschutz.
2. **Zählerschrank Wärmepumpe** – **aktives Lastmanagement**. Die WP muss über ein
   **SG-Ready-Schütz** schaltbar sein (nicht fest verdrahtet). Neue „Ampel"-Mechanik:
   Freigabe bei PV-Überschuss, Sperre in der Abendspitze und beim EVU-Signal
   (§14a) – aktive Steuerung im Kontrast zum passiven Schutz aus Level 1.

## Bedienung

Bauteil in der Palette **anklicken** (auswählen), dann den **Steckplatz**
anklicken – oder per **Drag & Drop** ziehen. Klick auf das `i` an jedem Slot
öffnet die fachliche Erklärung.

## Projektstruktur

```
src/
  domain/      Typen, Regel-Engine (rules.ts), Hinweis-Engine (hints.ts) + Tests
  levels/      zs-pv.ts, zs-wp.ts, registry.ts (Level + Freischalt-Logik)
  content/     infotexts.ts – fachliche Erklärungen pro Bauteil
  state/       store.ts  – Reducer (Belegung + adaptive Fehlerhistorie)
  components/  Toolbar, Palette, Board, ComponentSymbol, LevelSelect,
               LoadManagementAmpel, Info-/Hint-Panel, …
```

## Erweiterbarkeit

Weitere Zählerschränke (ZS-WP mit SG-Ready/Lastmanagement als „Ampel", ZS-WB)
sind reine neue Level-Dateien im Format von `src/levels/zs-pv.ts`. Ein optionaler
LLM-Chat ließe sich später ergänzen, ohne die regelbasierte Kernlogik zu ersetzen.
