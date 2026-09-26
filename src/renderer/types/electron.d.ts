import type { StorageInfo, AppInfo, RecentItem, FileSearchResult, MediaInfo, NoteData, ScreenshotFile, DownloadFile } from './widget';
import type { DockConfig, WidgetId, WidgetProfile } from '../../shared/constants';

export interface ElectronAPI {
  getStorageInfo(): Promise<StorageInfo[]>;
  getRecycleBinCount(): Promise<number>;
  emptyRecycleBin(): Promise<void>;
  openRecycleBin(): Promise<void>;
  getInstalledApps(): Promise<AppInfo[]>;
  getSystemMetrics(): Promise<{ cpu: number; ram: number; ssd: number }>;
  getBatteryStatus(): Promise<{ percent: number; isCharging: boolean; hasBattery: boolean }>;
  getAudioVolume(): Promise<{ volume: number; isMuted: boolean }>;
  setAudioVolume(volume: number): Promise<{ volume: number; isMuted: boolean }>;
  toggleAudioMute(): Promise<boolean>;
  selectAppFile(): Promise<{ name: string; path: string; icon?: string } | null>;
  getAppIcon(filePath: string): Promise<string | null>;
  selectImageFile(): Promise<string | null>;
  getRecentItems(): Promise<RecentItem[]>;
  getDownloads(): Promise<DownloadFile[]>;
  getRecentScreenshots(): Promise<ScreenshotFile[]>;
  searchFiles(query: string): Promise<FileSearchResult[]>;
  launchApp(appPath: string): Promise<void>;
  openPath(filePath: string): Promise<void>;
  openUrl(url: string): Promise<void>;
  runCommand(command: string): Promise<string>;
  getMediaInfo(): Promise<MediaInfo | null>;
  mediaControl(action: 'play-pause' | 'next' | 'previous'): Promise<void>;
  mediaSeek(seconds: number): Promise<void>;
  captureScreenshot(mode: 'full' | 'region' | 'window'): Promise<string | null>;
  getConfig(): Promise<{
    dock: DockConfig;
    enabledWidgets: WidgetId[];
    widgetOrder: WidgetId[];
    notes: NoteData[];
    profiles?: WidgetProfile[];
    activeProfileId?: string;
  }>;
  saveConfig(
    config: Partial<{
      dock: DockConfig;
      enabledWidgets: WidgetId[];
      widgetOrder: WidgetId[];
      notes: NoteData[];
      profiles: WidgetProfile[];
      activeProfileId: string;
    }>
  ): Promise<void>;
  setAutoHide(value: boolean): Promise<void>;
  getDisplays(): Promise<{ index: number; id: number; isPrimary: boolean; width: number; height: number }[]>;
  showWidgetLibrary(): Promise<void>;
  showSettings(): Promise<void>;
  setModalOpen(isOpen: boolean): Promise<void>;
  setPopoverOpen(isOpen: boolean): Promise<void>;
  setIgnoreMouseEvents(ignore: boolean, forward?: boolean): Promise<void>;
  hideWindow(): Promise<void>;
  quitApp(): Promise<void>;
  getLaunchOnStartup(): Promise<boolean>;
  setLaunchOnStartup(enabled: boolean): Promise<boolean>;
  onDockConfigChanged(callback: (config: DockConfig) => void): () => void;
  onShowWidgetLibrary(callback: () => void): () => void;
  onShowSettings(callback: () => void): () => void;
  onShowApp(callback: () => void): () => void;
  onCloseApp(callback: () => void): () => void;
  onToggleDock(callback: () => void): () => void;
  showUninstall(): Promise<void>;
  getScreenshotsDir(): Promise<string>;
  getWallpaperColors(): Promise<WallpaperPalette>;
  onWallpaperColorsUpdated(callback: (palette: WallpaperPalette) => void): () => void;
  appReady?(): void;
  checkForUpdates(manual?: boolean): Promise<void>;
  startUpdateDownload(): Promise<void>;
  installUpdate(): Promise<void>;
  dismissUpdate(version: string): Promise<void>;
  getUpdaterStatus(): Promise<UpdaterStatus>;
  onUpdaterStatus(callback: (status: UpdaterStatus) => void): () => void;
}

export type UpdaterStatus =
  | { status: 'idle' }
  | { status: 'checking'; isManual: boolean }
  | { status: 'available'; version: string; isManual: boolean }
  | { status: 'not-available'; isManual: boolean }
  | { status: 'downloading'; version: string; percent: number }
  | { status: 'downloaded'; version: string }
  | { status: 'error'; message: string; phase: 'check' | 'download'; isManual: boolean };

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

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
