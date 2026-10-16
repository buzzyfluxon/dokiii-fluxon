import { PRESET_IMAGES, glyphDataUrl } from './presetAssets';

export const WIDGET_IDS = {
  STORAGE: 'storage',
  CURRENCY: 'currency',
  NOTES: 'notes',
  WORLD_CLOCK: 'world-clock',
  MEDIA_PLAYER: 'media-player',
  CLOCK: 'clock',
  DAY_PROGRESS: 'day-progress',
  MONTH_PROGRESS: 'month-progress',
  YEAR_PROGRESS: 'year-progress',
  APP_LAUNCHER: 'app-launcher',
  RECENTLY_OPENED: 'recently-opened',
  RECYCLE_BIN: 'recycle-bin',
  FILE_SEARCH: 'file-search',
  COMMANDS: 'commands',
  DOWNLOADS: 'downloads',
  RECENT_SCREENSHOTS: 'recent-screenshots',
  SCREENSHOT_CAPTURE: 'screenshot-capture',
  DATE_DAY: 'date-day',
  SYSTEM_CONTROLS: 'system-controls',
  SYSTEM_MONITOR: 'system-monitor',
  BATTERY: 'battery',
  ANALOG_CLOCK: 'analog-clock',
  CALENDAR: 'calendar',
  MOON_PHASE: 'moon-phase',
  CUSTOM_TEXT: 'custom-text',
  QUOTE_CARD: 'quote-card',
  COUNTDOWN: 'countdown',
  GOALS: 'goals',
  CAR_CARD: 'car-card',
  TRAVEL_CARD: 'travel-card',
  BOOK_CARD: 'book-card',
  MOVIE_CARD: 'movie-card',
  POLAROID: 'polaroid',
  GALLERY: 'gallery',
  MOOD_BOARD: 'mood-board',
  WEATHER: 'weather',
  BIG_DATE: 'big-date',
  DIGITAL_CLOCK: 'digital-clock',
  PHOTO_CARD: 'photo-card',
  MUSIC_CARD: 'music-card',
} as const;

export type WidgetId = (typeof WIDGET_IDS)[keyof typeof WIDGET_IDS];

export type DesktopWidgetType =
  | 'world-clock'
  | 'date-day'
  | 'system-controls'
  | 'system-monitor'
  | 'battery'
  | 'analog-clock'
  | 'calendar'
  | 'moon-phase'
  | 'custom-text'
  | 'quote-card'
  | 'countdown'
  | 'goals'
  | 'car-card'
  | 'travel-card'
  | 'book-card'
  | 'movie-card'
  | 'polaroid'
  | 'gallery'
  | 'mood-board'
  | 'weather'
  | 'big-date'
  | 'digital-clock'
  | 'photo-card'
  | 'music-card'
  | 'app-icon';

export type DesktopWidgetSize = 'small' | 'medium' | 'large';

export const DESKTOP_WIDGET_SIZES: Record<DesktopWidgetSize, { width: number; height: number }> = {
  small: { width: 144, height: 144 },
  medium: { width: 304, height: 144 },
  large: { width: 304, height: 304 },
};

export const DESKTOP_WIDGET_DEFAULT_DIMS: Partial<Record<DesktopWidgetType, { width: number; height: number }>> = {
  weather: { width: 212, height: 216 },
  'big-date': { width: 436, height: 216 },
  'digital-clock': { width: 100, height: 110 },
  'photo-card': { width: 212, height: 110 },
  'music-card': { width: 212, height: 116 },
  'app-icon': { width: 100, height: 116 },
};

export interface DesktopWidgetItem {
  id: string;
  type: DesktopWidgetType;
  x: number;
  y: number;
  size: DesktopWidgetSize;
  width?: number;
  height?: number;
  customTitle?: string;
  city?: string;
  pinned?: boolean;
  locked?: boolean;
  data?: Record<string, any>;
}

export interface WidgetDefinition {
  id: WidgetId;
  name: string;
  category: WidgetCategory;
  icon: string;
  defaultWidth: 'compact' | 'normal' | 'wide';
  description: string;
  placement: 'dock' | 'desktop';
}

export type WidgetCategory =
  | 'apps-files'
  | 'system'
  | 'productivity'
  | 'media'
  | 'time'
  | 'finance'
  | 'utilities'
  | 'personal';

