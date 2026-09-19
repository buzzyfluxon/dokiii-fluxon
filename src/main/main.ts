import { app, BrowserWindow, screen, ipcMain, nativeImage, NativeImage, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'child_process';
import Store from 'electron-store';
import { registerSystemHandlers } from './ipc/system';
import { registerFilesystemHandlers } from './ipc/filesystem';
import { registerMediaHandlers } from './ipc/media';
import { registerProcessHandlers } from './ipc/process';
import { registerScreenshotHandlers } from './ipc/screenshot';
import { registerStartupHandlers } from './ipc/startup';
import { killAllPowerShell } from './utils/powershell';
import { createTray } from './tray';
import { DEFAULT_DOCK_CONFIG, DEFAULT_ENABLED_WIDGETS, DEFAULT_PROFILES, WIDGET_REGISTRY } from '../shared/constants';

app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-http-cache');

const logPath = path.join(process.env.APPDATA || '', 'dokiii', 'debug.log');
function logDebug(msg: string) {
  try {
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
  } catch {}
}
logDebug('--- DOKIII START pid=' + process.pid + ' argv=' + process.argv.join(' '));

process.on('uncaughtException', (err) => {
  logDebug('uncaughtException: ' + (err?.stack || err));
});
process.on('unhandledRejection', (reason: any) => {
  logDebug('unhandledRejection: ' + (reason?.stack || reason));
});
process.on('exit', (code) => {
  logDebug('process exit event: code=' + code);
});
app.on('quit', (_e, exitCode) => {
  logDebug('app quit event: exitCode=' + exitCode);
});
app.on('render-process-gone', (_e, _w, details) => {
  logDebug('render-process-gone: ' + JSON.stringify(details));
});
app.on('child-process-gone', (_e, details) => {
  logDebug('child-process-gone: ' + JSON.stringify(details));
});
app.on('before-quit', () => {
  killAllPowerShell();
  logDebug('before-quit fired');
});
app.on('will-quit', () => {
  killAllPowerShell();
  logDebug('will-quit fired');
});

const store = new Store({
  defaults: {
    dock: DEFAULT_DOCK_CONFIG,
    enabledWidgets: DEFAULT_ENABLED_WIDGETS,
    widgetOrder: WIDGET_REGISTRY.map((w) => w.id),
    notes: [],
    profiles: DEFAULT_PROFILES,
    activeProfileId: 'default',
    windowPosition: null,
    setupComplete: false,
  },
});

let mainWindow: BrowserWindow | null = null;
let setupWindow: BrowserWindow | null = null;
let uninstallWindow: BrowserWindow | null = null;
let tray: any = null;
let isModalOpen = false;
let isPopoverOpen = false;

const DOKIII_ICON_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAATpSURBVFhHrVfba1xFGM+rzd43m+ez97P2dvZ7GYvuW1i04TWUGNja0utCkK0RANBagpik5aWJKYkMbE3bTC0kiiWUh+qD0qgQgstgk+iUH3xwZcK/gU/mbO3ObOz21R8+DHnfPPN7/vN983MmdNg1psHzUbLnFHPwsyx1bOzIH71fM1zJG6DyWBeajK1wmxshtnYUoGBvJdA2Rk0KW21n8nQrKBip/sLfWRsg6LE0AyjvkkFk8FSbkug+3YDo94CE8NJcxERBQHGioDSQFYIS7AbsJNiOUhcrgBTUQBL+DSwY3jB6bYioFgC9WB1y5LyAj6LX8HGCFAPokioZ9pHRci+1/DjC1BWZbVq9rlKABWACCiBDVYduPBcLgHdURWE6tNrTWh8TgfNHn0Z2kaDCppGveLHBma5FAF0CXiOZRgsaNyjQ1uLDXKsC6nOHJKJLDrlNBLxNBJyWnkmiEoJtLVYFTEsZ5UAJQNadQnYAQRkpgGfhJfHj2MwP6IEj0dTiEWSkEQZwUAU0UhSeSfins8Pw+MOQKvhi1AJ0GtJCap3AVl4pDXozLCY23Bw9DBSyRwElx9OuwcOuwBbhwvxWArD+0YVm6uIkC+MfG4IzU3t1bwqFAXwSlACSaXfKyHfPwKPEITL4YXTLsDabkdHqw3rH2/g3s7PeOnAEVjNHRBa3Ag4QsjE+uB1BqHTGGuKqJ+BsgA9xJCMbGZQSSuZabulHXEhjKHcXlxZ38Jna7cxdWwah+QXsHD0DHKeDLpC3Qi5okoZanFTAmrvW7Kqw2IS2a5BeFx+OFrt+ODYDO5evosbl77Gwvnr+GRhGydffAfLY+fwZPkx9odHkPTnILni0Gr0XN6aAmghpNU06hAJJJGTB+BotmF2fAa/bT/GxuotXFzcxIWzn2Jt/ktMHHoPw9IoTo1+CNmdQZeUR8id2K2ASglYISQDEU8nMuFe9Hlk/Lp+D3eW72Bl8XN8NL+BC2ev4dLiLbx+cBqnX13Bw+2/kY2OIhbsRYASwBNRPgfYNaASoNEjIshIB7I4mhrGP9s/4fzbs5iemsXJt2YwNXkGX1z5FpPHT6M/PobJI/MQhQxkqR8BYRcZIOcAK4AWQQgkVxTpUA4D/hT+vHEfP1z7DpfXtrC6chOrFzexc/shjo+9iXdfO4Wdrx4hEe5FRMzBJ0Shq5cBciEplYAOqhZggNcWREbsgctix9wb7+OvR0/w4Mff8f3OL3hw/w/cvP4NBKeIE+MTuLq4hXAojVi0B25lGxZ2AV8AswZ40OtMaLNY0R0dQNAlwmP14cThCSwtbWBpZRNT0+cQiWThsHtht/thtfoQ8Mnozu5Ha7NN+S5UCSgecpVvQfEoVmbOWYg6rQGiO4YeeUjZEWS2bocIt1OC0xGEVwjD74si6E8gFunF3vwrCIsZ5QyhebgZqBLAyYKSCa0Rgi2IWCiHqJhFRMogLKYVRKQs4pE+JOP7kEkegN8jF1NvrnAwwWsKoIWwonRao1ISHlkJJFv01mOhElBrG7ICWFvh4sEjp/o5wVkRdTPAgh5YygBLzAtCv6s56EvpU+4DPGK6j7XRY1g7jboloIlYWy3U8y3crtWZ2bWAWn3PAh6H6hzgOdQa+F/A41GtAZ5DrYH/FxQBBl3x71j1N0yhlp3bT/8psyj+cVP+JO6//sM90fiE5H0AAAAASUVORK5CYII=';

function getAppNativeIcon(): NativeImage {
  const icoPath = path.join(__dirname, '..', '..', 'build', 'icon.ico');
  if (fs.existsSync(icoPath)) {
    return nativeImage.createFromPath(icoPath);
  }
  const pngPath = path.join(__dirname, '..', 'renderer', 'assets', 'icon.png');
  if (fs.existsSync(pngPath)) {
    return nativeImage.createFromPath(pngPath);
  }
  const logoPath = path.join(__dirname, '..', 'renderer', 'assets', 'dokiii-logo.jpg');
  if (fs.existsSync(logoPath)) {
    return nativeImage.createFromPath(logoPath);
  }
  return nativeImage.createFromDataURL(DOKIII_ICON_DATA_URL);
}

function getTargetDisplay() {
  const displays = screen.getAllDisplays();
  const monitorIndex = (store.get('dock.defaultMonitor', 0) as number) || 0;
  return displays[monitorIndex] || screen.getPrimaryDisplay();
}

function getFullBounds() {
  const display = getTargetDisplay();
  return display.workArea;
}

function updateWindowBounds() {
  if (!mainWindow) return;
  const targetBounds = getFullBounds();
  const current = mainWindow.getBounds();
  const boundsChanged =
    current.x !== targetBounds.x ||
    current.y !== targetBounds.y ||
    current.width !== targetBounds.width ||
    current.height !== targetBounds.height;
  if (boundsChanged) {
    mainWindow.setBounds(targetBounds);
  }
  if (isModalOpen || isPopoverOpen) {
    mainWindow.setIgnoreMouseEvents(false);
  }
}

function getAppExePath(): string {
  if (app.isPackaged) {
    return process.execPath;
  }
  return path.join(app.getAppPath(), 'node_modules', '.bin', 'electron.cmd');
}

function installAppFiles(): string {
  const currentExe = getAppExePath();
  const currentDir = path.dirname(currentExe);
  const targetDir = path.join(
    process.env.LOCALAPPDATA || path.join(app.getPath('home'), 'AppData', 'Local'),
    'Programs',
    'DOKIII'
  );
  const targetExe = path.join(targetDir, 'DOKIII.exe');

  if (app.isPackaged && currentDir.toLowerCase() !== targetDir.toLowerCase()) {
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const files = fs.readdirSync(currentDir);
      for (const file of files) {
        const srcFile = path.join(currentDir, file);
        const dstFile = path.join(targetDir, file);
        try {
          const stat = fs.statSync(srcFile);
          if (stat.isDirectory()) {
            fs.cpSync(srcFile, dstFile, { recursive: true, force: true });
          } else {
            fs.copyFileSync(srcFile, dstFile);
          }
        } catch {}
      }
      return targetExe;
    } catch {
      return currentExe;
    }
  }
  return currentExe;
}

