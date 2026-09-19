import { ipcMain, app, shell } from 'electron';
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
    const targetExe = path.join(
      process.env.LOCALAPPDATA || '',
      'Programs',
      'DOKIII',
      'DOKIII.exe'
    );
    const exePath = fs.existsSync(targetExe) ? targetExe : process.execPath;
    app.setLoginItemSettings({
      openAtLogin: value,
      path: exePath,
      args: ['--startup'],
    });
    const lnk = getStartupShortcutPath();
    if (value) {
      const mode = fs.existsSync(lnk) ? 'replace' : 'create';
      shell.writeShortcutLink(lnk, mode, {
        target: exePath,
        cwd: path.dirname(exePath),
        args: '--startup',
        description: 'DOKIII Desktop Dock',
        icon: exePath,
        iconIndex: 0,
      });
    } else {
      if (fs.existsSync(lnk)) {
        try {
          fs.unlinkSync(lnk);
        } catch {}
      }
    }
  });

  ipcMain.handle('startup:getLaunchAtStartup', () => {
    const lnk = getStartupShortcutPath();
    if (fs.existsSync(lnk)) return true;
    return app.getLoginItemSettings({ path: process.execPath }).openAtLogin;
  });
}
