import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('setupAPI', {
  createDesktopShortcut: () => ipcRenderer.invoke('setup:createDesktopShortcut'),
  setLaunchAtStartup: (value: boolean) => ipcRenderer.invoke('setup:setLaunchAtStartup', value),
  finishSetup: () => ipcRenderer.invoke('setup:finish'),
  getAppIcon: () => ipcRenderer.invoke('setup:getAppIcon'),
  uninstall: (options: { removeShortcut: boolean; removeStartup: boolean; removeAppData: boolean }) =>
    ipcRenderer.invoke('setup:uninstall', options),
  finishUninstall: () => ipcRenderer.invoke('setup:finishUninstall'),
});