function registerWindowsUninstall(exePath: string): void {
  try {
    const key = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\DOKIII';
    const installDir = path.dirname(exePath);
    execFile('reg.exe', ['add', key, '/v', 'DisplayName', '/d', 'DOKIII', '/f']);
    execFile('reg.exe', ['add', key, '/v', 'DisplayVersion', '/d', '1.0.0', '/f']);
    execFile('reg.exe', ['add', key, '/v', 'Publisher', '/d', 'DOKIII', '/f']);
    execFile('reg.exe', ['add', key, '/v', 'DisplayIcon', '/d', `${exePath},0`, '/f']);
    execFile('reg.exe', ['add', key, '/v', 'InstallLocation', '/d', installDir, '/f']);
    execFile('reg.exe', ['add', key, '/v', 'UninstallString', '/d', `"${exePath}" --uninstall`, '/f']);
    execFile('reg.exe', ['add', key, '/v', 'NoModify', '/t', 'REG_DWORD', '/d', '1', '/f']);
    execFile('reg.exe', ['add', key, '/v', 'NoRepair', '/t', 'REG_DWORD', '/d', '1', '/f']);
  } catch {}
}

function unregisterWindowsUninstall(): void {
  try {
    const key = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\DOKIII';
    execFile('reg.exe', ['delete', key, '/f']);
  } catch {}
}

