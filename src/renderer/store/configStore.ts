import { create } from 'zustand';
import {
  DockConfig,
  DEFAULT_DOCK_CONFIG,
  DockAppItem,
  DesktopWidgetItem,
  DesktopWidgetType,
  DesktopWidgetSize,
  WidgetProfile,
  DEFAULT_PROFILES,
  DEFAULT_DESKTOP_WIDGETS,
} from '../../shared/constants';
import { useWidgetStore } from './widgetStore';
import { findFreeSpot, fitWidgetResize, getDockReservedRect } from '../utils/widgetPlacement';

export type DokiiiAppTab =
  | 'home'
  | 'library'
  | 'profiles'
  | 'desktop'
  | 'dock'
  | 'halo'
  | 'settings'
  | 'about';

interface ConfigState {
  dock: DockConfig;
  profiles: WidgetProfile[];
  activeProfileId: string;
  isWidgetLibraryOpen: boolean;
  isSettingsOpen: boolean;
  isDokiiiAppOpen: boolean;
  activeAppTab: DokiiiAppTab;
  notice: string | null;
  dockHidden: boolean;
  initialized: boolean;
  launchOnStartup: boolean;
  setLaunchOnStartup: (enabled: boolean) => void;
  updateConfig: (partial: Partial<DockConfig>) => void;
  toggleWidgetLibrary: () => void;
  toggleSettings: () => void;
  openDokiiiApp: (tab?: DokiiiAppTab) => void;
  closeDokiiiApp: () => void;
  toggleDokiiiApp: (tab?: DokiiiAppTab) => void;
  setActiveAppTab: (tab: DokiiiAppTab) => void;
  closeOverlays: () => void;
  showNotice: (message: string) => void;
  toggleDockHidden: () => void;
  addPinnedApp: (app: DockAppItem) => void;
  removePinnedApp: (id: string) => void;
  reorderPinnedApps: (apps: DockAppItem[]) => void;
  addDesktopWidget: (type: DesktopWidgetType, size?: DesktopWidgetSize) => boolean;
  removeDesktopWidget: (id: string) => void;
  updateDesktopWidgetPos: (id: string, x: number, y: number) => void;
  setDesktopWidgetSize: (id: string, size: DesktopWidgetSize) => boolean;
  updateDesktopWidgetData: (id: string, data: Partial<DesktopWidgetItem>) => void;
  resetDesktopWidgetPositions: () => void;
  toggleDesktopWidgetsVisible: () => void;
  switchProfile: (profileId: string) => void;
  createProfile: (name: string) => void;
  renameProfile: (id: string, name: string) => void;
  duplicateProfile: (id: string) => void;
  deleteProfile: (id: string) => void;
  init: () => Promise<void>;
}

let noticeTimer: ReturnType<typeof setTimeout> | null = null;

