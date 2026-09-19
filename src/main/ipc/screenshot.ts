import { ipcMain, desktopCapturer } from 'electron';
import { exec } from 'child_process';
import { runPowerShell } from '../utils/powershell';
import * as path from 'path';
import * as fs from 'fs';

export function registerScreenshotHandlers() {
  ipcMain.handle('screenshot:capture', async (_, mode: 'full' | 'region' | 'window') => {
    try {
      const screenshotsDir = path.join(process.env.USERPROFILE || '', 'Pictures\\Screenshots');
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
          const png = sources[0].thumbnail.toPNG();
          fs.writeFileSync(filepath, png);
          return filepath;
        }
      }

      if (mode === 'window') {
        const sources = await desktopCapturer.getSources({
          types: ['window'],
          thumbnailSize: { width: 3840, height: 2160 },
        });
        if (sources.length > 0) {
          const png = sources[0].thumbnail.toPNG();
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
