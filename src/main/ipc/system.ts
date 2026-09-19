import { app, ipcMain, shell, dialog } from 'electron';
import { runPowerShell } from '../utils/powershell';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

let prevCpus = os.cpus();
let cachedSsd = 50;
let lastSsdTime = 0;
let cachedBattery = { percent: 100, isCharging: true, hasBattery: true };
let lastBatteryTime = 0;
let cachedVolume = 75;
let cachedMute = false;
let lastAudioTime = 0;

function getCpuUsagePercent(): number {
  const currentCpus = os.cpus();
  let idleDifference = 0;
  let totalDifference = 0;
  for (let i = 0; i < currentCpus.length; i++) {
    const prev = prevCpus[i]?.times || { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 };
    const curr = currentCpus[i].times;
    const idle = curr.idle - prev.idle;
    const total =
      curr.user - prev.user +
      curr.nice - prev.nice +
      curr.sys - prev.sys +
      curr.irq - prev.irq +
      idle;
    idleDifference += idle;
    totalDifference += total;
  }
  prevCpus = currentCpus;
  if (totalDifference <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((totalDifference - idleDifference) / totalDifference) * 100)));
}

function getSsdUsagePercent(): number {
  try {
    const s = fs.statfsSync('C:\\');
    if (s && s.blocks > 0) {
      cachedSsd = Math.max(0, Math.min(100, Math.round(((s.blocks - s.bavail) / s.blocks) * 100)));
    }
  } catch {}
  return cachedSsd;
}

const AUDIO_CMD_DEF = `
if (-not ([System.Management.Automation.PSTypeName]'DokiiiAudio').Type) {
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioEndpointVolume {
    int f(); int g(); int h(); int i();
    int SetMasterVolumeLevelScalar(float fLevel, Guid pguidEventContext);
    int j();
    int GetMasterVolumeLevelScalar(out float pfLevel);
    int k(); int l(); int m(); int n();
    int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, Guid pguidEventContext);
    int GetMute(out bool pbMute);
}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDevice {
    int Activate(ref Guid id, int clsCtx, int activationParams, out IAudioEndpointVolume aev);
}
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDeviceEnumerator {
    int f();
    int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint);
}
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
public class MMDeviceEnumeratorComObject {}
public class DokiiiAudio {
    public static float GetMasterVolume() {
        var enumerator = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
        IMMDevice dev = null;
        enumerator.GetDefaultAudioEndpoint(0, 1, out dev);
        IAudioEndpointVolume epv = null;
        var epvid = typeof(IAudioEndpointVolume).GUID;
        dev.Activate(ref epvid, 23, 0, out epv);
        float v = -1;
        epv.GetMasterVolumeLevelScalar(out v);
        return v;
    }
    public static void SetMasterVolume(float v) {
        var enumerator = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
        IMMDevice dev = null;
        enumerator.GetDefaultAudioEndpoint(0, 1, out dev);
        IAudioEndpointVolume epv = null;
        var epvid = typeof(IAudioEndpointVolume).GUID;
        dev.Activate(ref epvid, 23, 0, out epv);
        epv.SetMasterVolumeLevelScalar(v, Guid.Empty);
    }
    public static bool GetMute() {
        var enumerator = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
        IMMDevice dev = null;
        enumerator.GetDefaultAudioEndpoint(0, 1, out dev);
        IAudioEndpointVolume epv = null;
        var epvid = typeof(IAudioEndpointVolume).GUID;
        dev.Activate(ref epvid, 23, 0, out epv);
        bool m = false;
        epv.GetMute(out m);
        return m;
    }
    public static void SetMute(bool m) {
        var enumerator = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
        IMMDevice dev = null;
        enumerator.GetDefaultAudioEndpoint(0, 1, out dev);
        IAudioEndpointVolume epv = null;
        var epvid = typeof(IAudioEndpointVolume).GUID;
        dev.Activate(ref epvid, 23, 0, out epv);
        epv.SetMute(m, Guid.Empty);
    }
}
"@
}
`;

function expandEnv(str: string): string {
  if (!str) return str;
  return str.replace(/%([^%]+)%/g, (_, n) => process.env[n] || `%${n}%`);
}

