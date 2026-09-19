import React, { useState, useRef } from 'react';
import { useWidgetStore } from '../store/widgetStore';
import { useConfigStore } from '../store/configStore';
import { usePopover } from '../App';
import WidgetWrapper from './WidgetWrapper';
import { useDragReorder } from '../hooks/useDragReorder';
import { WidgetId, WIDGET_IDS, DockAppItem } from '../../shared/constants';
import { IconPlus, IconTrash, IconPlay } from './Icons';
import dokiiiLogo from '../assets/dokiii-logo.jpg';
import StorageWidget from '../widgets/StorageWidget';
import CurrencyWidget from '../widgets/CurrencyWidget';
import NotesWidget from '../widgets/NotesWidget';
import WorldClockWidget from '../widgets/WorldClockWidget';
import MediaPlayerWidget from '../widgets/MediaPlayerWidget';
import ClockWidget from '../widgets/ClockWidget';
import ProgressWidget from '../widgets/ProgressWidget';
import AppLauncherWidget from '../widgets/AppLauncherWidget';
import RecentlyOpenedWidget from '../widgets/RecentlyOpenedWidget';
import RecycleBinWidget from '../widgets/RecycleBinWidget';
import FileSearchWidget from '../widgets/FileSearchWidget';
import CommandsWidget from '../widgets/CommandsWidget';
import DownloadsWidget from '../widgets/DownloadsWidget';
import RecentScreenshotsWidget from '../widgets/RecentScreenshotsWidget';
import ScreenshotCaptureWidget from '../widgets/ScreenshotCaptureWidget';
import MacIcon from './MacIcon';
import AddAppModal from './AddAppModal';
import useDockMagnification from '../hooks/useDockMagnification';

const DayProgress = () => <ProgressWidget type="day" />;
const MonthProgress = () => <ProgressWidget type="month" />;
const YearProgress = () => <ProgressWidget type="year" />;

const WIDGET_COMPONENTS: Record<string, React.FC> = {
  [WIDGET_IDS.STORAGE]: StorageWidget,
  [WIDGET_IDS.CURRENCY]: CurrencyWidget,
  [WIDGET_IDS.NOTES]: NotesWidget,
  [WIDGET_IDS.WORLD_CLOCK]: WorldClockWidget,
  [WIDGET_IDS.MEDIA_PLAYER]: MediaPlayerWidget,
  [WIDGET_IDS.CLOCK]: ClockWidget,
  [WIDGET_IDS.DAY_PROGRESS]: DayProgress,
  [WIDGET_IDS.MONTH_PROGRESS]: MonthProgress,
  [WIDGET_IDS.YEAR_PROGRESS]: YearProgress,
  [WIDGET_IDS.APP_LAUNCHER]: AppLauncherWidget,
  [WIDGET_IDS.RECENTLY_OPENED]: RecentlyOpenedWidget,
  [WIDGET_IDS.RECYCLE_BIN]: RecycleBinWidget,
  [WIDGET_IDS.FILE_SEARCH]: FileSearchWidget,
  [WIDGET_IDS.COMMANDS]: CommandsWidget,
  [WIDGET_IDS.DOWNLOADS]: DownloadsWidget,
  [WIDGET_IDS.RECENT_SCREENSHOTS]: RecentScreenshotsWidget,
  [WIDGET_IDS.SCREENSHOT_CAPTURE]: ScreenshotCaptureWidget,
};

