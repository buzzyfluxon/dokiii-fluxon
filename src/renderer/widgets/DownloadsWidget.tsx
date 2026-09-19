import React, { useState, useEffect } from 'react';
import { usePopover } from '../App';
import { IconDownload, IconClose } from '../components/Icons';
import type { DownloadFile } from '../types/widget';

export default function DownloadsWidget() {
  const { activePopover, openPopover, closePopover } = usePopover();
  const isOpen = activePopover === 'downloads';

  const [downloads, setDownloads] = useState<DownloadFile[]>([]);

  useEffect(() => {
    if (isOpen) {
      window.electronAPI.getDownloads().then(setDownloads).catch(() => {});
    }
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      closePopover();
    } else {
      openPopover('downloads');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="downloads-widget" onClick={handleToggle} title="Recent Downloads">
      <div className="downloads-icon">
        <IconDownload size={18} />
      </div>
      {isOpen && (
        <div className="popover" onClick={(e) => e.stopPropagation()} style={{ width: '260px' }}>
          <div className="popover-header">
            <span className="popover-title">Recent Downloads</span>
            <button className="popover-close" onClick={closePopover} title="Close">
              <IconClose size={10} />
            </button>
          </div>
          <div className="recent-list" style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {downloads.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}>No downloads found</div>
            ) : (
              downloads.slice(0, 10).map((file) => (
                <div
                  key={file.path}
                  className="recent-item"
                  onClick={() => {
                    window.electronAPI.openPath(file.path);
                    closePopover();
                  }}
                >
                  <span className="recent-item-icon">
                    <IconDownload size={12} />
                  </span>
                  <span className="recent-item-name">{file.name}</span>
                  <span className="recent-item-date">{formatSize(file.size)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