function cleanIconPath(iconPath: string): string {
  if (!iconPath) return '';
  const cleaned = expandEnv(iconPath.trim());
  const commaIdx = cleaned.lastIndexOf(',');
  if (commaIdx > 0) {
    const candidate = cleaned.substring(0, commaIdx).trim();
    if (fs.existsSync(candidate)) return candidate;
  }
  return cleaned;
}

async function resolveIconForPath(filePath: string): Promise<string | undefined> {
  try {
    let target = filePath;
    if (filePath.toLowerCase().endsWith('.lnk')) {
      try {
        const link = shell.readShortcutLink(filePath);
        const resolvedTarget = link.target ? expandEnv(link.target) : '';
        const resolvedIcon = link.icon ? cleanIconPath(link.icon) : '';

        if (resolvedTarget && fs.existsSync(resolvedTarget)) {
          target = resolvedTarget;
        } else if (resolvedIcon && fs.existsSync(resolvedIcon)) {
          target = resolvedIcon;
        } else {
          return undefined;
        }
      } catch {
        return undefined;
      }
    }

    if (fs.existsSync(target) && !target.toLowerCase().endsWith('.lnk')) {
      const nativeIcon = await app.getFileIcon(target, { size: 'large' });
      return nativeIcon.toDataURL();
    }
  } catch {}
  return undefined;
}

let cachedBinCount = 0;
let lastBinCountTime = 0;
let batteryCheckCount = 0;

