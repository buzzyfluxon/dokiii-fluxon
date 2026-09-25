import React, { useState, useEffect, useRef } from 'react';
import { useConfigStore } from '../../store/configStore';
import { useLiquidGlassStore } from '../../store/liquidGlassStore';
import {
  DesktopWidgetItem,
  DesktopWidgetSize,
  DEFAULT_DESKTOP_WIDGETS,
  DESKTOP_WIDGET_SIZES,
} from '../../../shared/constants';
import { WorldClockWidget } from './WorldClockWidget';
import { DateDayWidget } from './DateDayWidget';
import { SystemControlsWidget } from './SystemControlsWidget';
import { SystemMonitorWidget } from './SystemMonitorWidget';
import { BatteryWidget } from './BatteryWidget';
import { AnalogClockWidget } from './AnalogClockWidget';
import { CalendarMonthWidget } from './CalendarMonthWidget';
import { MoonPhaseWidget } from './MoonPhaseWidget';
import { CustomTextWidget } from './CustomTextWidget';
import { QuoteCardWidget } from './QuoteCardWidget';
import { CountdownWidget } from './CountdownWidget';
import { GoalsWidget } from './GoalsWidget';
import { CarCardWidget } from './CarCardWidget';
import { TravelCardWidget } from './TravelCardWidget';
import { BookCardWidget } from './BookCardWidget';
import { MovieCardWidget } from './MovieCardWidget';
import { PolaroidWidget } from './PolaroidWidget';
import { GalleryWidget } from './GalleryWidget';
import { MoodBoardWidget } from './MoodBoardWidget';
import { Rect, findFreeSpot, getDockReservedRect, rectsOverlap, resolveWidgetRect } from '../../utils/widgetPlacement';
import './desktop-widgets.css';

const BASE_SIZE: Record<DesktopWidgetSize, { width: number; height: number; padding: number }> = {
  small: { ...DESKTOP_WIDGET_SIZES.small, padding: 14 },
  medium: { ...DESKTOP_WIDGET_SIZES.medium, padding: 16 },
  large: { ...DESKTOP_WIDGET_SIZES.large, padding: 18 },
};

const MIN_WIDGET_WIDTH = 100;
const MIN_WIDGET_HEIGHT = 80;

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const RESIZE_HANDLES: { dir: ResizeDir; className: string }[] = [
  { dir: 'n', className: 'edge edge-n' },
  { dir: 's', className: 'edge edge-s' },
  { dir: 'e', className: 'edge edge-e' },
  { dir: 'w', className: 'edge edge-w' },
  { dir: 'ne', className: 'corner corner-ne' },
  { dir: 'nw', className: 'corner corner-nw' },
  { dir: 'se', className: 'corner corner-se' },
  { dir: 'sw', className: 'corner corner-sw' },
];

