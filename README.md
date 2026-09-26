

<p align="center">
  <img src="assets/app-logo.png" alt="DOKIII Logo" width="96" />
</p>

<h1 align="center">DOKIII</h1>

<p align="center">
  A macOS-inspired dock, floating music player, and desktop widgets for Windows.
</p>

<p align="center">
  <a href="https://github.com/buzzyfluxon/dokiii-fluxon/releases/latest">
    <img src="https://img.shields.io/github/v/release/buzzyfluxon/dokiii-fluxon?style=for-the-badge&color=b39ddb&label=version" alt="Latest Release" />
  </a>
  <a href="https://github.com/buzzyfluxon/dokiii-fluxon/releases">
    <img src="https://img.shields.io/github/downloads/buzzyfluxon/dokiii-fluxon/total?style=for-the-badge&color=b39ddb&label=downloads" alt="Downloads" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-b39ddb?style=for-the-badge" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-b39ddb?style=for-the-badge" alt="Platform" />
</p>

---

## Download

<p align="center">
  <a href="https://github.com/buzzyfluxon/dokiii-fluxon/releases/latest/download/DOKIII-Setup.exe">
    <img src="https://img.shields.io/badge/Download-DOKIII--Setup.exe-b39ddb?style=for-the-badge&logo=windows&logoColor=white" alt="Download DOKIII Installer" />
  </a>
  <br/>
  <sub>Single installer &nbsp;•&nbsp; Windows 10/11 x64 &nbsp;•&nbsp; Choose your install folder</sub>
</p>

Download `DOKIII-Setup.exe` and run it. The installer lets you pick the install folder (any drive) and sets up the shortcuts you choose. Nothing else is required.

Windows SmartScreen may show a warning the first time, because the app is not code-signed. Select **More info**, then **Run anyway**.

You can also browse every version on the [Releases page](https://github.com/buzzyfluxon/dokiii-fluxon/releases).

---

## What It Does

- **macOS-Style Dock**: An animated bottom or side dock with fluid magnification, app badges, and quick folder access, including Downloads and the Recycle Bin.
- **Halo and Floating Music**: Shows the current song, artist, and album art from Spotify and Windows media players, with playback controls.
- **Desktop Widgets**: Glanceable widgets for world time, analog clock, calendar, system health (CPU, RAM, SSD), battery, and volume.

---

## How to Use

### Getting Started
1. Download `DOKIII-Setup.exe` from [Releases](https://github.com/buzzyfluxon/dokiii-fluxon/releases/latest).
2. Run it and follow the installer. The dock and widgets appear on your desktop when it finishes.

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
git clone https://github.com/buzzyfluxon/dokiii-fluxon.git
cd dokiii
npm install
npm run dev
```

### Build the single-file executable
```bash
npm run build
npm run pack
```

The installer is written to `release/DOKIII-Setup.exe`. Pushing a tag that starts with `v` builds and publishes it automatically through GitHub Actions.

---

## License

Released under the [MIT License](LICENSE).