export const WIDGET_CATEGORIES: { id: WidgetCategory; label: string }[] = [
  { id: 'apps-files', label: 'Apps & Files' },
  { id: 'system', label: 'System' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'media', label: 'Media' },
  { id: 'time', label: 'Time' },
  { id: 'finance', label: 'Finance' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'personal', label: 'Personal' },
];

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  { id: WIDGET_IDS.APP_LAUNCHER, name: 'Apps', category: 'apps-files', icon: 'apps', defaultWidth: 'compact', description: 'Launch installed applications', placement: 'dock' },
  { id: WIDGET_IDS.RECENTLY_OPENED, name: 'Recently Opened', category: 'apps-files', icon: 'recent', defaultWidth: 'compact', description: 'Recently opened files and apps', placement: 'dock' },
  { id: WIDGET_IDS.RECYCLE_BIN, name: 'Recycle Bin', category: 'apps-files', icon: 'trash', defaultWidth: 'compact', description: 'Recycle bin status and actions', placement: 'dock' },
  { id: WIDGET_IDS.FILE_SEARCH, name: 'Search', category: 'apps-files', icon: 'search', defaultWidth: 'normal', description: 'Search files and applications', placement: 'dock' },
  { id: WIDGET_IDS.COMMANDS, name: 'Commands', category: 'apps-files', icon: 'command', defaultWidth: 'normal', description: 'Quick command launcher', placement: 'dock' },
  { id: WIDGET_IDS.DOWNLOADS, name: 'Downloads', category: 'apps-files', icon: 'download', defaultWidth: 'compact', description: 'Downloads folder access', placement: 'dock' },
  { id: WIDGET_IDS.RECENT_SCREENSHOTS, name: 'Recent Screenshots', category: 'apps-files', icon: 'camera', defaultWidth: 'compact', description: 'View recent screenshots', placement: 'dock' },
  { id: WIDGET_IDS.SCREENSHOT_CAPTURE, name: 'Screenshot Capture', category: 'utilities', icon: 'crop', defaultWidth: 'compact', description: 'Capture screen regions', placement: 'dock' },
  { id: WIDGET_IDS.STORAGE, name: 'Storage', category: 'system', icon: 'storage', defaultWidth: 'compact', description: 'Disk storage usage', placement: 'dock' },
  { id: WIDGET_IDS.MEDIA_PLAYER, name: 'Media Player', category: 'media', icon: 'music', defaultWidth: 'wide', description: 'Control playing media', placement: 'dock' },
  { id: WIDGET_IDS.CLOCK, name: 'Digital Clock', category: 'time', icon: 'clock', defaultWidth: 'compact', description: 'Current time display', placement: 'dock' },
  { id: WIDGET_IDS.WORLD_CLOCK, name: 'World Clock', category: 'time', icon: 'globe', defaultWidth: 'normal', description: 'World map and timezone clock', placement: 'desktop' },
  { id: WIDGET_IDS.DAY_PROGRESS, name: 'Day Progress', category: 'time', icon: 'progress', defaultWidth: 'compact', description: 'Progress through the day', placement: 'dock' },
  { id: WIDGET_IDS.MONTH_PROGRESS, name: 'Month Progress', category: 'time', icon: 'progress', defaultWidth: 'compact', description: 'Progress through the month', placement: 'dock' },
  { id: WIDGET_IDS.YEAR_PROGRESS, name: 'Year Progress', category: 'time', icon: 'progress', defaultWidth: 'compact', description: 'Progress through the year', placement: 'dock' },
  { id: WIDGET_IDS.NOTES, name: 'Notes', category: 'productivity', icon: 'note', defaultWidth: 'normal', description: 'Quick notes', placement: 'dock' },
  { id: WIDGET_IDS.CURRENCY, name: 'Currency', category: 'finance', icon: 'currency', defaultWidth: 'compact', description: 'Currency conversion rates', placement: 'dock' },
  { id: WIDGET_IDS.DATE_DAY, name: 'Date & Day', category: 'time', icon: 'calendar', defaultWidth: 'compact', description: 'Large day, date, and schedule title', placement: 'desktop' },
  { id: WIDGET_IDS.SYSTEM_CONTROLS, name: 'System Controls', category: 'system', icon: 'settings', defaultWidth: 'compact', description: 'Volume slider, headphone toggle, and mute', placement: 'desktop' },
  { id: WIDGET_IDS.SYSTEM_MONITOR, name: 'System Monitor', category: 'system', icon: 'storage', defaultWidth: 'compact', description: 'CPU, RAM, and SSD multi-ring gauge', placement: 'desktop' },
  { id: WIDGET_IDS.BATTERY, name: 'Battery', category: 'system', icon: 'command', defaultWidth: 'compact', description: 'Battery charge ring and percentage', placement: 'desktop' },
  { id: WIDGET_IDS.ANALOG_CLOCK, name: 'Analog Clock', category: 'time', icon: 'clock', defaultWidth: 'compact', description: 'Classic macOS analog clock dial', placement: 'desktop' },
  { id: WIDGET_IDS.CALENDAR, name: 'Calendar Month', category: 'time', icon: 'calendar', defaultWidth: 'compact', description: 'Full month calendar grid', placement: 'desktop' },
  { id: WIDGET_IDS.MOON_PHASE, name: 'Moon Phase', category: 'time', icon: 'globe', defaultWidth: 'compact', description: 'Live astronomical moon phase', placement: 'desktop' },
  { id: WIDGET_IDS.CUSTOM_TEXT, name: 'Custom Text', category: 'personal', icon: 'note', defaultWidth: 'compact', description: 'Your own text, reminder or short phrase', placement: 'desktop' },
  { id: WIDGET_IDS.QUOTE_CARD, name: 'Quote Card', category: 'personal', icon: 'note', defaultWidth: 'compact', description: 'A quote and author you choose', placement: 'desktop' },
  { id: WIDGET_IDS.COUNTDOWN, name: 'Countdown', category: 'personal', icon: 'progress', defaultWidth: 'compact', description: 'Count down to a date you set', placement: 'desktop' },
  { id: WIDGET_IDS.GOALS, name: 'Goals', category: 'personal', icon: 'progress', defaultWidth: 'compact', description: 'Track up to 5 personal goals', placement: 'desktop' },
  { id: WIDGET_IDS.CAR_CARD, name: 'Car Card', category: 'personal', icon: 'note', defaultWidth: 'compact', description: 'A visual card for your favorite car', placement: 'desktop' },
  { id: WIDGET_IDS.TRAVEL_CARD, name: 'Travel Card', category: 'personal', icon: 'globe', defaultWidth: 'compact', description: 'A minimal postcard for your next destination', placement: 'desktop' },
  { id: WIDGET_IDS.BOOK_CARD, name: 'Book Card', category: 'personal', icon: 'note', defaultWidth: 'compact', description: 'Cover, title, author and reading progress', placement: 'desktop' },
  { id: WIDGET_IDS.MOVIE_CARD, name: 'Movie / Game Card', category: 'personal', icon: 'note', defaultWidth: 'compact', description: 'Poster, title, rating and watch/play status', placement: 'desktop' },
  { id: WIDGET_IDS.POLAROID, name: 'Polaroid', category: 'personal', icon: 'note', defaultWidth: 'compact', description: 'One photo in a Polaroid-style frame', placement: 'desktop' },
  { id: WIDGET_IDS.GALLERY, name: 'Gallery', category: 'personal', icon: 'note', defaultWidth: 'compact', description: 'A simple 2x2 photo grid', placement: 'desktop' },
  { id: WIDGET_IDS.MOOD_BOARD, name: 'Mood Board', category: 'personal', icon: 'note', defaultWidth: 'compact', description: 'A 2-6 image collage', placement: 'desktop' },
  { id: WIDGET_IDS.WEATHER, name: 'Weather', category: 'system', icon: 'globe', defaultWidth: 'normal', description: 'Live temperature, hourly and 5-day forecast for any city', placement: 'desktop' },
  { id: WIDGET_IDS.BIG_DATE, name: 'Big Date & Time', category: 'time', icon: 'clock', defaultWidth: 'wide', description: 'Weekday, date and oversized stacked time with battery pill', placement: 'desktop' },
  { id: WIDGET_IDS.DIGITAL_CLOCK, name: 'Digital Clock Tile', category: 'time', icon: 'clock', defaultWidth: 'compact', description: 'Framed digital clock with a city label', placement: 'desktop' },
  { id: WIDGET_IDS.PHOTO_CARD, name: 'Photo Card', category: 'personal', icon: 'camera', defaultWidth: 'normal', description: 'Edge-to-edge photo, optional black and white. Double-click to change', placement: 'desktop' },
  { id: WIDGET_IDS.MUSIC_CARD, name: 'Music Card', category: 'media', icon: 'music', defaultWidth: 'normal', description: 'Now playing with play button and album strip', placement: 'desktop' },
];

