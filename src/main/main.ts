import { app, BrowserWindow, screen, ipcMain, nativeImage, NativeImage, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import Store from 'electron-store';
import { registerSystemHandlers } from './ipc/system';
import { registerFilesystemHandlers } from './ipc/filesystem';
import { registerMediaHandlers } from './ipc/media';
import { registerProcessHandlers } from './ipc/process';
import { registerScreenshotHandlers } from './ipc/screenshot';
import { registerWallpaperHandlers, cleanupWallpaperWatcher } from './ipc/wallpaper';
import { initAutoUpdater, cleanupAutoUpdater } from './updater';
import { killAllPowerShell } from './utils/powershell';
import { PROFILE, instrumentIpc, startProfiler } from './utils/profiler';
import { createTray } from './tray';
import { DOKIII_ICON_DATA_URL } from './utils/icon';
import { DEFAULT_DOCK_CONFIG, DEFAULT_ENABLED_WIDGETS, DEFAULT_PROFILES, WIDGET_REGISTRY } from '../shared/constants';

instrumentIpc();

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
  isQuitting = true;
  cleanupWallpaperWatcher();
  cleanupAutoUpdater();
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
  },
});

let mainWindow: BrowserWindow | null = null;
let tray: any = null;
let isModalOpen = false;
let isPopoverOpen = false;
let isQuitting = false;

function getPackagedBuildDir(): string | null {
  if (!app.isPackaged) return null;
  const dir = path.join(process.resourcesPath, 'build');
  return fs.existsSync(dir) ? dir : null;
}

function getAppNativeIcon(): NativeImage {
  const packagedBuildDir = getPackagedBuildDir();
  if (packagedBuildDir) {
    const packagedIco = path.join(packagedBuildDir, 'icon.ico');
    if (fs.existsSync(packagedIco)) {
      return nativeImage.createFromPath(packagedIco);
    }
    const packagedPng = path.join(packagedBuildDir, 'icon.png');
    if (fs.existsSync(packagedPng)) {
      return nativeImage.createFromPath(packagedPng);
    }
  }
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
  const distLogoDir = path.join(__dirname, '..', 'renderer', 'assets');
  if (fs.existsSync(distLogoDir)) {
    const files = fs.readdirSync(distLogoDir);
    const logoFile = files.find((f: string) => f.startsWith('dokiii-logo'));
    if (logoFile) {
      return nativeImage.createFromPath(path.join(distLogoDir, logoFile));
    }
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

function findUninstallerExe(): string | null {
  const installDir = path.dirname(process.execPath);
  const candidates = [
    path.join(installDir, 'Uninstall DOKIII.exe'),
    path.join(installDir, 'Uninstall.exe'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function openWindowsAppSettings(): void {
  shell.openExternal('ms-settings:appsfeatures');
}

function shutdownForUninstall(): void {
  isQuitting = true;
  logDebug('shutting down for uninstall');
  try {
    cleanupWallpaperWatcher();
    cleanupAutoUpdater();
    killAllPowerShell();
  } catch {}
  try {
    tray?.destroy();
    tray = null;
  } catch {}
  try {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();
  } catch {}
  app.exit(0);
}

function launchUninstaller(): void {
  const uninstallerExe = findUninstallerExe();
  if (!uninstallerExe) {
    openWindowsAppSettings();
    return;
  }

  try {
    const child = spawn(uninstallerExe, [], { detached: true, stdio: 'ignore' });
    child.once('error', (err) => {
      logDebug('failed to start uninstaller: ' + (err?.stack || err));
      openWindowsAppSettings();
    });
    child.once('spawn', () => {
      child.unref();
      shutdownForUninstall();
    });
  } catch (err: any) {
    logDebug('failed to start uninstaller: ' + (err?.stack || err));
    openWindowsAppSettings();
  }
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
    mainWindow.loadFile(
      path.join(__dirname, '..', 'renderer', 'index.html'),
      PROFILE ? { query: { profile: '1' } } : undefined
    );
  }

  startProfiler(() => mainWindow);

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

  mainWindow.webContents.on('did-finish-load', () => {
    logDebug('did-finish-load fired');
    if (mainWindow) {
      mainWindow.setSkipTaskbar(true);
      mainWindow.show();
    }
  });

  tray = createTray(mainWindow, () => Boolean(store.get('dock.autoHide', false)));

  ipcMain.on('app:ready', () => {
    logDebug('app:ready received');
  });

  ipcMain.on('show-uninstall', () => {
    launchUninstaller();
  });

  screen.on('display-metrics-changed', () => {
    updateWindowBounds();
  });

  mainWindow.on('close', (event) => {
    logDebug('mainWindow on close');
    if (mainWindow) {
      const pos = mainWindow.getPosition();
      store.set('windowPosition', pos);
    }
    if (!isQuitting) {
      event.preventDefault();
      if (isModalOpen && mainWindow) {
        mainWindow.webContents.send('dock:closeApp');
      } else if (mainWindow) {
        mainWindow.hide();
      }
    }
  });

  mainWindow.on('closed', () => {
    logDebug('mainWindow on closed');
    mainWindow = null;
  });
}

function getLaunchOnStartup(): boolean {
  return app.getLoginItemSettings({ args: ['--startup'] }).openAtLogin;
}

function setLaunchOnStartup(enabled: boolean): boolean {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: process.execPath,
      args: ['--startup'],
    });
  } catch (err: any) {
    logDebug('failed to set login item settings: ' + (err?.stack || err));
  }
  return getLaunchOnStartup();
}

function registerSetupHandlers() {
  ipcMain.handle('setup:showUninstall', () => {
    launchUninstaller();
  });
}

function registerConfigHandlers() {
  ipcMain.handle('window:getDisplays', () => {
    const displays = screen.getAllDisplays();
    const primaryId = screen.getPrimaryDisplay().id;
    return displays.map((display, index) => ({
      index,
      id: display.id,
      isPrimary: display.id === primaryId,
      width: display.bounds.width,
      height: display.bounds.height,
    }));
  });

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
        mainWindow.setAlwaysOnTop(false);
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

  ipcMain.handle('app:getLaunchOnStartup', () => {
    return getLaunchOnStartup();
  });

  ipcMain.handle('app:setLaunchOnStartup', (_, enabled: boolean) => {
    return setLaunchOnStartup(enabled);
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
  const launchedAtStartup = process.argv.includes('--startup');
  const appLaunchTime = Date.now();
  const STARTUP_GRACE_MS = 8000;

  app.on('second-instance', () => {
    logDebug('second-instance fired');
    if (launchedAtStartup && Date.now() - appLaunchTime < STARTUP_GRACE_MS) {
      logDebug('second-instance ignored: within startup grace period');
      return;
    }
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
    registerConfigHandlers();
    registerSetupHandlers();
    registerWallpaperHandlers(() => mainWindow);
    initAutoUpdater(() => mainWindow);

    createWindow();
  });

  app.on('window-all-closed', () => {
    logDebug('window-all-closed fired');
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
