import { Tray, Menu, nativeImage, NativeImage, BrowserWindow, app, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { DOKIII_ICON_DATA_URL } from './utils/icon';

let trayInstance: Tray | null = null;

function getTrayIcon(): NativeImage {
  const possiblePaths = [
    ...(app.isPackaged
      ? [
          path.join(process.resourcesPath, 'build', 'tray-icon.png'),
          path.join(process.resourcesPath, 'build', 'icon.png'),
        ]
      : []),
    path.join(__dirname, '..', 'renderer', 'assets', 'tray-icon.png'),
    path.join(__dirname, '..', '..', 'build', 'tray-icon.png'),
    path.join(__dirname, '..', 'renderer', 'assets', 'icon.png'),
    path.join(__dirname, '..', '..', 'build', 'icon.ico'),
    path.join(__dirname, '..', 'renderer', 'assets', 'dokiii-logo.jpg'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const img = nativeImage.createFromPath(p);
      if (!img.isEmpty()) {
        return img.resize({ width: 24, height: 24 });
      }
    }
  }

  const distLogoDir = path.join(__dirname, '..', 'renderer', 'assets');
  if (fs.existsSync(distLogoDir)) {
    const files = fs.readdirSync(distLogoDir);
    const logoFile = files.find((f: string) => f.startsWith('dokiii-logo'));
    if (logoFile) {
      const img = nativeImage.createFromPath(path.join(distLogoDir, logoFile));
      if (!img.isEmpty()) {
        return img.resize({ width: 24, height: 24 });
      }
    }
  }

  return nativeImage.createFromDataURL(DOKIII_ICON_DATA_URL).resize({ width: 24, height: 24 });
}

export function createTray(mainWindow: BrowserWindow, getAutoHide: () => boolean): Tray | null {
  if (trayInstance) {
    return trayInstance;
  }

  try {
    const icon = getTrayIcon();
    trayInstance = new Tray(icon);
    trayInstance.setToolTip('DOKIII');

    const toggleDock = () => {
      if (!mainWindow.isVisible()) {
        mainWindow.show();
        mainWindow.focus();
        return;
      }
      mainWindow.webContents.send('dock:toggleVisibility');
    };

    const buildMenu = () =>
      Menu.buildFromTemplate([
        {
          label: 'Open DOKIII App',
          click: () => {
            mainWindow.setSkipTaskbar(false);
            mainWindow.show();
            mainWindow.setAlwaysOnTop(true);
            mainWindow.moveTop();
            mainWindow.focus();
            mainWindow.webContents.send('dock:showApp');
          },
        },
        { type: 'separator' },
        {
          label: 'Show / Hide Dock',
          click: toggleDock,
        },
        {
          label: 'Widget Library',
          click: () => {
            mainWindow.show();
            mainWindow.webContents.send('dock:showWidgetLibrary');
          },
        },
        {
          label: 'Settings',
          click: () => {
            mainWindow.show();
            mainWindow.webContents.send('dock:showSettings');
          },
        },
        { type: 'separator' },
        {
          label: 'Auto Hide',
          type: 'checkbox',
          checked: getAutoHide(),
          click: (menuItem) => {
            mainWindow.webContents.send('dock:configChanged', { autoHide: menuItem.checked });
          },
        },
        { type: 'separator' },
        {
          label: 'Uninstall DOKIII',
          click: () => {
            ipcMain.emit('show-uninstall');
          },
        },
        {
          label: 'Quit DOKIII',
          click: () => app.quit(),
        },
      ]);

    trayInstance.on('right-click', () => {
      trayInstance?.popUpContextMenu(buildMenu());
    });

    trayInstance.on('click', toggleDock);

    trayInstance.on('double-click', () => {
      mainWindow.show();
      mainWindow.focus();
    });

    return trayInstance;
  } catch {
    return null;
  }
}