export const DEFAULT_ENABLED_WIDGETS: WidgetId[] = [
  WIDGET_IDS.MEDIA_PLAYER,
  WIDGET_IDS.CLOCK,
  WIDGET_IDS.DOWNLOADS,
  WIDGET_IDS.RECYCLE_BIN,
];

export interface DockAppItem {
  id: string;
  name: string;
  path: string;
  iconType:
    | 'finder'
    | 'safari'
    | 'mail'
    | 'terminal'
    | 'calendar'
    | 'clock'
    | 'settings'
    | 'music'
    | 'photos'
    | 'app-store'
    | 'messages'
    | 'custom';
  color?: string;
  icon?: string;
  running?: boolean;
  mono?: boolean;
  fill?: boolean;
  separatorBefore?: boolean;
}

export const DEFAULT_PINNED_APPS: DockAppItem[] = [
  { id: 'finder', name: 'Finder', path: 'explorer.exe', iconType: 'finder' },
  { id: 'safari', name: 'Safari', path: 'https://www.google.com', iconType: 'safari' },
  { id: 'mail', name: 'Mail', path: 'mailto:', iconType: 'mail' },
  { id: 'terminal', name: 'Terminal', path: 'wt.exe', iconType: 'terminal' },
  { id: 'calendar', name: 'Calendar', path: 'calendar', iconType: 'calendar' },
  { id: 'photos', name: 'Photos', path: 'ms-photos:', iconType: 'photos' },
  { id: 'music', name: 'Music', path: 'spotify', iconType: 'music' },
  { id: 'settings', name: 'System Settings', path: 'settings', iconType: 'settings' },
];

