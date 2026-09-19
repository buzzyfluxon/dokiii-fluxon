import React, { useState, useEffect } from 'react';
import { usePopover } from '../App';
import { IconRecent, IconFile, IconClose } from '../components/Icons';
import type { RecentItem } from '../types/widget';

export default function RecentlyOpenedWidget() {
  const { activePopover, openPopover, closePopover } = usePopover();
  const isOpen = activePopover === 'recently-opened';

  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      window.electronAPI.getRecentItems().then(setItems).catch(() => {});
    }
  }, [isOpen]);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      closePopover();
    } else {
      openPopover('recently-opened');
    }
  };

  return (
    <div className="recently-opened-widget">
      <div className="recently-opened-icon" onClick={toggleOpen} title="Recent Items">
        <IconRecent size={18} />
      </div>
      {isOpen && (
        <div className="popover" onClick={(e) => e.stopPropagation()} style={{ width: '260px' }}>
          <div className="popover-header">
            <span className="popover-title">Recent Items</span>
            <button className="popover-close" onClick={closePopover} title="Close">
              <IconClose size={10} />
            </button>
          </div>
          <div className="recent-list" style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {items.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}>No recent items</div>
            ) : (
              items.map((item) => (
                <div
                  key={item.path}
                  className="recent-item"
                  onClick={() => {
                    window.electronAPI.openPath(item.path);
                    closePopover();
                  }}
                >
                  <span className="recent-item-icon">
                    <IconFile size={13} />
                  </span>
                  <span className="recent-item-name">{item.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
