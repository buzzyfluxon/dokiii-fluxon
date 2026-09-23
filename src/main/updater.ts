import { app, ipcMain, BrowserWindow } from 'electron';
import Store from 'electron-store';
import { autoUpdater } from 'electron-updater';
import * as fs from 'fs';
import * as path from 'path';

export type UpdaterStatus =
  | { status: 'idle' }
  | { status: 'checking'; isManual: boolean }
  | { status: 'available'; version: string; isManual: boolean }
  | { status: 'not-available'; isManual: boolean }
  | { status: 'downloading'; version: string; percent: number }
  | { status: 'downloaded'; version: string }
  | { status: 'error'; message: string; phase: 'check' | 'download'; isManual: boolean };

const CHECK_DELAY_MS = 10000;
const CHECK_INTERVAL_MS = 12 * 60 * 60 * 1000;
const logPath = path.join(process.env.APPDATA || '', 'dokiii', 'debug.log');

function logUpdater(msg: string) {
  try {
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] [updater] ${msg}\n`);
  } catch {}
}

let updaterStore: Store<{ dismissedVersion: string }> | null = null;
let getWindow: (() => BrowserWindow | null) | null = null;
let currentStatus: UpdaterStatus = { status: 'idle' };
let isBusy = false;
let isDownloading = false;
let pendingManual = false;
let pendingVersion = '';
let startupTimeout: NodeJS.Timeout | null = null;
let intervalHandle: NodeJS.Timeout | null = null;

function broadcast(status: UpdaterStatus) {
  currentStatus = status;
  const win = getWindow?.();
  if (win && !win.isDestroyed()) {
    win.webContents.send('updater:status', status);
  }
}

function getDismissedVersion(): string {
  return updaterStore?.get('dismissedVersion', '') || '';
}

function attachAutoUpdaterListeners() {
  autoUpdater.on('checking-for-update', () => {
    logUpdater('checking-for-update');
    broadcast({ status: 'checking', isManual: pendingManual });
  });

  autoUpdater.on('update-available', (info) => {
    logUpdater(`update-available version=${info.version}`);
    isBusy = false;
    pendingVersion = info.version;
    if (!pendingManual && getDismissedVersion() === info.version) {
      currentStatus = { status: 'idle' };
      return;
    }
    broadcast({ status: 'available', version: info.version, isManual: pendingManual });
  });

  autoUpdater.on('update-not-available', (info) => {
    logUpdater(`update-not-available currentVersion=${info?.version || 'unknown'}`);
    isBusy = false;
    broadcast({ status: 'not-available', isManual: pendingManual });
  });

  autoUpdater.on('error', (err) => {
    logUpdater(`error: ${err?.message || err}${err?.stack ? '\n' + err.stack : ''}`);
    isBusy = false;
    const phase = isDownloading ? 'download' : 'check';
    isDownloading = false;
    broadcast({
      status: 'error',
      message: err?.message || 'Something went wrong.',
      phase,
      isManual: pendingManual,
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    broadcast({
      status: 'downloading',
      version: pendingVersion,
      percent: Math.max(0, Math.min(100, Math.round(progress.percent))),
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    logUpdater(`update-downloaded version=${info.version}`);
    isBusy = false;
    isDownloading = false;
    broadcast({ status: 'downloaded', version: info.version });
  });
}

function runCheck(manual: boolean) {
  if (!app.isPackaged) {
    broadcast({ status: 'not-available', isManual: manual });
    return;
  }
  if (isBusy || isDownloading) return;
  isBusy = true;
  pendingManual = manual;
  logUpdater(`runCheck manual=${manual} currentVersion=${app.getVersion()}`);
  autoUpdater.checkForUpdates().catch((err) => {
    logUpdater(`checkForUpdates rejected: ${err?.message || err}${err?.stack ? '\n' + err.stack : ''}`);
    isBusy = false;
    broadcast({
      status: 'error',
      message: err?.message || 'Could not check for updates.',
      phase: 'check',
      isManual: manual,
    });
  });
}

export function initAutoUpdater(windowGetter: () => BrowserWindow | null) {
  getWindow = windowGetter;
  const packaged = app.isPackaged;
  logUpdater(`initAutoUpdater packaged=${packaged} version=${app.getVersion()}`);

  if (packaged) {
    updaterStore = new Store<{ dismissedVersion: string }>({
      name: 'dokiii-updater',
      defaults: { dismissedVersion: '' },
    });
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'buzzyfluxon',
      repo: 'dokiii-fluxon',
    });
    attachAutoUpdaterListeners();
  }

  ipcMain.handle('updater:check', (_e, opts?: { manual?: boolean }) => {
    runCheck(Boolean(opts?.manual));
  });

  ipcMain.handle('updater:download', () => {
    if (!packaged) return;
    if (currentStatus.status !== 'available' || isDownloading) return;
    isDownloading = true;
    autoUpdater.downloadUpdate().catch((err) => {
      isDownloading = false;
      broadcast({
        status: 'error',
        message: err?.message || 'Could not download the update.',
        phase: 'download',
        isManual: false,
      });
    });
  });

  ipcMain.handle('updater:install', () => {
    if (!packaged) return;
    if (currentStatus.status !== 'downloaded') return;
    autoUpdater.quitAndInstall(false, true);
  });

  ipcMain.handle('updater:dismiss', (_e, version: string) => {
    if (packaged && version) {
      updaterStore?.set('dismissedVersion', version);
    }
    currentStatus = { status: 'idle' };
  });

  ipcMain.handle('updater:getStatus', () => currentStatus);

  if (packaged) {
    startupTimeout = setTimeout(() => runCheck(false), CHECK_DELAY_MS);
    intervalHandle = setInterval(() => runCheck(false), CHECK_INTERVAL_MS);
  }
}

export function cleanupAutoUpdater() {
  if (startupTimeout) clearTimeout(startupTimeout);
  if (intervalHandle) clearInterval(intervalHandle);
  startupTimeout = null;
  intervalHandle = null;
}
