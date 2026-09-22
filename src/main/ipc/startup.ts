import { ipcMain, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

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

export function registerStartupHandlers() {
  ipcMain.handle('startup:setLaunchAtStartup', (_, value: boolean) => {
    const exePath = process.execPath;
    // Only ever use a single autostart mechanism. Previously we registered
    // BOTH app.setLoginItemSettings AND a manual Startup-folder shortcut,
    // which caused Windows to launch two instances of DOKIII on login.
    // The second instance would hit the single-instance lock and emit
    // 'second-instance' in the first, which auto-opened the Home screen
    // right after boot. Registering only the login item fixes that.
    app.setLoginItemSettings({
      openAtLogin: value,
      path: exePath,
      args: ['--startup'],
    });

    // Clean up any legacy manual shortcut left over from older installs so
    // it can't cause a duplicate launch on the next reboot.
    const lnk = getStartupShortcutPath();
    if (fs.existsSync(lnk)) {
      try {
        fs.unlinkSync(lnk);
      } catch {}
    }
  });

  ipcMain.handle('startup:getLaunchAtStartup', () => {
    return app.getLoginItemSettings({ path: process.execPath }).openAtLogin;
  });
}
