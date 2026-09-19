import React, { useEffect, createContext, useContext, useState, useCallback } from 'react';
import { useWidgetStore } from './store/widgetStore';
import { useConfigStore } from './store/configStore';
import Dock from './components/Dock';
import WidgetLibrary from './components/WidgetLibrary';
import Settings from './components/Settings';
import { DesktopWidgetsLayer } from './components/desktop-widgets/DesktopWidgetsLayer';
import { DokiiiApp } from './components/DokiiiApp';
import Halo from './components/halo/Halo';
import './styles/global.css';
import './styles/dock.css';
import './styles/widgets.css';
import './styles/widget-library.css';

interface PopoverContextType {
  activePopover: string | null;
  openPopover: (id: string) => void;
  closePopover: () => void;
}

const PopoverContext = createContext<PopoverContextType>({
  activePopover: null,
  openPopover: () => {},
  closePopover: () => {},
});

export const usePopover = () => useContext(PopoverContext);

const App: React.FC = () => {
  const initWidget = useWidgetStore((s) => s.init);
  const initConfig = useConfigStore((s) => s.init);
  const updateConfig = useConfigStore((s) => s.updateConfig);
  const isWidgetLibraryOpen = useConfigStore((s) => s.isWidgetLibraryOpen);
  const isSettingsOpen = useConfigStore((s) => s.isSettingsOpen);
  const isDokiiiAppOpen = useConfigStore((s) => s.isDokiiiAppOpen);
  const toggleWidgetLibrary = useConfigStore((s) => s.toggleWidgetLibrary);
  const toggleSettings = useConfigStore((s) => s.toggleSettings);
  const openDokiiiApp = useConfigStore((s) => s.openDokiiiApp);
  const closeOverlays = useConfigStore((s) => s.closeOverlays);

  const [activePopover, setActivePopover] = useState<string | null>(null);

  const openPopover = useCallback((id: string) => {
    setActivePopover(id);
    window.electronAPI?.setPopoverOpen(true);
  }, []);

  const closePopover = useCallback(() => {
    setActivePopover(null);
    window.electronAPI?.setPopoverOpen(false);
  }, []);

  useEffect(() => {
    initWidget();
    initConfig();
  }, [initWidget, initConfig]);

  useEffect(() => {
    const isModal = isWidgetLibraryOpen || isSettingsOpen || isDokiiiAppOpen;
    window.electronAPI?.setModalOpen(isModal);
  }, [isWidgetLibraryOpen, isSettingsOpen, isDokiiiAppOpen]);

  useEffect(() => {
    const removeShowLibrary = window.electronAPI?.onShowWidgetLibrary(() => {
      toggleWidgetLibrary();
    });
    const removeShowSettings = window.electronAPI?.onShowSettings(() => {
      toggleSettings();
    });
    const removeShowApp = window.electronAPI?.onShowApp?.(() => {
      openDokiiiApp('home');
    });
    const removeConfigChanged = window.electronAPI?.onDockConfigChanged((cfg) => {
      updateConfig(cfg);
    });

    window.electronAPI?.appReady?.();

    return () => {
      removeShowLibrary?.();
      removeShowSettings?.();
      removeShowApp?.();
      removeConfigChanged?.();
    };
  }, [toggleWidgetLibrary, toggleSettings, openDokiiiApp, updateConfig]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeOverlays();
        closePopover();
      }
    };
    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'IMG') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('dragstart', handleDragStart);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dragstart', handleDragStart);
    };
  }, [closeOverlays, closePopover]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closePopover();
    }
  };

  return (
    <PopoverContext.Provider value={{ activePopover, openPopover, closePopover }}>
      <div 
        style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
        onClick={handleContainerClick}
      >
        <Halo />
        <DesktopWidgetsLayer />
        <Dock />
        {isWidgetLibraryOpen && <WidgetLibrary />}
        {isSettingsOpen && <Settings />}
        {isDokiiiAppOpen && <DokiiiApp />}
      </div>
    </PopoverContext.Provider>
  );
};

export default App;
