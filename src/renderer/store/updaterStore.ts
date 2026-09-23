import { create } from 'zustand';
import type { UpdaterStatus } from '../types/electron';

interface UpdaterStoreState {
  updater: UpdaterStatus;
  setUpdaterStatus: (status: UpdaterStatus) => void;
  hydrate: () => void;
  checkForUpdates: () => void;
  startDownload: () => void;
  installUpdate: () => void;
  dismissUpdate: () => void;
}

export const useUpdaterStore = create<UpdaterStoreState>((set, get) => ({
  updater: { status: 'idle' },
  setUpdaterStatus: (status) => set({ updater: status }),
  hydrate: () => {
    try {
      window.electronAPI
        ?.getUpdaterStatus()
        .then((status) => {
          if (status) set({ updater: status });
        })
        .catch(() => {});
    } catch (_) {}
  },
  checkForUpdates: () => {
    try {
      window.electronAPI?.checkForUpdates(true);
    } catch (_) {}
  },
  startDownload: () => {
    try {
      window.electronAPI?.startUpdateDownload();
    } catch (_) {}
  },
  installUpdate: () => {
    try {
      window.electronAPI?.installUpdate();
    } catch (_) {}
  },
  dismissUpdate: () => {
    const current = get().updater;
    if (current.status === 'available') {
      try {
        window.electronAPI?.dismissUpdate(current.version);
      } catch (_) {}
    }
    set({ updater: { status: 'idle' } });
  },
}));
