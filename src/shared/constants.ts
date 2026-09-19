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
  | 'moon-phase';

export type DesktopWidgetSize = 'small' | 'medium' | 'large';

export interface DesktopWidgetItem {
  id: string;
  type: DesktopWidgetType;
  x: number;
  y: number;
  size: DesktopWidgetSize;
  customTitle?: string;
  city?: string;
  pinned?: boolean;
  locked?: boolean;
}

export interface WidgetDefinition {
  id: WidgetId;
  name: string;
  category: WidgetCategory;
  icon: string;
  defaultWidth: 'compact' | 'normal' | 'wide';
  description: string;
  supportsDesktop?: boolean;
}

export type WidgetCategory =
  | 'apps-files'
  | 'system'
  | 'productivity'
  | 'media'
  | 'time'
  | 'finance'
  | 'utilities';

export const WIDGET_CATEGORIES: { id: WidgetCategory; label: string }[] = [
  { id: 'apps-files', label: 'Apps & Files' },
  { id: 'system', label: 'System' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'media', label: 'Media' },
  { id: 'time', label: 'Time' },
  { id: 'finance', label: 'Finance' },
  { id: 'utilities', label: 'Utilities' },
];

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  { id: WIDGET_IDS.APP_LAUNCHER, name: 'Apps', category: 'apps-files', icon: 'apps', defaultWidth: 'compact', description: 'Launch installed applications', supportsDesktop: false },
  { id: WIDGET_IDS.RECENTLY_OPENED, name: 'Recently Opened', category: 'apps-files', icon: 'recent', defaultWidth: 'compact', description: 'Recently opened files and apps', supportsDesktop: false },
  { id: WIDGET_IDS.RECYCLE_BIN, name: 'Recycle Bin', category: 'apps-files', icon: 'trash', defaultWidth: 'compact', description: 'Recycle bin status and actions', supportsDesktop: false },
  { id: WIDGET_IDS.FILE_SEARCH, name: 'Search', category: 'apps-files', icon: 'search', defaultWidth: 'normal', description: 'Search files and applications', supportsDesktop: false },
  { id: WIDGET_IDS.COMMANDS, name: 'Commands', category: 'apps-files', icon: 'command', defaultWidth: 'normal', description: 'Quick command launcher', supportsDesktop: false },
  { id: WIDGET_IDS.DOWNLOADS, name: 'Downloads', category: 'apps-files', icon: 'download', defaultWidth: 'compact', description: 'Downloads folder access', supportsDesktop: false },
  { id: WIDGET_IDS.RECENT_SCREENSHOTS, name: 'Recent Screenshots', category: 'apps-files', icon: 'camera', defaultWidth: 'compact', description: 'View recent screenshots', supportsDesktop: false },
  { id: WIDGET_IDS.SCREENSHOT_CAPTURE, name: 'Screenshot Capture', category: 'utilities', icon: 'crop', defaultWidth: 'compact', description: 'Capture screen regions', supportsDesktop: false },
  { id: WIDGET_IDS.STORAGE, name: 'Storage', category: 'system', icon: 'storage', defaultWidth: 'compact', description: 'Disk storage usage', supportsDesktop: false },
  { id: WIDGET_IDS.MEDIA_PLAYER, name: 'Media Player', category: 'media', icon: 'music', defaultWidth: 'wide', description: 'Control playing media', supportsDesktop: false },
  { id: WIDGET_IDS.CLOCK, name: 'Digital Clock', category: 'time', icon: 'clock', defaultWidth: 'compact', description: 'Current time display', supportsDesktop: false },
  { id: WIDGET_IDS.WORLD_CLOCK, name: 'World Clock', category: 'time', icon: 'globe', defaultWidth: 'normal', description: 'World map and timezone clock', supportsDesktop: true },
  { id: WIDGET_IDS.DAY_PROGRESS, name: 'Day Progress', category: 'time', icon: 'progress', defaultWidth: 'compact', description: 'Progress through the day', supportsDesktop: false },
  { id: WIDGET_IDS.MONTH_PROGRESS, name: 'Month Progress', category: 'time', icon: 'progress', defaultWidth: 'compact', description: 'Progress through the month', supportsDesktop: false },
  { id: WIDGET_IDS.YEAR_PROGRESS, name: 'Year Progress', category: 'time', icon: 'progress', defaultWidth: 'compact', description: 'Progress through the year', supportsDesktop: false },
  { id: WIDGET_IDS.NOTES, name: 'Notes', category: 'productivity', icon: 'note', defaultWidth: 'normal', description: 'Quick notes', supportsDesktop: false },
  { id: WIDGET_IDS.CURRENCY, name: 'Currency', category: 'finance', icon: 'currency', defaultWidth: 'compact', description: 'Currency conversion rates', supportsDesktop: false },
  { id: WIDGET_IDS.DATE_DAY, name: 'Date & Day', category: 'time', icon: 'calendar', defaultWidth: 'compact', description: 'Large day, date, and schedule title', supportsDesktop: true },
  { id: WIDGET_IDS.SYSTEM_CONTROLS, name: 'System Controls', category: 'system', icon: 'settings', defaultWidth: 'compact', description: 'Volume slider, headphone toggle, and mute', supportsDesktop: true },
  { id: WIDGET_IDS.SYSTEM_MONITOR, name: 'System Monitor', category: 'system', icon: 'storage', defaultWidth: 'compact', description: 'CPU, RAM, and SSD multi-ring gauge', supportsDesktop: true },
  { id: WIDGET_IDS.BATTERY, name: 'Battery', category: 'system', icon: 'command', defaultWidth: 'compact', description: 'Battery charge ring and percentage', supportsDesktop: true },
  { id: WIDGET_IDS.ANALOG_CLOCK, name: 'Analog Clock', category: 'time', icon: 'clock', defaultWidth: 'compact', description: 'Classic macOS analog clock dial', supportsDesktop: true },
  { id: WIDGET_IDS.CALENDAR, name: 'Calendar Month', category: 'time', icon: 'calendar', defaultWidth: 'compact', description: 'Full month calendar grid', supportsDesktop: true },
  { id: WIDGET_IDS.MOON_PHASE, name: 'Moon Phase', category: 'time', icon: 'globe', defaultWidth: 'compact', description: 'Live astronomical moon phase', supportsDesktop: true },
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
}

