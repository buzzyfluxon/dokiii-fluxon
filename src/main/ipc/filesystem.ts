import { app, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export function registerFilesystemHandlers() {
  ipcMain.handle('filesystem:getRecentItems', async () => {
    try {
      const recentPath = path.join(process.env.APPDATA || '', 'Microsoft\\Windows\\Recent');
      if (!fs.existsSync(recentPath)) return [];
      const files = fs.readdirSync(recentPath)
        .filter(f => f.toLowerCase().endsWith('.lnk'))
        .map(f => {
          try {
            const filePath = path.join(recentPath, f);
            const stat = fs.statSync(filePath);
            let targetPath = filePath;
            try {
              const link = shell.readShortcutLink(filePath);
              if (link && link.target) targetPath = link.target;
            } catch {}
            return {
              name: path.basename(f, '.lnk'),
              path: targetPath,
              modified: stat.mtimeMs
            };
          } catch {
            return null;
          }
        })
        .filter((f): f is NonNullable<typeof f> => f !== null)
        .sort((a, b) => b.modified - a.modified)
        .slice(0, 20);
      return files;
    } catch {
      return [];
    }
  });

  ipcMain.handle('filesystem:getDownloads', async () => {
    try {
      const downloadsPath = app.getPath('downloads');
      if (!fs.existsSync(downloadsPath)) return [];
      const files = fs.readdirSync(downloadsPath)
        .map(f => {
          const filePath = path.join(downloadsPath, f);
          try {
            const stat = fs.statSync(filePath);
            return {
              name: f,
              path: filePath,
              size: stat.size,
              modified: stat.mtimeMs
            };
          } catch {
            return null;
          }
        })
        .filter((f): f is NonNullable<typeof f> => f !== null && fs.statSync(f.path).isFile())
        .sort((a, b) => b.modified - a.modified)
        .slice(0, 20);
      return files;
    } catch {
      return [];
    }
  });

  ipcMain.handle('filesystem:getRecentScreenshots', async () => {
    try {
      const screenshotsPath = path.join(app.getPath('pictures'), 'Screenshots');
      if (!fs.existsSync(screenshotsPath)) return [];
      const files = fs.readdirSync(screenshotsPath)
        .map(f => {
          const filePath = path.join(screenshotsPath, f);
          try {
            const stat = fs.statSync(filePath);
            return {
              name: f,
              path: filePath,
              modified: stat.mtimeMs
            };
          } catch {
            return null;
          }
        })
        .filter((f): f is NonNullable<typeof f> => f !== null && fs.statSync(f.path).isFile())
        .sort((a, b) => b.modified - a.modified)
        .slice(0, 10);
      return files;
    } catch {
      return [];
    }
  });

  ipcMain.handle('filesystem:searchFiles', async (_, query: string) => {
    if (!query) return [];
    try {
      const q = query.toLowerCase();
      const results: {name: string, path: string, type: string}[] = [];
      const searchDirs = [
        app.getPath('downloads'),
        app.getPath('desktop'),
        app.getPath('documents'),
        path.join(process.env.ProgramData || '', 'Microsoft\\Windows\\Start Menu\\Programs')
      ];

      const searchAsync = async (dir: string, depth: number): Promise<void> => {
        if (depth > 2) return;
        if (results.length >= 20) return;
        let files: string[];
        try {
          files = await fs.promises.readdir(dir);
        } catch {
          return;
        }
        for (const file of files) {
          if (results.length >= 20) return;
          const filePath = path.join(dir, file);
          try {
            const stat = await fs.promises.stat(filePath);
            if (stat.isDirectory()) {
              await searchAsync(filePath, depth + 1);
            } else if (file.toLowerCase().includes(q)) {
              results.push({
                name: file,
                path: filePath,
                type: path.extname(file).toLowerCase() === '.lnk' ? 'app' : 'file'
              });
            }
          } catch {}
        }
      };

      for (const dir of searchDirs) {
        await searchAsync(dir, 0);
        if (results.length >= 20) break;
      }
      return results;
    } catch {
      return [];
    }
  });

  ipcMain.handle('filesystem:getScreenshotsDir', () => {
    return path.join(app.getPath('pictures'), 'Screenshots');
  });
}