export const DesktopWidgetsLayer: React.FC = () => {
  const {
    dock,
    updateDesktopWidgetPos,
    setDesktopWidgetSize,
    updateDesktopWidgetData,
    removeDesktopWidget,
  } = useConfigStore();

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [sizes, setSizes] = useState<Record<string, { width: number; height: number }>>({});
  const [activeResize, setActiveResize] = useState<{
    id: string;
    dir: ResizeDir;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);
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
  const isLiquidGlass = Boolean(dock.liquidGlassEnabled);
  const desktopSample = useLiquidGlassStore((s) => s.getDesktopWidgetsSample());

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

  useEffect(() => {
    if (activeResize) return;
    const initialSizes: Record<string, { width: number; height: number }> = {};
    widgets.forEach((w) => {
      const base = BASE_SIZE[w.size] || BASE_SIZE.small;
      initialSizes[w.id] = { width: w.width ?? base.width, height: w.height ?? base.height };
    });
    setSizes(initialSizes);
  }, [widgets, activeResize]);

  useEffect(() => {
    const refit = () => {
      if (activeDragId || activeResize) return;
      const winW = window.innerWidth || 1920;
      const winH = window.innerHeight || 1080;
      const current = useConfigStore.getState().dock.desktopWidgets || [];
      let changed = false;
      const nextPositions: Record<string, { x: number; y: number }> = {};

      current.forEach((w) => {
        const rect = resolveWidgetRect(w, winW, winH);
        const outOfBounds =
          rect.x < 0 || rect.y < 0 || rect.x + rect.width > winW || rect.y + rect.height > winH;
        if (outOfBounds) {
          const clampedX = Math.max(10, Math.min(winW - rect.width - 10, rect.x));
          const clampedY = Math.max(10, Math.min(winH - rect.height - 10, rect.y));
          nextPositions[w.id] = { x: Math.round(clampedX), y: Math.round(clampedY) };
          changed = true;
        }
      });

      if (changed) {
        const updated = current.map((w) => (nextPositions[w.id] ? { ...w, ...nextPositions[w.id] } : w));
        useConfigStore.getState().updateConfig({ desktopWidgets: updated });
        setPositions((prev) => ({ ...prev, ...nextPositions }));
      }
    };

    refit();
    window.addEventListener('resize', refit);
    return () => window.removeEventListener('resize', refit);
  }, [activeDragId, activeResize]);

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
    const base = BASE_SIZE[targetWidget?.size || 'small'];
    const currentSize = sizes[activeDragId] || base;
    const widgetW = currentSize.width;
    const widgetH = currentSize.height;

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

  const handleResizeHandlePointerDown = (id: string, dir: ResizeDir, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const widget = widgets.find((w) => w.id === id);
    if (widget?.locked) return;
    const base = BASE_SIZE[widget?.size || 'small'];
    const currentSize = sizes[id] || { width: base.width, height: base.height };
    const currentPos = positions[id] || { x: 50, y: 50 };
    setActiveResize({
      id,
      dir,
      startX: e.clientX,
      startY: e.clientY,
      startW: currentSize.width,
      startH: currentSize.height,
      startPosX: currentPos.x,
      startPosY: currentPos.y,
    });
    try {
      window.electronAPI?.setIgnoreMouseEvents(false);
    } catch (_) {}
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizeHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeResize) return;
    const { id, dir, startX, startY, startW, startH, startPosX, startPosY } = activeResize;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newW = startW;
    let newH = startH;
    let newX = startPosX;
    let newY = startPosY;

    if (dir.includes('e')) newW = startW + dx;
    if (dir.includes('s')) newH = startH + dy;
    if (dir.includes('w')) {
      newW = startW - dx;
      newX = startPosX + dx;
    }
    if (dir.includes('n')) {
      newH = startH - dy;
      newY = startPosY + dy;
    }

    if (newW < MIN_WIDGET_WIDTH) {
      if (dir.includes('w')) newX = startPosX + (startW - MIN_WIDGET_WIDTH);
      newW = MIN_WIDGET_WIDTH;
    }
    if (newH < MIN_WIDGET_HEIGHT) {
      if (dir.includes('n')) newY = startPosY + (startH - MIN_WIDGET_HEIGHT);
      newH = MIN_WIDGET_HEIGHT;
    }

    const winW = window.innerWidth;
    const winH = window.innerHeight;
    newX = Math.max(0, Math.min(winW - newW, newX));
    newY = Math.max(0, Math.min(winH - newH, newY));
    newW = Math.min(newW, winW - newX);
    newH = Math.min(newH, winH - newY);

    setSizes((prev) => ({ ...prev, [id]: { width: newW, height: newH } }));
    setPositions((prev) => ({ ...prev, [id]: { x: newX, y: newY } }));
  };

  const handleResizeHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeResize) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
    const { id, startW, startH, startPosX, startPosY } = activeResize;
    const finalSize = sizes[id];
    const finalPos = positions[id];
    if (finalSize && finalPos) {
      const winW = window.innerWidth || 1920;
      const winH = window.innerHeight || 1080;
      const startRect: Rect = { x: startPosX, y: startPosY, width: startW, height: startH };
      const nextRect: Rect = { x: finalPos.x, y: finalPos.y, width: finalSize.width, height: finalSize.height };
      const blocked = widgets
        .filter((w) => w.id !== id)
        .map((w) => resolveWidgetRect(w, winW, winH))
        .some((rect) => rectsOverlap(nextRect, rect) && !rectsOverlap(startRect, rect));
      if (blocked) {
        setSizes((prev) => ({ ...prev, [id]: { width: startW, height: startH } }));
        setPositions((prev) => ({ ...prev, [id]: { x: startPosX, y: startPosY } }));
        useConfigStore.getState().showNotice("No space to resize here. It would cover another widget.");
        setActiveResize(null);
        return;
      }
    }
    if (finalSize) {
      updateDesktopWidgetData(id, {
        width: Math.round(finalSize.width),
        height: Math.round(finalSize.height),
        ...(finalPos ? { x: Math.round(finalPos.x), y: Math.round(finalPos.y) } : {}),
      });
    }
    setActiveResize(null);
  };

  const handleToggleLock = (id: string) => {
    const target = widgets.find((w) => w.id === id);
    if (target) {
      updateDesktopWidgetData(id, { locked: !target.locked });
    }
    closeContextMenu();
  };

  const handleResetWidget = (id: string) => {
    const winW = window.innerWidth || 1920;
    const winH = window.innerHeight || 1080;
    const defaultWidget = DEFAULT_DESKTOP_WIDGETS.find((w) => w.id === id);
    if (defaultWidget) {
      let x = defaultWidget.x;
      let y = defaultWidget.y;
      if (x < 0) x = winW + x;
      if (y < 0) y = winH + y;
      updateDesktopWidgetData(id, {
        x,
        y,
        size: defaultWidget.size,
        width: undefined,
        height: undefined,
      });
      setPositions((prev) => ({ ...prev, [id]: { x, y } }));
      setSizes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      const current = widgets.find((w) => w.id === id);
      const size = current?.size || 'small';
      const others = widgets.filter((w) => w.id !== id);
      const reserved = dock.autoHide
        ? null
        : getDockReservedRect(dock.position || 'bottom', dock.size || 64, winW, winH);
      const spot = findFreeSpot(others, size, winW, winH, reserved);
      if (spot) {
        updateDesktopWidgetData(id, { x: spot.x, y: spot.y, width: undefined, height: undefined });
        setPositions((prev) => ({ ...prev, [id]: { x: spot.x, y: spot.y } }));
      } else {
        updateDesktopWidgetData(id, { width: undefined, height: undefined });
        useConfigStore.getState().showNotice("No free space to reset this widget's position.");
      }
      setSizes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
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
      case 'custom-text':
        return (
          <CustomTextWidget
            size={item.size}
            data={item.data}
            onUpdateData={(patch) => updateDesktopWidgetData(item.id, { data: { ...(item.data || {}), ...patch } })}
          />
        );
      case 'quote-card':
        return (
          <QuoteCardWidget
            size={item.size}
            data={item.data}
            onUpdateData={(patch) => updateDesktopWidgetData(item.id, { data: { ...(item.data || {}), ...patch } })}
          />
        );
      case 'countdown':
        return (
          <CountdownWidget
            size={item.size}
            data={item.data}
            onUpdateData={(patch) => updateDesktopWidgetData(item.id, { data: { ...(item.data || {}), ...patch } })}
          />
        );
      case 'goals':
        return (
          <GoalsWidget
            size={item.size}
            data={item.data}
            onUpdateData={(patch) => updateDesktopWidgetData(item.id, { data: { ...(item.data || {}), ...patch } })}
          />
        );
      case 'car-card':
        return (
          <CarCardWidget
            size={item.size}
            data={item.data}
            onUpdateData={(patch) => updateDesktopWidgetData(item.id, { data: { ...(item.data || {}), ...patch } })}
          />
        );
      case 'travel-card':
        return (
          <TravelCardWidget
            size={item.size}
            data={item.data}
            onUpdateData={(patch) => updateDesktopWidgetData(item.id, { data: { ...(item.data || {}), ...patch } })}
          />
        );
      case 'book-card':
        return (
          <BookCardWidget
            size={item.size}
            data={item.data}
            onUpdateData={(patch) => updateDesktopWidgetData(item.id, { data: { ...(item.data || {}), ...patch } })}
          />
        );
      case 'movie-card':
        return (
          <MovieCardWidget
            size={item.size}
            data={item.data}
            onUpdateData={(patch) => updateDesktopWidgetData(item.id, { data: { ...(item.data || {}), ...patch } })}
          />
        );
      case 'polaroid':
        return (
          <PolaroidWidget
            size={item.size}
            data={item.data}
            onUpdateData={(patch) => updateDesktopWidgetData(item.id, { data: { ...(item.data || {}), ...patch } })}
          />
        );
      case 'gallery':
        return (
          <GalleryWidget
            size={item.size}
            data={item.data}
            onUpdateData={(patch) => updateDesktopWidgetData(item.id, { data: { ...(item.data || {}), ...patch } })}
          />
        );
      case 'mood-board':
        return (
          <MoodBoardWidget
            size={item.size}
            data={item.data}
            onUpdateData={(patch) => updateDesktopWidgetData(item.id, { data: { ...(item.data || {}), ...patch } })}
          />
        );
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

        const base = BASE_SIZE[item.size] || BASE_SIZE.small;
        const dims = sizes[item.id] || { width: item.width ?? base.width, height: item.height ?? base.height };
        const scaleX = dims.width / base.width;
        const scaleY = dims.height / base.height;
        const uniformScale = Math.min(scaleX, scaleY);

        const isDragging = activeDragId === item.id;
        const isResizing = activeResize?.id === item.id;

        return (
          <div
            key={item.id}
            className={`desktop-widget-container size-${item.size} ${isDragging ? 'is-dragging' : ''} ${isResizing ? 'is-resizing' : ''} ${item.locked ? 'is-locked' : ''}${isLiquidGlass ? ' liquid-glass-active' : ''}`}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              width: `${dims.width}px`,
              height: `${dims.height}px`,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...(isLiquidGlass && desktopSample
                ? {
                    background: desktopSample.bgRgba,
                    borderColor: desktopSample.borderColor,
                    boxShadow: isDragging ? undefined : desktopSample.boxShadow,
                  }
                : {}),
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
                if (!activeDragId && !activeResize && !contextMenu && !editPrompt) {
                  window.electronAPI?.setIgnoreMouseEvents(true, true);
                }
              } catch (_) {}
            }}
          >
            <div
              className="desktop-widget-content-scaler"
              style={{
                width: `${base.width}px`,
                height: `${base.height}px`,
                padding: `${base.padding}px`,
                transform: `scale(${uniformScale})`,
                flexShrink: 0,
              }}
            >
              {renderWidgetContent(item)}
            </div>
            {!item.locked &&
              RESIZE_HANDLES.map(({ dir, className }) => (
                <div
                  key={dir}
                  className={`desktop-widget-resize-handle ${className}`}
                  onPointerDown={(e) => handleResizeHandlePointerDown(item.id, dir, e)}
                  onPointerMove={handleResizeHandlePointerMove}
                  onPointerUp={handleResizeHandlePointerUp}
                />
              ))}
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
            <button className="desk-context-item" onClick={() => handleResetWidget(contextMenu.id)}>
              <span>Reset Position & Size</span>
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
