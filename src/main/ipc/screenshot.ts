import { ipcMain, desktopCapturer, app, screen } from 'electron';
import { exec } from 'child_process';
import { runPowerShell } from '../utils/powershell';
import * as path from 'path';
import * as fs from 'fs';

const OWN_WINDOW_TITLES = new Set(['DOKIII', 'DOKIII Setup', 'Uninstall DOKIII']);

export function registerScreenshotHandlers() {
  ipcMain.handle('screenshot:capture', async (_, mode: 'full' | 'region' | 'window') => {
    try {
      const screenshotsDir = path.join(app.getPath('pictures'), 'Screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      if (mode === 'region') {
        exec('start ms-screenclip:');
        return '';
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `Screenshot-${timestamp}.png`;
      const filepath = path.join(screenshotsDir, filename);

      if (mode === 'full') {
        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: 3840, height: 2160 },
        });
        if (sources.length > 0) {
          const activeDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
          const match = sources.find((s) => s.display_id && String(activeDisplay.id) === s.display_id);
          const chosen = match || sources[0];
          const png = chosen.thumbnail.toPNG();
          fs.writeFileSync(filepath, png);
          return filepath;
        }
      }

      if (mode === 'window') {
        const sources = await desktopCapturer.getSources({
          types: ['window'],
          thumbnailSize: { width: 3840, height: 2160 },
        });
        const candidates = sources.filter((s) => !OWN_WINDOW_TITLES.has(s.name));
        if (candidates.length > 0) {
          let chosen = candidates[0];
          try {
            const script = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class DokiiiWin32 {
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")]
  public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
}
"@
$hwnd = [DokiiiWin32]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 256
[DokiiiWin32]::GetWindowText($hwnd, $sb, 256) | Out-Null
$sb.ToString()
`;
            const foregroundTitle = (await runPowerShell(script, 3000)).trim();
            if (foregroundTitle) {
              const match = candidates.find((s) => s.name === foregroundTitle);
              if (match) chosen = match;
            }
          } catch {}
          const png = chosen.thumbnail.toPNG();
          fs.writeFileSync(filepath, png);
          return filepath;
        }
      }

      const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap $bounds.width, $bounds.height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.size)
$bitmap.Save('${filepath}', [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
`;
      await runPowerShell(script);
      return fs.existsSync(filepath) ? filepath : '';
    } catch {
      return '';
    }
  });
}