function createDesktopShortcut(customExePath?: string): boolean {
  try {
    const exePath = customExePath || getAppExePath();
    if (process.platform !== 'win32') return false;

    const desktopLocations = new Set<string>();
    try {
      desktopLocations.add(app.getPath('desktop'));
    } catch {}
    const homeDesktop = path.join(app.getPath('home'), 'Desktop');
    if (fs.existsSync(homeDesktop)) {
      desktopLocations.add(homeDesktop);
    }

    let success = false;
    for (const dPath of desktopLocations) {
      if (fs.existsSync(dPath)) {
        const shortcutPath = path.join(dPath, 'DOKIII.lnk');
        const mode = fs.existsSync(shortcutPath) ? 'replace' : 'create';
        const ok = shell.writeShortcutLink(shortcutPath, mode, {
          target: exePath,
          cwd: path.dirname(exePath),
          description: 'DOKIII Desktop Dock',
          icon: exePath,
          iconIndex: 0,
        });
        if (ok) success = true;
      }
    }

    const startMenuDir = path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    if (fs.existsSync(startMenuDir)) {
      const startMenuLnk = path.join(startMenuDir, 'DOKIII.lnk');
      const startMode = fs.existsSync(startMenuLnk) ? 'replace' : 'create';
      shell.writeShortcutLink(startMenuLnk, startMode, {
        target: exePath,
        cwd: path.dirname(exePath),
        description: 'DOKIII Desktop Dock',
        icon: exePath,
        iconIndex: 0,
      });
    }

    return success;
  } catch {
    return false;
  }
}

