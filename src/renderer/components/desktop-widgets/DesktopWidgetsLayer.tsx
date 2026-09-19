import React, { useState, useEffect, useRef } from 'react';
import { useConfigStore } from '../../store/configStore';
import { DesktopWidgetItem, DesktopWidgetSize, DEFAULT_DESKTOP_WIDGETS } from '../../../shared/constants';
import { WorldClockWidget } from './WorldClockWidget';
import { DateDayWidget } from './DateDayWidget';
import { SystemControlsWidget } from './SystemControlsWidget';
import { SystemMonitorWidget } from './SystemMonitorWidget';
import { BatteryWidget } from './BatteryWidget';
import { AnalogClockWidget } from './AnalogClockWidget';
import { CalendarMonthWidget } from './CalendarMonthWidget';
import { MoonPhaseWidget } from './MoonPhaseWidget';
import './desktop-widgets.css';

export const DesktopWidgetsLayer: React.FC = () => {
  const {
    dock,
    updateDesktopWidgetPos,
    setDesktopWidgetSize,
    updateDesktopWidgetData,
    removeDesktopWidget,
    resetDesktopWidgetPositions,
  } = useConfigStore();

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [contextMenu, setContextMenu] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const [editPrompt, setEditPrompt] = useState<{
    id: string;
    field: 'customTitle';
    currentValue: string;
  } | null>(null);
  const [promptInput, setPromptInput] = useState('');

  const widgets = dock.desktopWidgets || [];
  const isVisible = dock.desktopWidgetsVisible !== false;

  useEffect(() => {
    if (activeDragId) return;
    const initialPos: Record<string, { x: number; y: number }> = {};
    const winW = window.innerWidth || 1920;
    const winH = window.innerHeight || 1080;

    widgets.forEach((w) => {
      let x = w.x;
      let y = w.y;
      if (x < 0) {
        x = winW + x;
      }
      if (y < 0) {
        y = winH + y;
      }
      initialPos[w.id] = { x, y };
    });
    setPositions(initialPos);
  }, [widgets, activeDragId]);

  const handlePointerDown = (id: string, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const targetWidget = widgets.find((w) => w.id === id);
    if (targetWidget?.locked) return;
    const current = positions[id] || { x: 50, y: 50 };
    setActiveDragId(id);
    setDragOffset({
      x: e.clientX - current.x,
      y: e.clientY - current.y,
    });
    try {
      window.electronAPI?.setIgnoreMouseEvents(false);
    } catch (_) {}
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDragId) return;
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const targetWidget = widgets.find((w) => w.id === activeDragId);
    const size = targetWidget?.size || 'small';
    const widgetW = size === 'small' ? 144 : 304;
    const widgetH = size === 'large' ? 304 : 144;

    const rawX = e.clientX - dragOffset.x;
    const rawY = e.clientY - dragOffset.y;

    const clampedX = Math.max(10, Math.min(winW - widgetW - 10, rawX));
    const clampedY = Math.max(10, Math.min(winH - widgetH - 10, rawY));

    setPositions((prev) => ({
      ...prev,
      [activeDragId]: { x: clampedX, y: clampedY },
    }));
  };

  const handlePointerUp = (id: string, e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragId === id) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
      const finalPos = positions[id];
      if (finalPos) {
        updateDesktopWidgetPos(id, finalPos.x, finalPos.y);
      }
      setActiveDragId(null);
    }
  };

  const handleContextMenu = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      id,
      x: Math.min(window.innerWidth - 180, e.clientX),
      y: Math.min(window.innerHeight - 200, e.clientY),
    });
    try {
      window.electronAPI?.setIgnoreMouseEvents(false);
    } catch (_) {}
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    try {
      if (!editPrompt) {
        window.electronAPI?.setIgnoreMouseEvents(true, true);
      }
    } catch (_) {}
  };

  const handleResize = (id: string, newSize: DesktopWidgetSize) => {
    setDesktopWidgetSize(id, newSize);
    closeContextMenu();
  };

  const handleToggleLock = (id: string) => {
    const target = widgets.find((w) => w.id === id);
    if (target) {
      updateDesktopWidgetData(id, { locked: !target.locked });
    }
    closeContextMenu();
  };

  const handleResetPositions = () => {
    resetDesktopWidgetPositions();
    const initialPos: Record<string, { x: number; y: number }> = {};
    const winW = window.innerWidth || 1920;
    const winH = window.innerHeight || 1080;

    DEFAULT_DESKTOP_WIDGETS.forEach((w) => {
      let x = w.x;
      let y = w.y;
      if (x < 0) {
        x = winW + x;
      }
      if (y < 0) {
        y = winH + y;
      }
      initialPos[w.id] = { x, y };
    });
    setPositions(initialPos);
    closeContextMenu();
  };

  const openTitlePrompt = (id: string) => {
    const w = widgets.find((item) => item.id === id);
    const currentVal = w?.customTitle || '';
    setEditPrompt({ id, field: 'customTitle', currentValue: currentVal });
    setPromptInput(currentVal);
    setContextMenu(null);
    try {
      window.electronAPI?.setIgnoreMouseEvents(false);
    } catch (_) {}
  };

  const saveTitlePrompt = () => {
    if (editPrompt) {
      updateDesktopWidgetData(editPrompt.id, { customTitle: promptInput.trim() });
      setEditPrompt(null);
      try {
        window.electronAPI?.setIgnoreMouseEvents(true, true);
      } catch (_) {}
    }
  };

  const renderWidgetContent = (item: DesktopWidgetItem) => {
    switch (item.type) {
      case 'world-clock':
        return <WorldClockWidget size={item.size} customTitle={item.customTitle} city={item.city} />;
      case 'date-day':
        return <DateDayWidget size={item.size} customTitle={item.customTitle} />;
      case 'system-controls':
        return <SystemControlsWidget size={item.size} />;
      case 'system-monitor':
        return <SystemMonitorWidget size={item.size} />;
      case 'battery':
        return <BatteryWidget size={item.size} />;
      case 'analog-clock':
        return <AnalogClockWidget size={item.size} />;
      case 'calendar':
        return <CalendarMonthWidget size={item.size} />;
      case 'moon-phase':
        return <MoonPhaseWidget size={item.size} />;
      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="desktop-widgets-layer">
      {widgets.map((item) => {
        const pos = positions[item.id] || {
          x: item.x < 0 ? window.innerWidth + item.x : item.x,
          y: item.y < 0 ? window.innerHeight + item.y : item.y,
        };

        const isDragging = activeDragId === item.id;

        return (
          <div
            key={item.id}
            className={`desktop-widget-container size-${item.size} ${isDragging ? 'is-dragging' : ''} ${item.locked ? 'is-locked' : ''}`}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
            }}
            onPointerDown={(e) => handlePointerDown(item.id, e)}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => handlePointerUp(item.id, e)}
            onContextMenu={(e) => handleContextMenu(item.id, e)}
            onMouseEnter={() => {
              try {
                window.electronAPI?.setIgnoreMouseEvents(false);
              } catch (_) {}
            }}
            onMouseLeave={() => {
              try {
                if (!activeDragId && !contextMenu && !editPrompt) {
                  window.electronAPI?.setIgnoreMouseEvents(true, true);
                }
              } catch (_) {}
            }}
          >
            {renderWidgetContent(item)}
          </div>
        );
      })}

      {contextMenu && (
        <div
          className="desk-prompt-overlay"
          onClick={closeContextMenu}
          style={{ background: 'transparent' }}
        >
          <div
            className="desk-context-menu"
            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="desk-context-item" onClick={() => handleResize(contextMenu.id, 'small')}>
              <span>Small</span>
            </button>
            <button className="desk-context-item" onClick={() => handleResize(contextMenu.id, 'medium')}>
              <span>Medium</span>
            </button>
            <button className="desk-context-item" onClick={() => handleResize(contextMenu.id, 'large')}>
              <span>Large</span>
            </button>
            <div className="desk-context-divider" />
            <button className="desk-context-item" onClick={() => openTitlePrompt(contextMenu.id)}>
              <span>Edit Title / Label</span>
            </button>
            <button className="desk-context-item" onClick={() => handleToggleLock(contextMenu.id)}>
              <span>{widgets.find((w) => w.id === contextMenu.id)?.locked ? 'Unlock Position' : 'Lock Position'}</span>
            </button>
            <button className="desk-context-item" onClick={handleResetPositions}>
              <span>Reset Positions</span>
            </button>
            <div className="desk-context-divider" />
            <button
              className="desk-context-item danger"
              onClick={() => {
                removeDesktopWidget(contextMenu.id);
                closeContextMenu();
              }}
            >
              <span>Remove Widget</span>
            </button>
          </div>
        </div>
      )}

      {editPrompt && (
        <div className="desk-prompt-overlay" onClick={() => setEditPrompt(null)}>
          <div className="desk-prompt-card" onClick={(e) => e.stopPropagation()}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Edit Widget Title</span>
            <input
              type="text"
              autoFocus
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitlePrompt();
                if (e.key === 'Escape') setEditPrompt(null);
              }}
            />
            <div className="desk-prompt-actions">
              <button className="desk-prompt-btn cancel" onClick={() => setEditPrompt(null)}>
                Cancel
              </button>
              <button className="desk-prompt-btn submit" onClick={saveTitlePrompt}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