export const useConfigStore = create<ConfigState>((set, get) => ({
  dock: { ...DEFAULT_DOCK_CONFIG },
  profiles: [...DEFAULT_PROFILES],
  activeProfileId: 'default',
  isWidgetLibraryOpen: false,
  isSettingsOpen: false,
  isDokiiiAppOpen: false,
  activeAppTab: 'home',
  notice: null,
  dockHidden: false,
  initialized: false,
  launchOnStartup: false,
  setLaunchOnStartup: (enabled) => {
    set({ launchOnStartup: enabled });
    try {
      window.electronAPI.setLaunchOnStartup(enabled).then((confirmed) => {
        set({ launchOnStartup: confirmed });
      });
    } catch (_) {}
  },
  updateConfig: (partial) => {
    const newDock = { ...get().dock, ...partial };
    set({ dock: newDock });
    const currentProfileId = get().activeProfileId;
    const currentProfiles = get().profiles;
    const updatedProfiles = currentProfiles.map((p) => {
      if (p.id === currentProfileId) {
        return {
          ...p,
          pinnedApps: newDock.pinnedApps,
          desktopWidgets: newDock.desktopWidgets,
        };
      }
      return p;
    });
    set({ profiles: updatedProfiles });
    try {
      window.electronAPI.saveConfig({ dock: newDock, profiles: updatedProfiles });
    } catch (_) {}
  },
  toggleWidgetLibrary: () =>
    set((s) => ({ isWidgetLibraryOpen: !s.isWidgetLibraryOpen, isSettingsOpen: false })),
  toggleSettings: () =>
    set((s) => ({ isSettingsOpen: !s.isSettingsOpen, isWidgetLibraryOpen: false })),
  openDokiiiApp: (tab = 'home') => {
    set({
      isDokiiiAppOpen: true,
      activeAppTab: tab,
      isWidgetLibraryOpen: false,
      isSettingsOpen: false,
    });
    try {
      window.electronAPI.setModalOpen(true);
    } catch (_) {}
  },
  closeDokiiiApp: () => {
    set({ isDokiiiAppOpen: false });
    try {
      window.electronAPI.setModalOpen(false);
    } catch (_) {}
  },
  toggleDokiiiApp: (tab = 'home') => {
    const next = !get().isDokiiiAppOpen;
    set({
      isDokiiiAppOpen: next,
      activeAppTab: tab,
      isWidgetLibraryOpen: false,
      isSettingsOpen: false,
    });
    try {
      window.electronAPI.setModalOpen(next);
    } catch (_) {}
  },
  setActiveAppTab: (tab) => set({ activeAppTab: tab }),
  closeOverlays: () =>
    set({ isWidgetLibraryOpen: false, isSettingsOpen: false, isDokiiiAppOpen: false }),
  toggleDockHidden: () => set((s) => ({ dockHidden: !s.dockHidden })),
  showNotice: (message) => {
    if (noticeTimer) clearTimeout(noticeTimer);
    set({ notice: message });
    noticeTimer = setTimeout(() => {
      set({ notice: null });
      noticeTimer = null;
    }, 3500);
  },
  addPinnedApp: (newApp) => {
    const current = get().dock.pinnedApps || [];
    if (current.some((a) => a.id === newApp.id || (a.path === newApp.path && newApp.path !== ''))) {
      return;
    }
    const updated = [...current, newApp];
    get().updateConfig({ pinnedApps: updated });
  },
  removePinnedApp: (id) => {
    const current = get().dock.pinnedApps || [];
    const updated = current.filter((a) => a.id !== id);
    get().updateConfig({ pinnedApps: updated });
  },
  reorderPinnedApps: (apps) => {
    get().updateConfig({ pinnedApps: apps });
  },
  addDesktopWidget: (type, size = 'small') => {
    const { dock } = get();
    const current = dock.desktopWidgets || [];
    const winW = window.innerWidth || 1920;
    const winH = window.innerHeight || 1080;
    const reserved = dock.autoHide
      ? null
      : getDockReservedRect(dock.position || 'bottom', dock.size || 64, winW, winH);
    const spot = findFreeSpot(current, size, winW, winH, reserved);
    if (!spot) {
      get().showNotice("No space left on the desktop. This widget can't be added.");
      return false;
    }
    const newItem: DesktopWidgetItem = {
      id: `desk-${type}-${Date.now()}`,
      type,
      x: spot.x,
      y: spot.y,
      size,
    };
    get().updateConfig({ desktopWidgets: [...current, newItem] });
    return true;
  },
  removeDesktopWidget: (id) => {
    const current = get().dock.desktopWidgets || [];
    const updated = current.filter((w) => w.id !== id);
    get().updateConfig({ desktopWidgets: updated });
  },
  updateDesktopWidgetPos: (id, x, y) => {
    const current = get().dock.desktopWidgets || [];
    const updated = current.map((w) => (w.id === id ? { ...w, x, y } : w));
    get().updateConfig({ desktopWidgets: updated });
  },
  setDesktopWidgetSize: (id, size) => {
    const current = get().dock.desktopWidgets || [];
    const winW = window.innerWidth || 1920;
    const winH = window.innerHeight || 1080;
    const spot = fitWidgetResize(current, id, size, winW, winH);
    if (!spot) {
      get().showNotice("No space for this size. Move or remove a widget first.");
      return false;
    }
    const updated = current.map((w) =>
      w.id === id ? { ...w, size, x: spot.x, y: spot.y, width: undefined, height: undefined } : w
    );
    get().updateConfig({ desktopWidgets: updated });
    return true;
  },
  updateDesktopWidgetData: (id, data) => {
    const current = get().dock.desktopWidgets || [];
    const updated = current.map((w) => (w.id === id ? { ...w, ...data } : w));
    get().updateConfig({ desktopWidgets: updated });
  },
  resetDesktopWidgetPositions: () => {
    get().updateConfig({ desktopWidgets: [...DEFAULT_DESKTOP_WIDGETS] });
  },
  toggleDesktopWidgetsVisible: () => {
    get().updateConfig({ desktopWidgetsVisible: !get().dock.desktopWidgetsVisible });
  },
  switchProfile: (profileId) => {
    const { profiles, dock } = get();
    const target = profiles.find((p) => p.id === profileId);
    if (!target) return;

    const currentProfileId = get().activeProfileId;
    const currentDockWidgets = useWidgetStore.getState().enabledWidgets;
    const updatedProfiles = profiles.map((p) => {
      if (p.id === currentProfileId) {
        return {
          ...p,
          dockWidgets: currentDockWidgets,
          pinnedApps: dock.pinnedApps || [],
          desktopWidgets: dock.desktopWidgets || [],
        };
      }
      return p;
    });

    const newDock: DockConfig = {
      ...dock,
      ...(target.dockConfig || {}),
      pinnedApps: target.pinnedApps,
      desktopWidgets: target.desktopWidgets,
      activeProfileId: profileId,
    };

    set({
      profiles: updatedProfiles,
      activeProfileId: profileId,
      dock: newDock,
    });

    useWidgetStore.getState().setEnabledWidgets(target.dockWidgets);

    try {
      window.electronAPI.saveConfig({
        dock: newDock,
        profiles: updatedProfiles,
        activeProfileId: profileId,
      });
    } catch (_) {}
  },
  createProfile: (name) => {
    const { profiles, dock } = get();
    const newProfile: WidgetProfile = {
      id: `profile-${Date.now()}`,
      name,
      dockWidgets: [...useWidgetStore.getState().enabledWidgets],
      pinnedApps: [...(dock.pinnedApps || [])],
      desktopWidgets: [...(dock.desktopWidgets || [])],
    };
    const updated = [...profiles, newProfile];
    set({ profiles: updated });
    try {
      window.electronAPI.saveConfig({ profiles: updated });
    } catch (_) {}
  },
  renameProfile: (id, name) => {
    const { profiles } = get();
    const updated = profiles.map((p) => (p.id === id ? { ...p, name } : p));
    set({ profiles: updated });
    try {
      window.electronAPI.saveConfig({ profiles: updated });
    } catch (_) {}
  },
  duplicateProfile: (id) => {
    const { profiles } = get();
    const source = profiles.find((p) => p.id === id);
    if (!source) return;
    const newProfile: WidgetProfile = {
      ...source,
      id: `profile-${Date.now()}`,
      name: `${source.name} Copy`,
    };
    const updated = [...profiles, newProfile];
    set({ profiles: updated });
    try {
      window.electronAPI.saveConfig({ profiles: updated });
    } catch (_) {}
  },
  deleteProfile: (id) => {
    const { profiles, activeProfileId } = get();
    if (profiles.length <= 1) return;
    const updated = profiles.filter((p) => p.id !== id);
    set({ profiles: updated });
    if (activeProfileId === id) {
      get().switchProfile(updated[0].id);
    } else {
      try {
        window.electronAPI.saveConfig({ profiles: updated });
      } catch (_) {}
    }
  },
  init: async () => {
    try {
      window.electronAPI
        .getLaunchOnStartup()
        .then((enabled) => set({ launchOnStartup: Boolean(enabled) }))
        .catch(() => {});
    } catch (_) {}
    try {
      const config = await window.electronAPI.getConfig();
      const loadedProfiles =
        config?.profiles && config.profiles.length > 0 ? config.profiles : DEFAULT_PROFILES;
      const loadedActiveId =
        config?.activeProfileId || (config?.dock as any)?.activeProfileId || 'default';
      if (config?.dock) {
        set({
          dock: {
            ...DEFAULT_DOCK_CONFIG,
            ...config.dock,
            pinnedApps: config.dock.pinnedApps || DEFAULT_DOCK_CONFIG.pinnedApps,
            desktopWidgets: config.dock.desktopWidgets || DEFAULT_DESKTOP_WIDGETS,
          },
          profiles: loadedProfiles,
          activeProfileId: loadedActiveId,
          initialized: true,
        });
      } else {
        set({
          profiles: loadedProfiles,
          activeProfileId: loadedActiveId,
          initialized: true,
        });
      }
    } catch (_) {
      set({
        profiles: [...DEFAULT_PROFILES],
        activeProfileId: 'default',
        initialized: true,
      });
    }
  },
}));