export function registerSystemHandlers() {
  ipcMain.handle('system:getStorageInfo', async () => {
    try {
      const drives: { drive: string; total: number; used: number; free: number }[] = [];
      const candidateLetters = ['C', 'D', 'E', 'F', 'G', 'H', 'Z'];
      for (const letter of candidateLetters) {
        try {
          const rootPath = `${letter}:\\`;
          if (fs.existsSync(rootPath)) {
            const s = fs.statfsSync(rootPath);
            const total = s.blocks * s.bsize;
            const free = s.bavail * s.bsize;
            const used = total - free;
            if (total > 0) {
              drives.push({ drive: letter, total, used, free });
            }
          }
        } catch {}
      }
      return drives;
    } catch {
      return [];
    }
  });

  ipcMain.handle('system:getRecycleBinCount', async () => {
    const now = Date.now();
    if (now - lastBinCountTime < 45000) {
      return cachedBinCount;
    }
    lastBinCountTime = now;
    try {
      const script = `(New-Object -ComObject Shell.Application).NameSpace(10).Items().Count`;
      const output = await runPowerShell(script, 3000);
      const count = parseInt(output, 10);
      if (!isNaN(count)) cachedBinCount = count;
    } catch {}
    return cachedBinCount;
  });

  ipcMain.handle('system:emptyRecycleBin', async () => {
    cachedBinCount = 0;
    lastBinCountTime = Date.now();
    await runPowerShell(`Clear-RecycleBin -Force -ErrorAction SilentlyContinue`, 3000);
  });

  ipcMain.handle('system:openRecycleBin', async () => {
    lastBinCountTime = 0;
    await shell.openExternal('shell:RecycleBinFolder');
  });

  ipcMain.handle('system:getInstalledApps', async () => {
    try {
      const paths = [
        path.join(process.env.ProgramData || 'C:\\ProgramData', 'Microsoft\\Windows\\Start Menu\\Programs'),
        path.join(process.env.APPDATA || '', 'Microsoft\\Windows\\Start Menu\\Programs'),
      ];

      const apps: { name: string; path: string; shortcutPath: string }[] = [];

      const walkSync = (dir: string) => {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          try {
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
              walkSync(filePath);
            } else if (filePath.toLowerCase().endsWith('.lnk')) {
              let targetPath = filePath;
              try {
                const link = shell.readShortcutLink(filePath);
                if (link.target) {
                  targetPath = expandEnv(link.target);
                }
              } catch {}
              apps.push({
                name: path.basename(file, '.lnk'),
                path: targetPath,
                shortcutPath: filePath,
              });
            }
          } catch {}
        }
      };

      paths.forEach((p) => walkSync(p));

      const uniqueApps = Array.from(new Map(apps.map((a) => [a.name, a])).values());
      uniqueApps.sort((a, b) => a.name.localeCompare(b.name));
      const sliced = uniqueApps.slice(0, 100);

      const appsWithIcons = await Promise.all(
        sliced.map(async (item) => {
          let iconData: string | undefined;
          try {
            iconData = await resolveIconForPath(item.shortcutPath);
            if (!iconData && item.path) {
              iconData = await resolveIconForPath(item.path);
            }
          } catch {}
          return {
            name: item.name,
            path: item.path,
            icon: iconData,
          };
        })
      );

      return appsWithIcons;
    } catch {
      return [];
    }
  });

  ipcMain.handle('system:selectAppFile', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Select Application to Add to Dock',
        properties: ['openFile'],
        filters: [
          { name: 'Applications', extensions: ['exe', 'lnk', 'bat', 'cmd'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const name = path.basename(filePath, path.extname(filePath));
        let iconData: string | undefined;
        try {
          iconData = await resolveIconForPath(filePath);
        } catch {}
        return { name, path: filePath, icon: iconData };
      }
      return null;
    } catch {
      return null;
    }
  });

  ipcMain.handle('system:getAppIcon', async (_, filePath: string) => {
    try {
      if (!filePath) return null;
      const icon = await resolveIconForPath(filePath);
      return icon || null;
    } catch {
      return null;
    }
  });

  ipcMain.handle('system:getSystemMetrics', async () => {
    const cpu = getCpuUsagePercent();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const ram = Math.round(((totalMem - freeMem) / totalMem) * 100);
    const ssd = getSsdUsagePercent();
    return { cpu, ram, ssd };
  });

  ipcMain.handle('system:getBatteryStatus', async () => {
    const now = Date.now();
    if (!cachedBattery.hasBattery && batteryCheckCount > 1) {
      return cachedBattery;
    }
    if (now - lastBatteryTime < 45000) {
      return cachedBattery;
    }
    batteryCheckCount++;
    lastBatteryTime = now;
    try {
      const script = `Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue | Select-Object EstimatedChargeRemaining, BatteryStatus | ConvertTo-Json`;
      const out = await runPowerShell(script, 3000);
      if (out) {
        const parsed = JSON.parse(out);
        const b = Array.isArray(parsed) ? parsed[0] : parsed;
        if (b && typeof b.EstimatedChargeRemaining === 'number') {
          const isCharging = b.BatteryStatus === 2 || b.BatteryStatus === 6 || b.BatteryStatus === 7 || b.BatteryStatus === 8;
          cachedBattery = {
            percent: Math.min(100, Math.max(0, b.EstimatedChargeRemaining)),
            isCharging,
            hasBattery: true,
          };
        }
      } else {
        cachedBattery = { percent: 100, isCharging: true, hasBattery: false };
      }
    } catch {
      cachedBattery = { percent: 100, isCharging: true, hasBattery: false };
    }
    return cachedBattery;
  });

  ipcMain.handle('system:getAudioVolume', async () => {
    const now = Date.now();
    if (now - lastAudioTime < 15000) {
      return { volume: cachedVolume, isMuted: cachedMute };
    }
    lastAudioTime = now;
    try {
      const script = `${AUDIO_CMD_DEF}
$v = [DokiiiAudio]::GetMasterVolume()
$m = [DokiiiAudio]::GetMute()
Write-Output "$v;$m"`;
      const out = await runPowerShell(script, 3000);
      if (out && out.includes(';')) {
        const [vStr, mStr] = out.split(';');
        const v = parseFloat(vStr);
        if (!isNaN(v)) {
          cachedVolume = Math.round(v * 100);
        }
        cachedMute = mStr.trim().toLowerCase() === 'true';
      }
    } catch {}
    return { volume: cachedVolume, isMuted: cachedMute };
  });

  ipcMain.handle('system:setAudioVolume', async (_, volume: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(volume)));
    cachedVolume = clamped;
    lastAudioTime = Date.now();
    const scalar = clamped / 100;
    try {
      const script = `${AUDIO_CMD_DEF}
[DokiiiAudio]::SetMasterVolume(${scalar.toFixed(3)})`;
      runPowerShell(script, 3000);
    } catch {}
    return { volume: cachedVolume, isMuted: cachedMute };
  });

  ipcMain.handle('system:toggleAudioMute', async () => {
    cachedMute = !cachedMute;
    lastAudioTime = Date.now();
    try {
      const script = `(New-Object -ComObject WScript.Shell).SendKeys([char]173)`;
      runPowerShell(script, 2000);
    } catch {}
    return cachedMute;
  });
}
