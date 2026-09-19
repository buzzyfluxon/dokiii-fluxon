import { Tray, Menu, nativeImage, NativeImage, BrowserWindow, app, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let trayInstance: Tray | null = null;

const DOKIII_ICON_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAATpSURBVFhHrVfba1xFGM+rzd43m+ez97P2dvZ7GYvuW1i04TWUGNja0utCkK0RANBagpik5aWJKYkMbE3bTC0kiiWUh+qD0qgQgstgk+iUH3xwZcK/gU/mbO3ObOz21R8+DHnfPPN7/vN983MmdNg1psHzUbLnFHPwsyx1bOzIH71fM1zJG6DyWBeajK1wmxshtnYUoGBvJdA2Rk0KW21n8nQrKBip/sLfWRsg6LE0AyjvkkFk8FSbkug+3YDo94CE8NJcxERBQHGioDSQFYIS7AbsJNiOUhcrgBTUQBL+DSwY3jB6bYioFgC9WB1y5LyAj6LX8HGCFAPokioZ9pHRci+1/DjC1BWZbVq9rlKABWACCiBDVYduPBcLgHdURWE6tNrTWh8TgfNHn0Z2kaDCppGveLHBma5FAF0CXiOZRgsaNyjQ1uLDXKsC6nOHJKJLDrlNBLxNBJyWnkmiEoJtLVYFTEsZ5UAJQNadQnYAQRkpgGfhJfHj2MwP6IEj0dTiEWSkEQZwUAU0UhSeSfins8Pw+MOQKvhi1AJ0GtJCap3AVl4pDXozLCY23Bw9DBSyRwElx9OuwcOuwBbhwvxWArD+0YVm6uIkC+MfG4IzU3t1bwqFAXwSlACSaXfKyHfPwKPEITL4YXTLsDabkdHqw3rH2/g3s7PeOnAEVjNHRBa3Ag4QsjE+uB1BqHTGGuKqJ+BsgA9xJCMbGZQSSuZabulHXEhjKHcXlxZ38Jna7cxdWwah+QXsHD0DHKeDLpC3Qi5okoZanFTAmrvW7Kqw2IS2a5BeFx+OFrt+ODYDO5evosbl77Gwvnr+GRhGydffAfLY+fwZPkx9odHkPTnILni0Gr0XN6aAmghpNU06hAJJJGTB+BotmF2fAa/bT/GxuotXFzcxIWzn2Jt/ktMHHoPw9IoTo1+CNmdQZeUR8id2K2ASglYISQDEU8nMuFe9Hlk/Lp+D3eW72Bl8XN8NL+BC2ev4dLiLbx+cBqnX13Bw+2/kY2OIhbsRYASwBNRPgfYNaASoNEjIshIB7I4mhrGP9s/4fzbs5iemsXJt2YwNXkGX1z5FpPHT6M/PobJI/MQhQxkqR8BYRcZIOcAK4AWQQgkVxTpUA4D/hT+vHEfP1z7DpfXtrC6chOrFzexc/shjo+9iXdfO4Wdrx4hEe5FRMzBJ0Shq5cBciEplYAOqhZggNcWREbsgctix9wb7+OvR0/w4Mff8f3OL3hw/w/cvP4NBKeIE+MTuLq4hXAojVi0B25lGxZ2AV8AswZ40OtMaLNY0R0dQNAlwmP14cThCSwtbWBpZRNT0+cQiWThsHtht/thtfoQ8Mnozu5Ha7NN+S5UCSgecpVvQfEoVmbOWYg6rQGiO4YeeUjZEWS2bocIt1OC0xGEVwjD74si6E8gFunF3vwrCIsZ5QyhebgZqBLAyYKSCa0Rgi2IWCiHqJhFRMogLKYVRKQs4pE+JOP7kEkegN8jF1NvrnAwwWsKoIWwonRao1ISHlkJJFv01mOhElBrG7ICWFvh4sEjp/o5wVkRdTPAgh5YygBLzAtCv6s56EvpU+4DPGK6j7XRY1g7jboloIlYWy3U8y3crtWZ2bWAWn3PAh6H6hzgOdQa+F/A41GtAZ5DrYH/FxQBBl3x71j1N0yhlp3bT/8psyj+cVP+JO6//sM90fiE5H0AAAAASUVORK5CYII=';

function getTrayIcon(): NativeImage {
  const possiblePaths = [
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

export function createTray(mainWindow: BrowserWindow): Tray | null {
  if (trayInstance) {
    return trayInstance;
  }

  try {
    const icon = getTrayIcon();
    trayInstance = new Tray(icon);
    trayInstance.setToolTip('DOKIII');

  const contextMenu = Menu.buildFromTemplate([
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
      click: () => {
        if (mainWindow.isVisible()) mainWindow.hide();
        else {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: 'Setup Wizard',
      click: () => {
        ipcMain.emit('show-setup');
      },
    },
    { type: 'separator' },
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
      click: (menuItem) => {
        mainWindow.webContents.send('dock:configChanged', { autoHide: menuItem.checked });
      },
    },
    {
      label: 'Always On Top',
      type: 'checkbox',
      checked: false,
      click: (menuItem) => {
        mainWindow.setAlwaysOnTop(menuItem.checked);
      },
    },
    {
      label: 'Start with Windows',
      type: 'checkbox',
      click: (menuItem) => {
        app.setLoginItemSettings({ openAtLogin: menuItem.checked });
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

  trayInstance.setContextMenu(contextMenu);

  trayInstance.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  trayInstance.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  return trayInstance;
  } catch {
    return null;
  }
}
