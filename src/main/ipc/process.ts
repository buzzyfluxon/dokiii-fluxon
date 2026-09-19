import { ipcMain, shell } from 'electron';
import { exec } from 'child_process';

export function registerProcessHandlers() {
  ipcMain.handle('process:launchApp', async (_, appPath: string) => {
    try {
      const lower = (appPath || '').toLowerCase();
      if (lower === 'spotify' || lower.includes('spotify')) {
        await shell.openExternal('spotify:');
        return;
      }
      if (lower === 'photos' || lower.includes('photos')) {
        await shell.openExternal('ms-photos:');
        return;
      }
      if (appPath.startsWith('ms-') || appPath.startsWith('shell:') || appPath.includes('://')) {
        await shell.openExternal(appPath);
      } else {
        await shell.openPath(appPath);
      }
    } catch {}
  });

  ipcMain.handle('process:openPath', async (_, targetPath: string) => {
    try {
      const lower = (targetPath || '').toLowerCase();
      if (lower === 'spotify' || lower.includes('spotify')) {
        await shell.openExternal('spotify:');
        return;
      }
      if (lower === 'photos' || lower.includes('photos')) {
        await shell.openExternal('ms-photos:');
        return;
      }
      if (targetPath.startsWith('ms-settings:') || targetPath.startsWith('shell:') || targetPath.startsWith('http')) {
        await shell.openExternal(targetPath);
      } else {
        await shell.openPath(targetPath);
      }
    } catch {}
  });

  ipcMain.handle('process:openUrl', async (_, url: string) => {
    try {
      await shell.openExternal(url);
    } catch {}
  });

  ipcMain.handle('process:runCommand', async (_, command: string) => {
    try {
      const rawCmd = (command || '').trim();
      if (!rawCmd) return 'empty command';
      if (rawCmd.startsWith('start ') || rawCmd.startsWith('ms-') || rawCmd.startsWith('shell:')) {
        const urlOrProto = rawCmd.replace(/^start\s+/, '').trim();
        await shell.openExternal(urlOrProto);
        return 'success';
      }
      const cmd = rawCmd.toLowerCase();
      let target = '';
      if (cmd.includes('photos')) target = 'ms-photos:';
      else if (cmd.includes('chrome')) target = 'chrome';
      else if (cmd.includes('edge')) target = 'msedge';
      else if (cmd.includes('downloads')) target = 'shell:downloads';
      else if (cmd.includes('document')) target = 'shell:Personal';
      else if (cmd.includes('picture')) target = 'shell:My Pictures';
      else if (cmd.includes('recycle')) target = 'shell:RecycleBinFolder';
      else if (cmd.includes('settings')) target = 'ms-settings:';
      else if (cmd.includes('storage')) target = 'ms-settings:storagesense';
      else if (cmd.includes('calculator') || cmd === 'calc') target = 'calc';
      else if (cmd.includes('notepad')) target = 'notepad';
      else if (cmd.includes('task manager') || cmd === 'taskmgr') target = 'taskmgr';
      else if (cmd.includes('terminal') || cmd.includes('powershell')) target = 'wt';
      else if (cmd.includes('cmd')) target = 'cmd';
      else if (cmd.includes('control panel')) target = 'control';
      else if (cmd.includes('explorer')) target = 'explorer';
      else if (cmd.includes('store')) target = 'ms-windows-store:';
      else if (cmd === 'lock') {
        exec('rundll32.exe user32.dll,LockWorkStation');
        return 'success';
      }

      if (target) {
        if (target.startsWith('ms-') || target.startsWith('shell:')) {
          await shell.openExternal(target);
        } else {
          exec(`start "" "${target}"`);
        }
        return 'success';
      }
      exec(rawCmd);
      return 'success';
    } catch {
      return 'error';
    }
  });
}