export const Dock: React.FC = () => {
  const { enabledWidgets, widgetOrder } = useWidgetStore();
  const {
    dock,
    toggleDokiiiApp,
    openDokiiiApp,
    toggleWidgetLibrary,
    toggleSettings,
    removePinnedApp,
  } = useConfigStore();
  const { activePopover } = usePopover();
  const { dragProps, dragOverId, draggedId, isDragging } = useDragReorder();

  const [isHovered, setIsHovered] = useState(false);
  const [bouncingAppId, setBouncingAppId] = useState<string | null>(null);
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const [appContextMenu, setAppContextMenu] = useState<{
    id: string;
    x: number;
    y: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  } | null>(null);

  const dockRef = useRef<HTMLDivElement>(null);

  const position = dock.position || 'bottom';
  const baseSize = dock.size || 64;
  const magnification = dock.magnification ?? true;
  const maxScale = dock.magnificationScale || 1.65;

  const sortedWidgets = Array.from(new Set(widgetOrder)).filter((id) => enabledWidgets.includes(id));
  const pinnedApps = dock.pinnedApps || [];

  const totalItemCount = 1 + pinnedApps.length + 1 + (sortedWidgets.length > 0 ? 1 : 0) + sortedWidgets.length;
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const maxAllowedWidth = screenWidth - 48;
  const defaultTotalWidth = totalItemCount * (baseSize + (dock.widgetSpacing ?? 4));
  const needsCompact = position === 'bottom' && defaultTotalWidth > maxAllowedWidth;
  const effectiveBaseSize = needsCompact
    ? Math.max(38, Math.min(baseSize, Math.floor((maxAllowedWidth - 80) / Math.max(1, totalItemCount))))
    : baseSize;
  const effectiveSpacing = needsCompact ? 2 : (dock.widgetSpacing ?? 4);

  const { onPointerEnter, onPointerMove, onPointerLeave, hoveredItem } = useDockMagnification({
    dockRef,
    enabled: magnification,
    maxScale,
    radius: 165,
    position,
    isDragging,
  });

  const isAutoHideEnabled = dock.autoHide || dock.showOnHover;
  const isVisible = isHovered || activePopover !== null || isAddAppOpen || appContextMenu !== null;

  const handleContainerPointerEnter = () => {
    setIsHovered(true);
    window.electronAPI?.setIgnoreMouseEvents(false);
    onPointerEnter();
  };

  const handleContainerPointerLeave = () => {
    setIsHovered(false);
    onPointerLeave();
    if (!activePopover && !isAddAppOpen && !appContextMenu) {
      window.electronAPI?.setIgnoreMouseEvents(true, true);
    }
  };

  const handleLaunchApp = (appItem: DockAppItem) => {
    setBouncingAppId(appItem.id);
    setTimeout(() => setBouncingAppId(null), 1200);

    if (appItem.id === 'settings') {
      openDokiiiApp('settings');
      return;
    }
    if (appItem.id === 'calendar') {
      try {
        window.electronAPI?.runCommand('start outlookcal:');
      } catch {
        window.electronAPI?.runCommand('start ms-clock:');
      }
      return;
    }
    if (appItem.id === 'photos') {
      window.electronAPI?.launchApp('ms-photos:');
      return;
    }
    if (appItem.id === 'terminal') {
      window.electronAPI?.runCommand('terminal');
      return;
    }
    if (appItem.id === 'finder') {
      window.electronAPI?.runCommand('explorer');
      return;
    }
    if (appItem.path.startsWith('http')) {
      window.electronAPI?.openUrl(appItem.path);
      return;
    }
    window.electronAPI?.launchApp(appItem.path);
  };

  const handleAppContextMenu = (e: React.MouseEvent, appId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setAppContextMenu({
      id: appId,
      x: rect.left,
      y: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    });
  };

  const getDockPositionStyle = (): React.CSSProperties => {
    if (position === 'left') {
      return {
        position: 'fixed',
        left: '12px',
        top: '50%',
        transform: isAutoHideEnabled && !isVisible ? 'translateX(calc(-100% - 24px)) translateY(-50%)' : 'translateX(0) translateY(-50%)',
        flexDirection: 'column',
        height: 'max-content',
        maxHeight: '92vh',
        width: `${baseSize + 12}px`,
        overflow: 'visible',
      };
    }
    if (position === 'right') {
      return {
        position: 'fixed',
        right: '12px',
        top: '50%',
        transform: isAutoHideEnabled && !isVisible ? 'translateX(calc(100% + 24px)) translateY(-50%)' : 'translateX(0) translateY(-50%)',
        flexDirection: 'column',
        height: 'max-content',
        maxHeight: '92vh',
        width: `${baseSize + 12}px`,
        overflow: 'visible',
      };
    }
    return {
      position: 'fixed',
      bottom: '12px',
      left: '50%',
      transform: isAutoHideEnabled && !isVisible ? 'translateX(-50%) translateY(calc(100% + 24px))' : 'translateX(-50%) translateY(0)',
      flexDirection: 'row',
      height: `${effectiveBaseSize + 8}px`,
      width: 'max-content',
      maxWidth: 'calc(100vw - 32px)',
      overflow: 'visible',
    };
  };

  return (
    <>
      <div
        ref={dockRef}
        className={`dock-container macos-dock-style dock-${position}${isAutoHideEnabled ? ' auto-hide' : ''}${isAutoHideEnabled && isVisible ? ' visible' : ''}`}
        onPointerEnter={handleContainerPointerEnter}
        onPointerLeave={handleContainerPointerLeave}
        onPointerMove={onPointerMove}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        style={{
          ...getDockPositionStyle(),
          borderRadius: `${dock.cornerRadius || 22}px`,
          gap: `${effectiveSpacing}px`,
          backdropFilter: `blur(${dock.blur || 50}px) saturate(180%)`,
          WebkitBackdropFilter: `blur(${dock.blur || 50}px) saturate(180%)`,
          opacity: isAutoHideEnabled && !isVisible ? 0 : 1,
        }}
      >
        <button
          data-dock-item="dokiii-logo"
          data-dock-title="DOKIII Control Center"
          className="dock-logo-btn macos-dock-item"
          onClick={() => toggleDokiiiApp()}
          title=""
          onDragStart={(e) => e.preventDefault()}
        >
          <img src={dokiiiLogo} alt="DOKIII" draggable={false} onDragStart={(e) => e.preventDefault()} />
        </button>

        {pinnedApps.map((app) => {
          const isBouncing = bouncingAppId === app.id;
          return (
            <div
              key={app.id}
              data-dock-item={app.id}
              data-dock-title={app.name}
              className={`macos-app-slot${isBouncing ? ' app-bouncing' : ''}`}
              onClick={() => handleLaunchApp(app)}
              onContextMenu={(e) => handleAppContextMenu(e, app.id)}
            >
              <div className="macos-icon-wrapper">
                <MacIcon app={app} size={Math.round(baseSize * 0.72)} live={dock.liveIcons ?? true} />
              </div>
              {dock.showIndicators !== false && app.running && <div className="macos-running-dot" />}
            </div>
          );
        })}

        <button
          data-dock-item="dock-add-btn"
          data-dock-title="Add Application"
          className="dock-add-btn macos-dock-item"
          onClick={() => setIsAddAppOpen(true)}
          title=""
        >
          <IconPlus size={14} />
        </button>

        {sortedWidgets.length > 0 && <div className="widget-separator macos-separator" />}

        {sortedWidgets.map((id, index) => {
          const WidgetComponent = WIDGET_COMPONENTS[id];
          if (!WidgetComponent) return null;

          const widgetName = id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

          return (
            <React.Fragment key={id}>
              <div
                data-dock-item={id}
                data-dock-title={widgetName}
                className={`widget-slot${draggedId === id ? ' dragging' : ''}${dragOverId === id ? ' drag-over-left' : ''}`}
                {...dragProps(id as WidgetId)}
              >
                <WidgetWrapper widgetId={id as WidgetId}>
                  <WidgetComponent />
                </WidgetWrapper>
              </div>
              {index < sortedWidgets.length - 1 && <div className="widget-separator" />}
            </React.Fragment>
          );
        })}
      </div>

      {hoveredItem && (
        <div
          className="macos-dock-tooltip"
          style={{
            position: 'fixed',
            left: `${hoveredItem.rect.x + hoveredItem.rect.width / 2}px`,
            top: position === 'left' || position === 'right'
              ? `${hoveredItem.rect.y + hoveredItem.rect.height / 2}px`
              : `${hoveredItem.rect.top - 36}px`,
            transform: position === 'left'
              ? 'translate(20px, -50%)'
              : position === 'right'
              ? 'translate(calc(-100% - 20px), -50%)'
              : 'translateX(-50%)',
            pointerEvents: 'none',
            zIndex: 10005,
          }}
        >
          <span>{hoveredItem.title}</span>
          <div className="macos-tooltip-arrow" />
        </div>
      )}

      {appContextMenu && (() => {
        const target = pinnedApps.find((a) => a.id === appContextMenu.id);
        if (!target) return null;
        const screenW = typeof window !== 'undefined' ? window.innerWidth : 1920;
        const screenH = typeof window !== 'undefined' ? window.innerHeight : 1080;

        let menuStyle: React.CSSProperties;
        if (position === 'left') {
          menuStyle = {
            left: `${appContextMenu.right + 12}px`,
            top: `${Math.max(16, Math.min(screenH - 180, appContextMenu.y + appContextMenu.height / 2))}px`,
            transform: 'translateY(-50%)',
          };
        } else if (position === 'right') {
          menuStyle = {
            right: `${screenW - appContextMenu.x + 12}px`,
            top: `${Math.max(16, Math.min(screenH - 180, appContextMenu.y + appContextMenu.height / 2))}px`,
            transform: 'translateY(-50%)',
          };
        } else {
          const clampedX = Math.max(110, Math.min(screenW - 110, appContextMenu.x + appContextMenu.width / 2));
          const bottomPos = screenH - appContextMenu.y + 12;
          menuStyle = {
            left: `${clampedX}px`,
            bottom: `${bottomPos}px`,
            transform: 'translateX(-50%)',
          };
        }

        return (
          <div
            className="widget-library-overlay"
            style={{ background: 'transparent', zIndex: 10010 }}
            onClick={() => setAppContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setAppContextMenu(null);
            }}
          >
            <div
              className="dock-app-context-menu"
              style={menuStyle}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dock-app-menu-header">
                <MacIcon app={target} size={18} live={false} />
                <span className="dock-app-menu-title">{target.name}</span>
              </div>
              <div className="context-menu-divider" />
              <button
                className="context-menu-item"
                onClick={() => {
                  handleLaunchApp(target);
                  setAppContextMenu(null);
                }}
              >
                <IconPlay size={12} />
                <span>Open</span>
              </button>
              <div className="context-menu-divider" />
              <button
                className="context-menu-item danger"
                onClick={() => {
                  removePinnedApp(target.id);
                  setAppContextMenu(null);
                }}
              >
                <IconTrash size={12} />
                <span>Remove from Dock</span>
              </button>
            </div>
          </div>
        );
      })()}

      <AddAppModal isOpen={isAddAppOpen} onClose={() => setIsAddAppOpen(false)} />
    </>
  );
};

export default Dock;
