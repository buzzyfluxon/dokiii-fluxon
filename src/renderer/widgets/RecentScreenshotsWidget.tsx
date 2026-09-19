import React, { useState, useEffect } from 'react';
import { usePopover } from '../App';
import { IconCamera, IconClose } from '../components/Icons';
import type { ScreenshotFile } from '../types/widget';

export default function RecentScreenshotsWidget() {
  const { activePopover, openPopover, closePopover } = usePopover();
  const isOpen = activePopover === 'recent-screenshots';

  const [screenshots, setScreenshots] = useState<ScreenshotFile[]>([]);

  useEffect(() => {
    if (isOpen) {
      window.electronAPI.getRecentScreenshots().then(setScreenshots).catch(() => {});
    }
  }, [isOpen]);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      closePopover();
    } else {
      openPopover('recent-screenshots');
    }
  };

  return (
    <div className="screenshots-widget">
      <div className="screenshots-icon" onClick={toggleOpen} title="Recent Screenshots">
        <IconCamera size={18} />
      </div>
      {isOpen && (
        <div className="popover" onClick={(e) => e.stopPropagation()} style={{ width: '280px' }}>
          <div className="popover-header">
            <span className="popover-title">Recent Screenshots</span>
            <button className="popover-close" onClick={closePopover} title="Close">
              <IconClose size={10} />
            </button>
          </div>
          {screenshots.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>No screenshots found</div>
          ) : (
            <div className="screenshots-grid" style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {screenshots.map((s) => (
                <div
                  key={s.path}
                  className="screenshot-thumb"
                  onClick={() => {
                    window.electronAPI.openPath(s.path);
                    closePopover();
                  }}
                  title={s.name}
                >
                  <img src={`file:///${s.path.replace(/\\/g, '/')}`} alt={s.name} draggable={false} onDragStart={(e) => e.preventDefault()} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