function removeDesktopShortcut(): boolean {
  try {
    const desktopLocations = new Set<string>();
    try {
      desktopLocations.add(app.getPath('desktop'));
    } catch {}
    const homeDesktop = path.join(app.getPath('home'), 'Desktop');
    if (fs.existsSync(homeDesktop)) {
      desktopLocations.add(homeDesktop);
    }
    for (const dPath of desktopLocations) {
      const shortcutPath = path.join(dPath, 'DOKIII.lnk');
      if (fs.existsSync(shortcutPath)) {
        try {
          fs.unlinkSync(shortcutPath);
        } catch {}
      }
    }
    const startMenu = path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'DOKIII.lnk');
    if (fs.existsSync(startMenu)) {
      try {
        fs.unlinkSync(startMenu);
      } catch {}
    }
    return true;
  } catch {
    return false;
  }
}

function getStartupShortcutPath(): string {
  return path.join(
    process.env.APPDATA || '',
    'Microsoft',
    'Windows',
    'Start Menu',
    'Programs',
    'Startup',
    'DOKIII.lnk'
  );
}

function configureStartup(enable: boolean, customExePath?: string): void {
  try {
    const exePath = customExePath || getAppExePath();
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: exePath,
      args: ['--startup'],
    });

    const startupLnk = getStartupShortcutPath();
    if (enable) {
      const mode = fs.existsSync(startupLnk) ? 'replace' : 'create';
      shell.writeShortcutLink(startupLnk, mode, {
        target: exePath,
        cwd: path.dirname(exePath),
        args: '--startup',
        description: 'DOKIII Desktop Dock',
        icon: exePath,
        iconIndex: 0,
      });
    } else {
      if (fs.existsSync(startupLnk)) {
        try {
          fs.unlinkSync(startupLnk);
        } catch {}
      }
    }
  } catch {}
}

