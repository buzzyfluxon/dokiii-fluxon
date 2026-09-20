<p align="center">
  <img src="assets/showcase-banner.png" alt="DOKIII Preview" width="100%" />
</p>

<h1 align="center">DOKIII</h1>

<p align="center">
  A macOS-inspired dock, floating music player, and desktop widgets for Windows.
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

---

## Download

<p align="center">
  <a href="https://github.com/fluxonbuzz/dokiii/releases/latest/download/DOKIII.exe">
    <img src="https://img.shields.io/badge/Download-DOKIII.exe-b39ddb?style=for-the-badge&logo=windows&logoColor=white" alt="Download DOKIII.exe" />
  </a>
  <br/>
  <sub>Single file &nbsp;•&nbsp; Windows 10/11 x64 &nbsp;•&nbsp; No separate installer needed</sub>
</p>

Download `DOKIII.exe` and run it. A short setup wizard installs DOKIII to your user profile and creates the shortcuts you choose. Nothing else is required.

Windows SmartScreen may show a warning the first time, because the app is not code-signed. Select **More info**, then **Run anyway**.

You can also browse every version on the [Releases page](https://github.com/fluxonbuzz/dokiii/releases).

---

## What It Does

- **macOS-Style Dock**: An animated bottom or side dock with fluid magnification, app badges, and quick folder access, including Downloads and the Recycle Bin.
- **Halo and Floating Music**: Shows the current song, artist, and album art from Spotify and Windows media players, with playback controls.
- **Desktop Widgets**: Glanceable widgets for world time, analog clock, calendar, system health (CPU, RAM, SSD), battery, and volume.

## Screenshots

<p align="center">
  <img src="assets/dock-overview.png" alt="DOKIII Dock and Downloads" width="100%" />
</p>

<p align="center">
  <em>Dock with app shortcuts, quick downloads access, and the Recycle Bin</em>
</p>

<br />

<p align="center">
  <img src="assets/desktop-widgets.png" alt="Desktop Widgets" width="100%" />
</p>

<p align="center">
  <em>Desktop widgets for system stats, clock, calendar, and battery</em>
</p>

<br />

<p align="center">
  <img src="assets/control-center.png" alt="Control Center and Settings" width="100%" />
</p>

<p align="center">
  <em>Control Center for customizing widgets, dock magnification, and positions</em>
</p>

---

## How to Use

### Getting Started
1. Download `DOKIII.exe` from [Releases](https://github.com/fluxonbuzz/dokiii/releases/latest).
2. Run it and follow the setup wizard. The dock and widgets appear on your desktop when it finishes.

### Dock
- **Launch apps**: Click any icon on the dock.
- **Add apps**: Click the **+** button to search installed programs or browse for an `.exe`.
- **Downloads**: Click the downloads folder icon on the right side of the dock to view or open recent files.
- **Move the dock**: Open Settings to place the dock on the bottom, left, or right edge of the screen.

### Music and Halo
- Play music in Spotify or any Windows media app.
- The floating player and the Halo bar update automatically with track details and album art.
- Click the player to pause, play, or skip tracks. Click outside to collapse it.

### Desktop Widgets
- Open the Control Center by clicking the DOKIII logo or using the system tray icon.
- Turn desktop widgets on or off with a single switch.
- Choose which widgets to show: System Monitor, Clocks, Calendar, Battery, Volume.

### Uninstalling
Open the Control Center and choose **Uninstall**, or use **Uninstall DOKIII** in the tray menu. You can also remove it from Windows Settings under Installed apps.

---

## Building from Source

### Requirements
- Windows 10 or 11
- Node.js 18 or newer
- npm

### Run in development
```bash
git clone https://github.com/fluxonbuzz/dokiii.git
cd dokiii
npm install
npm run dev
```

### Build the single-file executable
```bash
npm run build
npm run pack
```

The executable is written to `release/DOKIII.exe`. Pushing a tag that starts with `v` builds and publishes it automatically through GitHub Actions.

---

## License

Released under the [MIT License](LICENSE).