export const DEFAULT_DESKTOP_WIDGETS: DesktopWidgetItem[] = [
  { id: 'desk-world-clock', type: 'world-clock', x: -340, y: 40, size: 'small', customTitle: 'At Home' },
  { id: 'desk-date-day', type: 'date-day', x: -180, y: 40, size: 'small', customTitle: 'PADHAIII' },
  { id: 'desk-sys-controls', type: 'system-controls', x: -340, y: 200, size: 'small' },
  { id: 'desk-sys-monitor', type: 'system-monitor', x: -180, y: 200, size: 'small' },
  { id: 'desk-battery', type: 'battery', x: -340, y: 360, size: 'small' },
  { id: 'desk-analog-clock', type: 'analog-clock', x: -180, y: 360, size: 'small' },
  { id: 'desk-calendar', type: 'calendar', x: -340, y: 520, size: 'small' },
  { id: 'desk-moon-phase', type: 'moon-phase', x: -180, y: 520, size: 'small' },
];

export const DEFAULT_DOCK_CONFIG = {
  position: 'bottom' as 'bottom' | 'left' | 'right',
  size: 64,
  magnification: true,
  magnificationScale: 1.65,
  widgetSpacing: 4,
  transparency: 0.82,
  blur: 50,
  cornerRadius: 22,
  autoHide: false,
  theme: 'dark' as const,
  animationIntensity: 1.0,
  defaultMonitor: 0,
  showOnHover: false,
  liveIcons: true,
  showIndicators: true,
  pinnedApps: DEFAULT_PINNED_APPS,
  desktopWidgets: DEFAULT_DESKTOP_WIDGETS,
  desktopWidgetsVisible: true,
  activeProfileId: 'default',
  liquidGlassEnabled: false,
  musicAmbient: {
    enabled: false,
    intensity: 'medium' as 'low' | 'medium' | 'high',
  },
  halo: {
    enabled: true,
    displayMode: 'always' as 'always' | 'active',
    reducedMotion: false,
    showMusic: true,
    showSystemEvents: true,
    showDownloads: true,
    showScreenshots: true,
  },
};

export interface MusicAmbientConfig {
  enabled: boolean;
  intensity: 'low' | 'medium' | 'high';
}

