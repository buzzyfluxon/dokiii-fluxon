import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { shell } from 'electron';

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
      const downloadsPath = path.join(process.env.USERPROFILE || '', 'Downloads');
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
      const screenshotsPath = path.join(process.env.USERPROFILE || '', 'Pictures\\Screenshots');
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
        path.join(process.env.USERPROFILE || '', 'Downloads'),
        path.join(process.env.USERPROFILE || '', 'Desktop'),
        path.join(process.env.USERPROFILE || '', 'Documents'),
        path.join(process.env.ProgramData || '', 'Microsoft\\Windows\\Start Menu\\Programs')
      ];
      
      const searchSync = (dir: string, depth: number) => {
        if (depth > 2) return;
        if (!fs.existsSync(dir)) return;
        try {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            if (results.length >= 20) return;
            const filePath = path.join(dir, file);
            try {
              const stat = fs.statSync(filePath);
              if (stat.isDirectory()) {
                searchSync(filePath, depth + 1);
              } else if (file.toLowerCase().includes(q)) {
                results.push({
                  name: file,
                  path: filePath,
                  type: path.extname(file).toLowerCase() === '.lnk' ? 'app' : 'file'
                });
              }
            } catch {}
          }
        } catch {}
      };

      for (const dir of searchDirs) {
        searchSync(dir, 0);
        if (results.length >= 20) break;
      }
      return results;
    } catch {
      return [];
    }
  });

  ipcMain.handle('filesystem:getScreenshotsDir', () => {
    return path.join(process.env.USERPROFILE || '', 'Pictures\\Screenshots');
  });
}
