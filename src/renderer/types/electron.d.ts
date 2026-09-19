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
  setAlwaysOnTop(value: boolean): Promise<void>;
  setAutoHide(value: boolean): Promise<void>;
  setLaunchAtStartup(value: boolean): Promise<void>;
  getLaunchAtStartup(): Promise<boolean>;
  showWidgetLibrary(): Promise<void>;
  showSettings(): Promise<void>;
  setModalOpen(isOpen: boolean): Promise<void>;
  setPopoverOpen(isOpen: boolean): Promise<void>;
  setIgnoreMouseEvents(ignore: boolean, forward?: boolean): Promise<void>;
  hideWindow(): Promise<void>;
  quitApp(): Promise<void>;
  onDockConfigChanged(callback: (config: DockConfig) => void): () => void;
  onShowWidgetLibrary(callback: () => void): () => void;
  onShowSettings(callback: () => void): () => void;
  onShowApp(callback: () => void): () => void;
  showUninstall(): Promise<void>;
  getScreenshotsDir(): Promise<string>;
  appReady?(): void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