export const DEFAULT_MUSIC_AMBIENT_CONFIG: MusicAmbientConfig = {
  enabled: false,
  intensity: 'medium',
};

export interface HaloConfig {
  enabled: boolean;
  displayMode: 'always' | 'active';
  reducedMotion: boolean;
  showMusic: boolean;
  showSystemEvents: boolean;
  showDownloads: boolean;
  showScreenshots: boolean;
}

export const DEFAULT_HALO_CONFIG: HaloConfig = {
  enabled: true,
  displayMode: 'always',
  reducedMotion: false,
  showMusic: true,
  showSystemEvents: true,
  showDownloads: true,
  showScreenshots: true,
};

export type DockConfig = typeof DEFAULT_DOCK_CONFIG;

export interface WidgetProfile {
  id: string;
  name: string;
  dockWidgets: WidgetId[];
  pinnedApps: DockAppItem[];
  desktopWidgets: DesktopWidgetItem[];
  dockConfig?: Partial<DockConfig>;
}


const RIGHT = -684;
const COL = (n: number) => RIGHT + n * 112;

export const IPAD_MONO_PINNED_APPS: DockAppItem[] = [
  { id: 'messages', name: 'Messages', path: 'https://messages.google.com/web', iconType: 'custom', icon: glyphDataUrl('messages'), mono: true },
  { id: 'safari', name: 'Safari', path: 'https://www.google.com', iconType: 'custom', icon: glyphDataUrl('safari'), mono: true },
  { id: 'music', name: 'Music', path: 'https://music.youtube.com', iconType: 'custom', icon: glyphDataUrl('music'), mono: true },
  { id: 'mail', name: 'Mail', path: 'https://mail.google.com', iconType: 'custom', icon: glyphDataUrl('mail'), mono: true },
  { id: 'calendar', name: 'Calendar', path: 'calendar', iconType: 'calendar', mono: true },
  { id: 'photos', name: 'Photos', path: 'ms-photos:', iconType: 'custom', icon: glyphDataUrl('photos'), mono: true },
  { id: 'notes-app', name: 'Notes', path: 'https://keep.google.com', iconType: 'custom', icon: glyphDataUrl('notes'), mono: true },
  { id: 'spotify', name: 'Spotify', path: 'spotify', iconType: 'custom', icon: glyphDataUrl('spotify'), mono: true, separatorBefore: true },
  { id: 'pinterest', name: 'Pinterest', path: 'https://www.pinterest.com', iconType: 'custom', icon: glyphDataUrl('pinterest'), mono: true },
  { id: 'genshin', name: 'Genshin Impact', path: 'https://genshin.hoyoverse.com/en', iconType: 'custom', icon: PRESET_IMAGES.anime, mono: true, fill: true },
  { id: 'apps-library', name: 'Apps', path: 'shell:AppsFolder', iconType: 'custom', icon: glyphDataUrl('apps'), mono: true },
];

export const IPAD_MONO_DESKTOP_WIDGETS: DesktopWidgetItem[] = [
  { id: 'ipad-weather', type: 'weather', x: COL(0), y: 40, size: 'small', width: 212, height: 216, customTitle: 'Bengaluru' },
  { id: 'ipad-big-date', type: 'big-date', x: COL(2), y: 40, size: 'small', width: 436, height: 216 },
  { id: 'ipad-car', type: 'photo-card', x: COL(0), y: 268, size: 'small', width: 212, height: 110, data: { imageUrl: PRESET_IMAGES.car, grayscale: true } },
  { id: 'ipad-tower', type: 'photo-card', x: COL(2), y: 268, size: 'small', width: 212, height: 110, data: { imageUrl: PRESET_IMAGES.tower, grayscale: true } },
  { id: 'ipad-clock', type: 'digital-clock', x: COL(4), y: 268, size: 'small', width: 100, height: 110, customTitle: 'MUM', data: { timezone: 'Asia/Kolkata' } },
  { id: 'ipad-spiderman', type: 'photo-card', x: COL(5), y: 268, size: 'small', width: 100, height: 110, data: { imageUrl: PRESET_IMAGES.spiderman, grayscale: true } },
  { id: 'ipad-app-genshin', type: 'app-icon', x: COL(0), y: 390, size: 'small', width: 100, height: 116, customTitle: 'Genshin Impact', data: { glyph: 'image', icon: PRESET_IMAGES.anime, path: 'https://genshin.hoyoverse.com/en' } },
  { id: 'ipad-app-spotify', type: 'app-icon', x: COL(1), y: 390, size: 'small', width: 100, height: 116, customTitle: 'Spotify', data: { glyph: 'spotify', path: 'spotify' } },
  { id: 'ipad-app-instagram', type: 'app-icon', x: COL(2), y: 390, size: 'small', width: 100, height: 116, customTitle: 'Instagram', data: { glyph: 'instagram', path: 'https://www.instagram.com' } },
  { id: 'ipad-app-pinterest', type: 'app-icon', x: COL(3), y: 390, size: 'small', width: 100, height: 116, customTitle: 'Pinterest', data: { glyph: 'pinterest', path: 'https://www.pinterest.com' } },
  { id: 'ipad-music', type: 'music-card', x: COL(4), y: 390, size: 'small', width: 212, height: 116, data: { title: 'Desi Boyz', subtitle: 'Album \u2022 by Pritam' } },
];