function removeAppData(): boolean {
  try {
    const userDataPath = app.getPath('userData');
    if (fs.existsSync(userDataPath)) {
      fs.rmSync(userDataPath, { recursive: true, force: true });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function getLogoDataUrl(): string {
  const logoPath = path.join(__dirname, '..', 'renderer', 'assets', 'dokiii-logo.jpg');
  if (fs.existsSync(logoPath)) {
    const data = fs.readFileSync(logoPath);
    return 'data:image/jpeg;base64,' + data.toString('base64');
  }

  const distLogoDir = path.join(__dirname, '..', 'renderer', 'assets');
  if (fs.existsSync(distLogoDir)) {
    const files = fs.readdirSync(distLogoDir);
    const logoFile = files.find((f: string) => f.startsWith('dokiii-logo'));
    if (logoFile) {
      const data = fs.readFileSync(path.join(distLogoDir, logoFile));
      const ext = path.extname(logoFile).slice(1);
      return `data:image/${ext};base64,` + data.toString('base64');
    }
  }

  return DOKIII_ICON_DATA_URL;
}

function createSetupWindow() {
  if (setupWindow) {
    setupWindow.setAlwaysOnTop(true);
    setupWindow.show();
    setupWindow.focus();
    setupWindow.moveTop();
    return;
  }

  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workArea;
  const winWidth = 540;
  const winHeight = 480;

  setupWindow = new BrowserWindow({
    title: 'DOKIII Setup',
    icon: getAppNativeIcon(),
    x: Math.floor((width - winWidth) / 2) + display.workArea.x,
    y: Math.floor((height - winHeight) / 2) + display.workArea.y,
    width: winWidth,
    height: winHeight,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    hasShadow: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'setup-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  setupWindow.loadFile(path.join(__dirname, '..', 'setup', 'setup.html'));
  setupWindow.setAlwaysOnTop(true);
  setupWindow.show();
  setupWindow.focus();
  setupWindow.moveTop();

  setupWindow.on('closed', () => {
    setupWindow = null;
    if (!store.get('setupComplete') && !mainWindow) {
      app.quit();
    }
  });
}

function createUninstallWindow() {
  if (uninstallWindow) {
    uninstallWindow.setAlwaysOnTop(true);
    uninstallWindow.show();
    uninstallWindow.focus();
    uninstallWindow.moveTop();
    return;
  }

  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workArea;
  const winWidth = 540;
  const winHeight = 480;

  uninstallWindow = new BrowserWindow({
    title: 'Uninstall DOKIII',
    icon: getAppNativeIcon(),
    x: Math.floor((width - winWidth) / 2) + display.workArea.x,
    y: Math.floor((height - winHeight) / 2) + display.workArea.y,
    width: winWidth,
    height: winHeight,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    hasShadow: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'setup-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  uninstallWindow.loadFile(path.join(__dirname, '..', 'setup', 'uninstall.html'));
  uninstallWindow.setAlwaysOnTop(true);
  uninstallWindow.show();
  uninstallWindow.focus();
  uninstallWindow.moveTop();

  uninstallWindow.on('closed', () => {
    uninstallWindow = null;
  });
}

function createWindow() {
  logDebug('createWindow called');
  const initialBounds = getFullBounds();

  mainWindow = new BrowserWindow({
    title: 'DOKIII',
    icon: getAppNativeIcon(),
    x: initialBounds.x,
    y: initialBounds.y,
    width: initialBounds.width,
    height: initialBounds.height,
    frame: false,
    transparent: true,
    alwaysOnTop: store.get('dock.alwaysOnTop', false) as boolean,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      spellcheck: false,
      backgroundThrottling: false,
    },
  });

  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }

  mainWindow.on('unresponsive', () => {
    logDebug('mainWindow unresponsive');
  });
  mainWindow.webContents.on('did-fail-load', (_, code, desc, url) => {
    logDebug(`did-fail-load: code=${code}, desc=${desc}, url=${url}`);
  });
  mainWindow.webContents.on('render-process-gone', (_, details) => {
    logDebug(`render-process-gone: ${JSON.stringify(details)}`);
  });
  mainWindow.webContents.on('console-message', (_, level, message) => {
    logDebug(`renderer [${level}]: ${message}`);
  });

  const startupLnk = getStartupShortcutPath();
  if (fs.existsSync(startupLnk)) {
    try {
      const link = shell.readShortcutLink(startupLnk);
      if (!link.args || !link.args.includes('--startup')) {
        shell.writeShortcutLink(startupLnk, 'replace', {
          target: link.target,
          cwd: link.cwd,
          args: '--startup',
          description: link.description || 'DOKIII Desktop Dock',
          icon: link.icon || link.target,
          iconIndex: link.iconIndex || 0,
        });
      }
    } catch {}
  }

  const loginItemSettings = app.getLoginItemSettings();
  const isStartupLaunch =
    process.argv.includes('--startup') ||
    process.argv.includes('--hidden') ||
    Boolean(loginItemSettings.wasOpenedAtLogin) ||
    Boolean(loginItemSettings.wasOpenedAsHidden);

  let initialAppShown = false;
  const triggerInitialApp = () => {
    if (initialAppShown || isStartupLaunch || !mainWindow) return;
    initialAppShown = true;
    mainWindow.setSkipTaskbar(false);
    mainWindow.setAlwaysOnTop(true);
    mainWindow.moveTop();
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send('dock:showApp');
  };

  mainWindow.webContents.on('did-finish-load', () => {
    logDebug('did-finish-load fired');
    if (isStartupLaunch && mainWindow) {
      mainWindow.setSkipTaskbar(true);
      mainWindow.show();
    } else {
      triggerInitialApp();
    }
  });

  tray = createTray(mainWindow);

  ipcMain.on('app:ready', () => {
    logDebug('app:ready received');
    if (!isStartupLaunch) {
      triggerInitialApp();
    }
  });

  ipcMain.on('show-uninstall', () => {
    createUninstallWindow();
  });

  ipcMain.on('show-setup', () => {
    createSetupWindow();
  });

  screen.on('display-metrics-changed', () => {
    updateWindowBounds();
  });

  mainWindow.on('close', () => {
    logDebug('mainWindow on close');
    if (mainWindow) {
      const pos = mainWindow.getPosition();
      store.set('windowPosition', pos);
    }
  });

  mainWindow.on('closed', () => {
    logDebug('mainWindow on closed');
    mainWindow = null;
  });
}

function registerSetupHandlers() {
  ipcMain.handle('setup:createDesktopShortcut', () => {
    const finalExe = installAppFiles();
    return createDesktopShortcut(finalExe);
  });

  ipcMain.handle('setup:setLaunchAtStartup', (_, value: boolean) => {
    const exePath = installAppFiles();
    configureStartup(value, exePath);
  });

  ipcMain.handle('setup:finish', () => {
    store.set('setupComplete', true);
    const finalExe = installAppFiles();
    createDesktopShortcut(finalExe);
    registerWindowsUninstall(finalExe);
    configureStartup(true, finalExe);
    if (setupWindow) {
      setupWindow.close();
      setupWindow = null;
    }
    createWindow();
  });

  ipcMain.handle('setup:getAppIcon', () => {
    return getLogoDataUrl();
  });

  ipcMain.handle(
    'setup:uninstall',
    (_, options: { removeShortcut: boolean; removeStartup: boolean; removeAppData: boolean }) => {
      if (options.removeShortcut) {
        removeDesktopShortcut();
      }
      if (options.removeStartup) {
        configureStartup(false);
      }
      unregisterWindowsUninstall();
      if (options.removeAppData) {
        store.set('setupComplete', false);
        removeAppData();
      }
      return true;
    }
  );

  ipcMain.handle('setup:finishUninstall', () => {
    if (uninstallWindow) {
      uninstallWindow.close();
      uninstallWindow = null;
    }
    const targetDir = path.join(
      process.env.LOCALAPPDATA || path.join(app.getPath('home'), 'AppData', 'Local'),
      'Programs',
      'DOKIII'
    );
    if (app.isPackaged && fs.existsSync(targetDir)) {
      execFile('cmd.exe', ['/c', 'timeout /t 2 /nobreak >nul && rmdir /s /q "' + targetDir + '"']);
    }
    app.quit();
  });

  ipcMain.handle('setup:showUninstall', () => {
    createUninstallWindow();
  });
}

function registerConfigHandlers() {
  ipcMain.handle('config:get', () => {
    return {
      dock: store.get('dock'),
      enabledWidgets: store.get('enabledWidgets'),
      widgetOrder: store.get('widgetOrder'),
      notes: store.get('notes'),
      profiles: store.get('profiles'),
      activeProfileId: store.get('activeProfileId'),
    };
  });

  ipcMain.handle('config:save', (_, config: Record<string, any>) => {
    for (const [key, value] of Object.entries(config)) {
      store.set(key, value);
    }
    if (config.dock && config.dock.defaultMonitor !== undefined) {
      updateWindowBounds();
    }
  });

  ipcMain.handle('window:setAlwaysOnTop', (_, value: boolean) => {
    if (mainWindow) {
      mainWindow.setAlwaysOnTop(value);
      store.set('dock.alwaysOnTop', value);
    }
  });

  ipcMain.handle('window:setAutoHide', (_, value: boolean) => {
    store.set('dock.autoHide', value);
    if (mainWindow) {
      mainWindow.webContents.send('dock:configChanged', store.get('dock'));
    }
  });

  ipcMain.handle('window:setModalOpen', (_, open: boolean) => {
    isModalOpen = open;
    if (mainWindow) {
      if (open) {
        mainWindow.setSkipTaskbar(false);
        mainWindow.setIgnoreMouseEvents(false);
        mainWindow.setAlwaysOnTop(true);
        mainWindow.moveTop();
        mainWindow.show();
        mainWindow.focus();
      } else {
        mainWindow.setSkipTaskbar(true);
        mainWindow.setIgnoreMouseEvents(true, { forward: true });
        const alwaysOnTop = store.get('dock.alwaysOnTop', false) as boolean;
        mainWindow.setAlwaysOnTop(alwaysOnTop);
      }
    }
  });

  ipcMain.handle('window:setPopoverOpen', (_, open: boolean) => {
    isPopoverOpen = open;
    if (mainWindow) {
      if (open) {
        mainWindow.setIgnoreMouseEvents(false);
      } else if (!isModalOpen) {
        mainWindow.setIgnoreMouseEvents(true, { forward: true });
      }
    }
  });

  ipcMain.handle('window:setIgnoreMouseEvents', (_, ignore: boolean, forward?: boolean) => {
    if (mainWindow && !isModalOpen) {
      mainWindow.setIgnoreMouseEvents(ignore, { forward: forward ?? true });
    }
  });

  ipcMain.handle('window:showWidgetLibrary', () => {
    if (mainWindow) {
      mainWindow.webContents.send('dock:showWidgetLibrary');
    }
  });

  ipcMain.handle('window:showSettings', () => {
    if (mainWindow) {
      mainWindow.webContents.send('dock:showSettings');
    }
  });

  ipcMain.handle('window:hide', () => {
    if (mainWindow) mainWindow.hide();
  });

  ipcMain.handle('app:quit', () => {
    app.quit();
  });
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
logDebug('gotSingleInstanceLock=' + gotSingleInstanceLock);

if (!gotSingleInstanceLock) {
  logDebug('quitting because gotSingleInstanceLock is false');
  app.quit();
} else {
  app.on('second-instance', () => {
    logDebug('second-instance fired');
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.setSkipTaskbar(false);
      mainWindow.setAlwaysOnTop(true);
      mainWindow.moveTop();
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('dock:showApp');
    }
  });

  app.whenReady().then(() => {
    registerSystemHandlers();
    registerFilesystemHandlers();
    registerMediaHandlers();
    registerProcessHandlers();
    registerScreenshotHandlers();
    registerStartupHandlers();
    registerConfigHandlers();
    registerSetupHandlers();

    ipcMain.on('show-uninstall', () => {
      createUninstallWindow();
    });

    ipcMain.on('show-setup', () => {
      createSetupWindow();
    });

    if (process.argv.includes('--uninstall')) {
      createUninstallWindow();
      return;
    }

    if (process.argv.includes('--setup')) {
      createSetupWindow();
      return;
    }

    const targetDir = path.join(
      process.env.LOCALAPPDATA || path.join(app.getPath('home'), 'AppData', 'Local'),
      'Programs',
      'DOKIII'
    );
    const currentExe = getAppExePath();
    const currentDir = path.dirname(currentExe);
    const isRunningFromInstalledDir = currentDir.toLowerCase() === targetDir.toLowerCase();

    const isSetupDone = store.get('setupComplete') as boolean;
    logDebug('whenReady: isSetupDone=' + isSetupDone);
    if (isSetupDone) {
      const finalExe = installAppFiles();
      registerWindowsUninstall(finalExe);
      createWindow();
    } else {
      createSetupWindow();
    }
  });

  app.on('window-all-closed', () => {
    logDebug('window-all-closed fired');
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
