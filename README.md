# Discord Lite — Premium Desktop App mit Sprachkanälen

Eine moderne, hochgradig performante und optisch ansprechende Discord-Alternative als Desktop-App, entwickelt mit **Electron** und **WebRTC**.

Diese App läuft plattformübergreifend auf **Windows**, **macOS** und **Linux** und kann direkt als Windows-Anwendung (`.exe`) paketiert und installiert werden.

---

## Features

- **Premium-Design (Glassmorphismus)**: Dunkles Obsidian-Theme mit transluzenten Panels (`backdrop-filter`), sanften Farbübergängen, leuchtenden Akzenten und flüssigen Hover-Animationen.
- **Lokale Sprachkanäle (WebRTC P2P)**: Voll funktionsfähiger Sprach-Chat zwischen mehreren Fenstern der App auf demselben Rechner! Du kannst ein zweites Fenster öffnen, demselben Sprachkanal beitreten und dich selbst sprechen hören.
- **Echtzeit-Audio-Visualisierer**: Jede Kachel im Sprach-Grid verfügt über einen eigenen HTML5 Canvas-Visualisierer, der das Audiosignal der Stimme in Echtzeit als Welle darstellt.
- **Spracherkennung (Speaking Border)**: Wenn du sprichst, leuchtet dein Avatar-Ring und dein Name im Kanal neon-grün auf. Nach einer kurzen Sprechpause blendet sich der Effekt automatisch aus.
- **Synthetische Soundeffekte (Web Audio API)**: Echte Discord-Klingeltöne beim Betreten oder Verlassen von Sprachkanälen sowie beim Stummschalten, synthetisiert direkt über Audio-Oszillatoren im Browser.
- **Einstellungs-Dialog**: Ändere deinen Benutzernamen und Status-Text über ein natives HTML5-Dialogfenster.
- **Interaktiver Chat**: Wenn du eine Nachricht sendest, reagiert ein integrierter Bot dynamisch, um den Chat lebendig zu gestalten.

---

## Voraussetzungen

- **Node.js** (Version 18 oder höher empfohlen)
- **npm** (wird standardmäßig mit Node installiert)

---

## Schnelleinrichtung & Starten

Folge diesen Schritten, um die App auf deinem System auszuführen:

1. **Abhängigkeiten installieren**:
   Öffne dein Terminal im Projektordner und führe aus:
   ```bash
   npm install
   ```

2. **App starten**:
   Starte die Electron-App mit:
   ```bash
   npm start
   ```

---

## Sprachkanäle testen (Mehrfenster-Modus)

Um die WebRTC-Sprachübertragung und die Audio-Visualisierung auf deinem eigenen Rechner zu testen:

1. Starte die App mit `npm start`.
2. Klicke oben in der Titelleiste auf den Button **"Neues Fenster"** (oder drücke `Ctrl + N` / `Cmd + N`). Ein zweites, separates Client-Fenster öffnet sich.
3. Jedem Fenster wird automatisch ein zufälliger Benutzername zugewiesen (z. B. `Gamer_Alpha#1234` und `PixelQueen#5678`).
4. Klicke in **beiden** Fenstern links unter "SPRACHKANÄLE" auf **"Lobby"**.
5. **Erlaube den Mikrofon-Zugriff**, wenn das Betriebssystem danach fragt.
6. Die beiden Fenster verbinden sich nun vollautomatisch über ein lokales P2P-WebRTC-Netzwerk.
7. Sprich in dein Mikrofon:
   - Du siehst, wie sich dein Pegel-Balken unten links bewegt.
   - Dein Avatar-Ring im Sprach-Grid leuchtet grün auf.
   - Im Canvas unter deinem Avatar wird deine Stimme als Wellenform visualisiert.
   - Du hörst deine eigene Stimme leicht verzögert (als Loopback) aus dem anderen Fenster.
8. Klicke auf **Stummschalten (Mute)** oder **Taubstellen (Deafen)** im Deck unten links, um die Funktionen zu testen. Die Symbole und der Audiostatus werden sofort zwischen den Fenstern synchronisiert!

> **Tipp**: Benutze Kopfhörer beim Testen, um Rückkopplungen (Pfeifen) zwischen deinem Mikrofon und den Lautsprechern zu vermeiden. Die Standardlautstärke für Remote-Streams ist zur Sicherheit bereits auf 50% eingestellt.

---

## Für Windows paketieren (Kompilieren)

Du kannst die App direkt in eine installierbare Windows-Datei (`.exe`) kompilieren. 

### Option A: Ausführen auf Windows (Empfohlen)
Wenn du dich auf einem Windows-Rechner befindest, führe einfach diesen Befehl aus:

- **Als lokales Verzeichnis verpacken** (schnell zum Testen):
  ```bash
  npm run package
  ```
  Dies erstellt einen Ordner unter `dist/win-unpacked/` mit der direkt ausführbaren `DiscordLite.exe`.

- **Als Windows NSIS-Installer paketieren** (für die Installation):
  ```bash
  npm run dist
  ```
  Dies generiert eine Setup-Datei (z. B. `DiscordLite Setup 1.0.0.exe`) im Ordner `dist/`, die du auf jedem Windows-PC installieren kannst.

### Option B: Cross-Compilation auf macOS/Linux
`electron-builder` kann unter macOS Windows-Pakete schnüren. Führe dazu einfach Folgendes aus:
```bash
npm run dist -- --win
```
Dies erstellt das Windows-Paket direkt im `dist/` Ordner deines Macs.

---

## Projektstruktur

- [package.json](package.json) - Skripte, Metadaten und Electron-Abhängigkeiten.
- [main.js](main.js) - Der Electron-Hauptprozess. Verwaltet die nativen Anwendungsfenster und die Systemberechtigungen für das Mikrofon.
- [preload.js](preload.js) - Das Bindeglied (Preload) zur sicheren Freigabe von Fensterfunktionen an das Frontend.
- [index.html](index.html) - Das HTML-Gerüst der Benutzeroberfläche.
- [style.css](style.css) - Das gesamte visuelle Designsystem (Themes, Layouts, Animationen, Glassmorphismus).
- [renderer.js](renderer.js) - Die gesamte Programmlogik (Audioanalyse, WebRTC-Verbindungsaufbau, Signalübertragung per BroadcastChannel, Chat-Verlauf und UI-Steuerung).
# Ticketsystem