export const PRESET_PROFILES: WidgetProfile[] = [
  {
    id: 'ipad-mono',
    name: 'iPad Mono',
    dockWidgets: [],
    pinnedApps: IPAD_MONO_PINNED_APPS,
    desktopWidgets: IPAD_MONO_DESKTOP_WIDGETS,
  },
];

export const DEFAULT_PROFILES: WidgetProfile[] = [
  {
    id: 'default',
    name: 'Default',
    dockWidgets: [...DEFAULT_ENABLED_WIDGETS],
    pinnedApps: [...DEFAULT_PINNED_APPS],
    desktopWidgets: [...DEFAULT_DESKTOP_WIDGETS],
  },
  {
    id: 'study',
    name: 'Study',
    dockWidgets: [WIDGET_IDS.CLOCK, WIDGET_IDS.NOTES, WIDGET_IDS.MEDIA_PLAYER],
    pinnedApps: DEFAULT_PINNED_APPS.filter((a) => ['calendar', 'photos', 'music'].includes(a.id)),
    desktopWidgets: [
      { id: 'study-world-clock', type: 'world-clock', x: -340, y: 40, size: 'small', customTitle: 'At Home' },
      { id: 'study-date-day', type: 'date-day', x: -180, y: 40, size: 'small', customTitle: 'PADHAIII' },
      { id: 'study-calendar', type: 'calendar', x: -180, y: 200, size: 'small' },
      { id: 'study-moon-phase', type: 'moon-phase', x: -340, y: 200, size: 'small' },
    ],
  },
  {
    id: 'coding',
    name: 'Coding',
    dockWidgets: [WIDGET_IDS.COMMANDS, WIDGET_IDS.STORAGE, WIDGET_IDS.MEDIA_PLAYER],
    pinnedApps: DEFAULT_PINNED_APPS.filter((a) => ['terminal', 'finder', 'safari'].includes(a.id)),
    desktopWidgets: [
      { id: 'coding-sys-monitor', type: 'system-monitor', x: -180, y: 40, size: 'small' },
      { id: 'coding-battery', type: 'battery', x: -340, y: 40, size: 'small' },
      { id: 'coding-sys-controls', type: 'system-controls', x: -180, y: 200, size: 'small' },
      { id: 'coding-analog-clock', type: 'analog-clock', x: -340, y: 200, size: 'small' },
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    dockWidgets: [WIDGET_IDS.CLOCK],
    pinnedApps: DEFAULT_PINNED_APPS.slice(0, 4),
    desktopWidgets: [
      { id: 'min-analog-clock', type: 'analog-clock', x: -180, y: 40, size: 'small' },
      { id: 'min-date-day', type: 'date-day', x: -180, y: 200, size: 'small', customTitle: 'DOKIII' },
    ],
  },
  ...PRESET_PROFILES,
];

export const DEFAULT_WORLD_CLOCK_CITIES = [
  { name: 'New York', timezone: 'America/New_York' },
  { name: 'London', timezone: 'Europe/London' },
  { name: 'Tokyo', timezone: 'Asia/Tokyo' },
];

export const DEFAULT_CURRENCY_PAIR = {
  from: 'USD',
  to: 'BTC',
};
