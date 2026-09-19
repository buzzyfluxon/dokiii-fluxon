import { ipcMain, BrowserWindow, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export interface RegionSample {
  r: number;
  g: number;
  b: number;
  luminance: number;
  isLight: boolean;
  tintR: number;
  tintG: number;
  tintB: number;
  alpha: number;
  bgRgba: string;
  borderColor: string;
  boxShadow: string;
  highlightColor: string;
}

export interface WallpaperPalette {
  dominant: RegionSample;
  dockBottom: RegionSample;
  dockLeft: RegionSample;
  dockRight: RegionSample;
  halo: RegionSample;
  desktopWidgets: RegionSample;
  modal: RegionSample;
  timestamp: number;
}

let cachedMtime = -1;
let cachedPalette: WallpaperPalette | null = null;
let watcher: fs.FSWatcher | null = null;
let debounceTimeout: NodeJS.Timeout | null = null;

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function deriveGlassStyle(avgR: number, avgG: number, avgB: number, isModal = false): RegionSample {
  const luminance = Math.round(0.299 * avgR + 0.587 * avgG + 0.114 * avgB);
  const isLight = luminance > 140;

  const baseR = isLight ? 24 : 14;
  const baseG = isLight ? 26 : 15;
  const baseB = isLight ? 32 : 18;

  const blendFactor = isLight ? 0.22 : 0.18;
  const tintR = clamp(Math.round(baseR * (1 - blendFactor) + avgR * blendFactor), 0, 255);
  const tintG = clamp(Math.round(baseG * (1 - blendFactor) + avgG * blendFactor), 0, 255);
  const tintB = clamp(Math.round(baseB * (1 - blendFactor) + avgB * blendFactor), 0, 255);

  let alpha = 0.74;
  if (isModal) {
    alpha = isLight ? 0.86 : 0.82;
  } else if (isLight) {
    alpha = 0.80;
  }

  const bgRgba = `rgba(${tintR}, ${tintG}, ${tintB}, ${alpha.toFixed(2)})`;

  const borderAlpha = isLight ? 0.24 : 0.16;
  const borderHighlightR = clamp(tintR + (isLight ? 120 : 60), 0, 255);
  const borderHighlightG = clamp(tintG + (isLight ? 120 : 60), 0, 255);
  const borderHighlightB = clamp(tintB + (isLight ? 120 : 60), 0, 255);
  const borderColor = `rgba(${borderHighlightR}, ${borderHighlightG}, ${borderHighlightB}, ${borderAlpha.toFixed(2)})`;

  const highlightAlpha = isLight ? 0.32 : 0.22;
  const highlightColor = `rgba(255, 255, 255, ${highlightAlpha.toFixed(2)})`;

  const shadowAlpha = isLight ? 0.52 : 0.46;
  const boxShadow = isLight
    ? `0 20px 48px rgba(0, 0, 0, ${shadowAlpha.toFixed(2)}), inset 0 1px 0 rgba(255, 255, 255, 0.28), inset 0 -1px 0 rgba(0, 0, 0, 0.35)`
    : `0 16px 44px rgba(0, 0, 0, ${shadowAlpha.toFixed(2)}), inset 0 1px 0 rgba(255, 255, 255, 0.20), inset 0 -1px 0 rgba(0, 0, 0, 0.25)`;

  return {
    r: Math.round(avgR),
    g: Math.round(avgG),
    b: Math.round(avgB),
    luminance,
    isLight,
    tintR,
    tintG,
    tintB,
    alpha,
    bgRgba,
    borderColor,
    boxShadow,
    highlightColor,
  };
}

function getFallbackPalette(): WallpaperPalette {
  const defaultSample = deriveGlassStyle(24, 24, 28, false);
  const modalSample = deriveGlassStyle(24, 24, 28, true);
  return {
    dominant: defaultSample,
    dockBottom: defaultSample,
    dockLeft: defaultSample,
    dockRight: defaultSample,
    halo: defaultSample,
    desktopWidgets: defaultSample,
    modal: modalSample,
    timestamp: Date.now(),
  };
}

function sampleBox(
  bitmap: Buffer,
  stride: number,
  startX: number,
  endX: number,
  startY: number,
  endY: number
): { r: number; g: number; b: number } {
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const offset = (y * stride + x) * 4;
      if (offset + 2 < bitmap.length) {
        const b = bitmap[offset];
        const g = bitmap[offset + 1];
        const r = bitmap[offset + 2];
        totalB += b;
        totalG += g;
        totalR += r;
        count++;
      }
    }
  }

  if (count === 0) return { r: 24, g: 24, b: 28 };
  return {
    r: totalR / count,
    g: totalG / count,
    b: totalB / count,
  };
}