export const DEFAULT_PINNED_APPS: DockAppItem[] = [
  { id: 'finder', name: 'Finder', path: 'explorer.exe', iconType: 'finder', running: true },
  { id: 'safari', name: 'Safari', path: 'https://www.google.com', iconType: 'safari', running: true },
  { id: 'mail', name: 'Mail', path: 'mailto:', iconType: 'mail' },
  { id: 'terminal', name: 'Terminal', path: 'wt.exe', iconType: 'terminal', running: true },
  { id: 'calendar', name: 'Calendar', path: 'calendar', iconType: 'calendar', running: true },
  { id: 'photos', name: 'Photos', path: 'ms-photos:', iconType: 'photos' },
  { id: 'music', name: 'Music', path: 'spotify', iconType: 'music', running: true },
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
  alwaysOnTop: false,
  launchAtStartup: false,
  theme: 'dark' as const,
  animationIntensity: 1.0,
  defaultMonitor: 0,
  showOnHover: false,
  minimizeEffect: 'genie' as 'genie' | 'scale',
  minimizeToIcon: true,
  liveIcons: true,
  showIndicators: true,
  pinnedApps: DEFAULT_PINNED_APPS,
  desktopWidgets: DEFAULT_DESKTOP_WIDGETS,
  desktopWidgetsVisible: true,
  activeProfileId: 'default',
  dynamicIslandEnabled: false,
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
