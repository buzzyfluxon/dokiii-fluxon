import React, { useRef, useEffect } from 'react';
import { WidgetId, WIDGET_REGISTRY } from '../../shared/constants';
import { useWidgetStore } from '../store/widgetStore';
import { useConfigStore } from '../store/configStore';
import { usePopover } from '../App';
import { IconTrash, IconSettings, IconPlus } from './Icons';

interface Props {
  widgetId: WidgetId;
  children: React.ReactNode;
}

const WidgetWrapper: React.FC<Props> = ({ widgetId, children }) => {
  const { removeWidget } = useWidgetStore();
  const { toggleSettings, toggleWidgetLibrary } = useConfigStore();
  const { activePopover, openPopover, closePopover } = usePopover();
  const menuRef = useRef<HTMLDivElement>(null);

  const menuId = `context-menu:${widgetId}`;
  const isOpen = activePopover === menuId;

  const widgetName =
    WIDGET_REGISTRY.find((w) => w.id === widgetId)?.name ||
    widgetId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closePopover();
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, closePopover]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOpen) {
      closePopover();
    } else {
      openPopover(menuId);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    closePopover();
    removeWidget(widgetId);
  };

  const handleOpenSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    closePopover();
    toggleSettings();
  };

  const handleOpenLibrary = (e: React.MouseEvent) => {
    e.stopPropagation();
    closePopover();
    toggleWidgetLibrary();
  };

  return (
    <div className="widget-capsule" onContextMenu={handleContextMenu}>
      {children}
      {isOpen && (
        <div
          ref={menuRef}
          className="widget-context-menu"
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="context-menu-header">{widgetName}</div>
          <div className="context-menu-divider" />
          <button className="context-menu-item danger" onClick={handleRemove}>
            <IconTrash size={13} />
            <span>Delete Widget</span>
          </button>
          <div className="context-menu-divider" />
          <button className="context-menu-item" onClick={handleOpenLibrary}>
            <IconPlus size={13} />
            <span>Add Widgets</span>
          </button>
          <button className="context-menu-item" onClick={handleOpenSettings}>
            <IconSettings size={13} />
            <span>Dock Settings</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default WidgetWrapper;
