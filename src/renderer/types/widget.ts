export interface StorageInfo {
  drive: string;
  total: number;
  free: number;
  used: number;
}

export interface AppInfo {
  name: string;
  path: string;
  icon?: string;
}

export interface RecentItem {
  name: string;
  path: string;
  modified: string;
}

export interface FileSearchResult {
  name: string;
  path: string;
  type: 'file' | 'folder' | 'app';
}

export interface MediaInfo {
  title: string;
  artist: string;
  albumTitle?: string;
  albumArt?: string;
  isPlaying: boolean;
  position?: number;
  duration?: number;
  appName?: string;
}

export interface NoteData {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface CityTime {
  name: string;
  timezone: string;
}

export interface ScreenshotFile {
  name: string;
  path: string;
  modified: string;
  thumbnail?: string;
}

export interface DownloadFile {
  name: string;
  path: string;
  size: number;
  modified: string;
}
