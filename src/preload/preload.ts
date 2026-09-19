import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getStorageInfo: () => ipcRenderer.invoke('system:getStorageInfo'),
  getRecycleBinCount: () => ipcRenderer.invoke('system:getRecycleBinCount'),
  emptyRecycleBin: () => ipcRenderer.invoke('system:emptyRecycleBin'),
  openRecycleBin: () => ipcRenderer.invoke('system:openRecycleBin'),
  getInstalledApps: () => ipcRenderer.invoke('system:getInstalledApps'),
  getSystemMetrics: () => ipcRenderer.invoke('system:getSystemMetrics'),
  getBatteryStatus: () => ipcRenderer.invoke('system:getBatteryStatus'),
  getAudioVolume: () => ipcRenderer.invoke('system:getAudioVolume'),
  setAudioVolume: (volume: number) => ipcRenderer.invoke('system:setAudioVolume', volume),
  toggleAudioMute: () => ipcRenderer.invoke('system:toggleAudioMute'),
  selectAppFile: () => ipcRenderer.invoke('system:selectAppFile'),
  getAppIcon: (filePath: string) => ipcRenderer.invoke('system:getAppIcon', filePath),
  getRecentItems: () => ipcRenderer.invoke('filesystem:getRecentItems'),
  getDownloads: () => ipcRenderer.invoke('filesystem:getDownloads'),
  getRecentScreenshots: () => ipcRenderer.invoke('filesystem:getRecentScreenshots'),
  searchFiles: (query: string) => ipcRenderer.invoke('filesystem:searchFiles', query),
  launchApp: (appPath: string) => ipcRenderer.invoke('process:launchApp', appPath),
  openPath: (filePath: string) => ipcRenderer.invoke('process:openPath', filePath),
  openUrl: (url: string) => ipcRenderer.invoke('process:openUrl', url),
  runCommand: (command: string) => ipcRenderer.invoke('process:runCommand', command),
  getMediaInfo: () => ipcRenderer.invoke('media:getInfo'),
  mediaControl: (action: string) => ipcRenderer.invoke('media:control', action),
  mediaSeek: (seconds: number) => ipcRenderer.invoke('media:seek', seconds),
  captureScreenshot: (mode: string) => ipcRenderer.invoke('screenshot:capture', mode),
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (config: any) => ipcRenderer.invoke('config:save', config),
  setAlwaysOnTop: (value: boolean) => ipcRenderer.invoke('window:setAlwaysOnTop', value),
  setAutoHide: (value: boolean) => ipcRenderer.invoke('window:setAutoHide', value),
  setLaunchAtStartup: (value: boolean) => ipcRenderer.invoke('startup:setLaunchAtStartup', value),
  getLaunchAtStartup: () => ipcRenderer.invoke('startup:getLaunchAtStartup'),
  showWidgetLibrary: () => ipcRenderer.invoke('window:showWidgetLibrary'),
  showSettings: () => ipcRenderer.invoke('window:showSettings'),
  setModalOpen: (isOpen: boolean) => ipcRenderer.invoke('window:setModalOpen', isOpen),
  setPopoverOpen: (isOpen: boolean) => ipcRenderer.invoke('window:setPopoverOpen', isOpen),
  setIgnoreMouseEvents: (ignore: boolean, forward?: boolean) => ipcRenderer.invoke('window:setIgnoreMouseEvents', ignore, forward),
  hideWindow: () => ipcRenderer.invoke('window:hide'),
  quitApp: () => ipcRenderer.invoke('app:quit'),
  onDockConfigChanged: (callback: (config: any) => void) => {
    const handler = (_event: any, config: any) => callback(config);
    ipcRenderer.on('dock:configChanged', handler);
    return () => ipcRenderer.removeListener('dock:configChanged', handler);
  },
  onShowWidgetLibrary: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('dock:showWidgetLibrary', handler);
    return () => ipcRenderer.removeListener('dock:showWidgetLibrary', handler);
  },
  onShowSettings: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('dock:showSettings', handler);
    return () => ipcRenderer.removeListener('dock:showSettings', handler);
  },
  onShowApp: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('dock:showApp', handler);
    return () => ipcRenderer.removeListener('dock:showApp', handler);
  },
  showUninstall: () => ipcRenderer.invoke('setup:showUninstall'),
  getScreenshotsDir: () => ipcRenderer.invoke('filesystem:getScreenshotsDir'),
  appReady: () => ipcRenderer.send('app:ready'),
});
