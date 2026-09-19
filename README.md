<p align="center">
  <img src="assets/showcase-banner.png" alt="DOKIII Preview" width="100%" />
</p>

<h1 align="center">🐾 dokiii</h1>

<p align="center">
  <em>your music, always there.</em><br/>
  A clean macOS-inspired dock, floating music player, and beautiful desktop widgets for Windows.
</p>

<p align="center">
  <a href="https://github.com/fluxonbuzz/dokiii/releases/latest">
    <img src="https://img.shields.io/github/v/release/fluxonbuzz/dokiii?style=for-the-badge&color=b39ddb&label=version" alt="Latest Release" />
  </a>
  <a href="https://github.com/fluxonbuzz/dokiii/releases">
    <img src="https://img.shields.io/github/downloads/fluxonbuzz/dokiii/total?style=for-the-badge&color=b39ddb&label=downloads" alt="Downloads" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-b39ddb?style=for-the-badge" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-b39ddb?style=for-the-badge" alt="Platform" />
</p>

<p align="center">
  <b>simple. smooth. dokiii.</b> ✨
</p>

---

## ⬇️ Download

<table align="center">
<tr>
<td align="center" width="260">
<a href="https://github.com/fluxonbuzz/dokiii/releases/latest/download/DOKIII.exe">
<img src="https://img.shields.io/badge/⬇_Download-DOKIII.exe-b39ddb?style=for-the-badge&logo=windows&logoColor=white" alt="Download DOKIII.exe" />
</a>
<br/><sub>Standalone installer &nbsp;•&nbsp; Windows 10/11 x64</sub>
</td>
<td align="center" width="260">
<a href="https://github.com/fluxonbuzz/dokiii/releases/latest">
<img src="https://img.shields.io/badge/📦_Download-Portable_ZIP-b39ddb?style=for-the-badge&logo=windows&logoColor=white" alt="Download Portable ZIP" />
</a>
<br/><sub>No install needed &nbsp;•&nbsp; Just unzip and run</sub>
</td>
</tr>
</table>

<p align="center">
  Prefer to see every version? Check the <a href="https://github.com/fluxonbuzz/dokiii/releases">full Releases page</a>.
</p>

---

## 🐱 What It Does

DOKIII brings a smooth, modern desktop experience to Windows:

- **macOS-Style Dock**: An animated bottom or side dock with fluid magnification, app badges, and quick folder access (including your Downloads folder and Trash).
- **DOKIII Halo and Floating Music**: See your current song, artist, and album art from Spotify and Windows media players with one-click playback controls.
- **Desktop Widgets**: Clean, glanceable widgets on your desktop for world time, analog clock, calendar, system health (CPU, RAM, SSD), battery, and volume.
- **Light on Resources**: Engineered to stay around 1-2% idle CPU usage so your PC stays fast and quiet.

## 📸 Screenshots

<p align="center">
  <img src="assets/dock-overview.png" alt="DOKIII Dock and Downloads" width="100%" />
</p>

<p align="center">
  <em>macOS-style dock with app shortcuts, quick downloads access, and trash</em>
</p>

<br />

<p align="center">
  <img src="assets/desktop-widgets.png" alt="Desktop Widgets" width="100%" />
</p>

<p align="center">
  <em>Glanceable desktop widgets for system stats, clock, calendar, and battery</em>
</p>

<br />

<p align="center">
  <img src="assets/control-center.png" alt="Control Center and Settings" width="100%" />
</p>

<p align="center">
  <em>DOKIII Control Center for customizing widgets, dock magnification, and positions</em>
</p>

---

## 🎀 How to Use

### Getting Started
1. Download `DOKIII.exe` from [Releases](https://github.com/fluxonbuzz/dokiii/releases/latest).
2. Launch the app. The dock and widgets will appear immediately on your desktop.

### Using the Dock
- **Launch Apps**: Click any icon on the dock to open the app.
- **Add Apps**: Click the **+** button on the dock to search installed programs or browse for an `.exe` on your PC.
- **Access Downloads**: Click the downloads folder icon on the right side of the dock to quickly view or open recent files.
- **Move the Dock**: Open Settings to position the dock on the bottom, left, or right edge of your screen.

### Music and Halo
- Play music in Spotify or any Windows media app.
- The floating player and top Halo bar update automatically with track details and album art.
- Click the player to pause, play, or skip tracks. Click outside to collapse.

### Desktop Widgets
- Open the **DOKIII Control Center** by clicking the DOKIII logo or using the system tray icon.
- Toggle desktop widgets on or off with a single switch.
- Choose which widgets you want to show (System Monitor, Clocks, Calendar, Battery, Volume).

---

## 🛠️ Building from Source

If you want to run or build DOKIII locally:

### Requirements
- Windows 10 or 11
- Node.js 18 or newer
- npm

### Quick Start
```bash
git clone https://github.com/fluxonbuzz/dokiii.git
cd dokiii
npm install
npm run dev
```

### Build Executable
```bash
npm run build
npm run pack
```

The packaged executable will be generated in the `release/` directory.

---

## 📄 License

MIT License
