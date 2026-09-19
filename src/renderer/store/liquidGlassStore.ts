import { create } from 'zustand';
import { WallpaperPalette, RegionSample } from '../types/electron';

interface LiquidGlassState {
  palette: WallpaperPalette | null;
  loaded: boolean;
  init: () => Promise<void>;
  getDockSample: (position: 'bottom' | 'left' | 'right') => RegionSample | null;
  getHaloSample: () => RegionSample | null;
  getDesktopWidgetsSample: () => RegionSample | null;
  getModalSample: () => RegionSample | null;
}

let listenerInitialized = false;

export const useLiquidGlassStore = create<LiquidGlassState>((set, get) => ({
  palette: null,
  loaded: false,
  init: async () => {
    try {
      if (window.electronAPI?.getWallpaperColors) {
        const p = await window.electronAPI.getWallpaperColors();
        if (p) {
          set({ palette: p, loaded: true });
        }
      }
    } catch (_) {}

    if (!listenerInitialized && window.electronAPI?.onWallpaperColorsUpdated) {
      listenerInitialized = true;
      window.electronAPI.onWallpaperColorsUpdated((newPalette) => {
        if (newPalette) {
          set({ palette: newPalette });
        }
      });
    }
  },
  getDockSample: (position: 'bottom' | 'left' | 'right') => {
    const p = get().palette;
    if (!p) return null;
    if (position === 'left') return p.dockLeft;
    if (position === 'right') return p.dockRight;
    return p.dockBottom;
  },
  getHaloSample: () => {
    const p = get().palette;
    return p ? p.halo : null;
  },
  getDesktopWidgetsSample: () => {
    const p = get().palette;
    return p ? p.desktopWidgets : null;
  },
  getModalSample: () => {
    const p = get().palette;
    return p ? p.modal : null;
  },
}));
