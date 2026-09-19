import React, { useState, useEffect } from 'react';
import { usePopover } from '../App';
import { IconApps, IconClose } from '../components/Icons';
import type { AppInfo } from '../types/widget';

export default function AppLauncherWidget() {
  const { activePopover, openPopover, closePopover } = usePopover();
  const isOpen = activePopover === 'app-launcher';

  const [apps, setApps] = useState<AppInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      window.electronAPI.getInstalledApps().then(setApps).catch(() => {});
    }
  }, [isOpen]);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      closePopover();
    } else {
      openPopover('app-launcher');
    }
  };

  const filteredApps = apps.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedApps = showAll ? filteredApps : filteredApps.slice(0, 16);

  return (
    <div className="app-launcher-widget">
      <div className="app-launcher-icon" onClick={toggleOpen} title="Applications">
        <IconApps size={18} />
      </div>
      {isOpen && (
        <div className="popover" onClick={(e) => e.stopPropagation()} style={{ width: '280px' }}>
          <div className="popover-header">
            <span className="popover-title">Applications</span>
            <button className="popover-close" onClick={closePopover} title="Close">
              <IconClose size={10} />
            </button>
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="Search installed apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <div className="app-grid" style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {displayedApps.map((app) => (
              <div
                key={app.path}
                className="app-item"
                onClick={() => {
                  window.electronAPI.launchApp(app.path);
                  closePopover();
                }}
              >
                <div className="app-item-icon">{app.name.charAt(0).toUpperCase()}</div>
                <div className="app-item-name">{app.name}</div>
              </div>
            ))}
          </div>
          {!showAll && filteredApps.length > 16 && (
            <button
              className="btn"
              style={{
                width: '100%',
                padding: '4px',
                fontSize: '9px',
                color: 'var(--accent)',
                textAlign: 'center',
                marginTop: '4px',
              }}
              onClick={() => setShowAll(true)}
            >
              Show all ({filteredApps.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