export function computeWallpaperPalette(): WallpaperPalette {
  try {
    const transcodedPath = path.join(
      process.env.APPDATA || '',
      'Microsoft',
      'Windows',
      'Themes',
      'TranscodedWallpaper'
    );

    if (!fs.existsSync(transcodedPath)) {
      return getFallbackPalette();
    }

    const stat = fs.statSync(transcodedPath);
    if (stat.mtimeMs === cachedMtime && cachedPalette) {
      return cachedPalette;
    }

    const fileBuffer = fs.readFileSync(transcodedPath);
    const img = nativeImage.createFromBuffer(fileBuffer);
    if (img.isEmpty()) {
      return getFallbackPalette();
    }

    const width = 64;
    const height = 36;
    const resized = img.resize({ width, height, quality: 'good' });
    const bitmap = resized.toBitmap();

    if (!bitmap || bitmap.length < width * height * 4) {
      return getFallbackPalette();
    }

    const dominantAvg = sampleBox(bitmap, width, 0, width - 1, 0, height - 1);
    const dockBottomAvg = sampleBox(bitmap, width, 14, 49, 28, 35);
    const dockLeftAvg = sampleBox(bitmap, width, 0, 10, 8, 27);
    const dockRightAvg = sampleBox(bitmap, width, 53, 63, 8, 27);
    const haloAvg = sampleBox(bitmap, width, 20, 43, 0, 6);
    const desktopWidgetsAvg = sampleBox(bitmap, width, 46, 63, 2, 33);
    const modalAvg = sampleBox(bitmap, width, 16, 47, 8, 27);

    const palette: WallpaperPalette = {
      dominant: deriveGlassStyle(dominantAvg.r, dominantAvg.g, dominantAvg.b, false),
      dockBottom: deriveGlassStyle(dockBottomAvg.r, dockBottomAvg.g, dockBottomAvg.b, false),
      dockLeft: deriveGlassStyle(dockLeftAvg.r, dockLeftAvg.g, dockLeftAvg.b, false),
      dockRight: deriveGlassStyle(dockRightAvg.r, dockRightAvg.g, dockRightAvg.b, false),
      halo: deriveGlassStyle(haloAvg.r, haloAvg.g, haloAvg.b, false),
      desktopWidgets: deriveGlassStyle(desktopWidgetsAvg.r, desktopWidgetsAvg.g, desktopWidgetsAvg.b, false),
      modal: deriveGlassStyle(modalAvg.r, modalAvg.g, modalAvg.b, true),
      timestamp: Date.now(),
    };

    cachedMtime = stat.mtimeMs;
    cachedPalette = palette;
    return palette;
  } catch (_) {
    return getFallbackPalette();
  }
}

export function registerWallpaperHandlers(getMainWindow: () => BrowserWindow | null) {
  ipcMain.handle('wallpaper:getColors', async () => {
    return computeWallpaperPalette();
  });

  try {
    const themesDir = path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Themes');
    if (fs.existsSync(themesDir)) {
      watcher = fs.watch(themesDir, (_eventType, filename) => {
        if (filename && (filename.includes('TranscodedWallpaper') || filename.includes('CachedImage'))) {
          if (debounceTimeout) clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            const newPalette = computeWallpaperPalette();
            const win = getMainWindow();
            if (win && !win.isDestroyed()) {
              win.webContents.send('wallpaper:colors-updated', newPalette);
            }
          }, 800);
        }
      });
    }
  } catch (_) {}
}

export function cleanupWallpaperWatcher() {
  if (watcher) {
    try {
      watcher.close();
    } catch (_) {}
    watcher = null;
  }
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
    debounceTimeout = null;
  }
}
