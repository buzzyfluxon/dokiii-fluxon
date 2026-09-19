import React, { useState, useEffect } from 'react';
import { useConfigStore } from '../store/configStore';
import { AppInfo } from '../types/widget';
import { DockAppItem } from '../../shared/constants';
import { IconClose, IconSearch, IconPlus } from './Icons';

interface AddAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddAppModal: React.FC<AddAppModalProps> = ({ isOpen, onClose }) => {
  const { addPinnedApp } = useConfigStore();
  const [installedApps, setInstalledApps] = useState<AppInfo[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchApps = async () => {
      setLoading(true);
      try {
        if (window.electronAPI?.getInstalledApps) {
          const apps = await window.electronAPI.getInstalledApps();
          setInstalledApps(apps || []);
        }
      } catch {}
      setLoading(false);
    };
    fetchApps();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredApps = installedApps.filter((app) =>
    app.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleBrowseFile = async () => {
    try {
      if (window.electronAPI?.selectAppFile) {
        const file = await window.electronAPI.selectAppFile();
        if (file) {
          let iconUrl = file.icon;
          if (!iconUrl && window.electronAPI.getAppIcon) {
            try {
              const res = await window.electronAPI.getAppIcon(file.path);
              if (res) iconUrl = res;
            } catch {}
          }
          const newApp: DockAppItem = {
            id: `custom-${Date.now()}`,
            name: file.name,
            path: file.path,
            iconType: 'custom',
            icon: iconUrl,
            color: '#0A84FF',
          };
          addPinnedApp(newApp);
          onClose();
        }
      }
    } catch {}
  };

  const handleAddInstalledApp = (app: AppInfo) => {
    const newApp: DockAppItem = {
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: app.name,
      path: app.path,
      iconType: 'custom',
      icon: app.icon,
      color: '#5E5CE6',
    };
    addPinnedApp(newApp);
    onClose();
  };

  return (
    <div
      className="widget-library-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="widget-library" style={{ maxWidth: '520px' }}>
        <div className="wl-header">
          <span className="wl-title">Add Application to Dock</span>
          <button className="wl-close" onClick={onClose} title="Close">
            <IconClose size={12} />
          </button>
        </div>

        <div style={{ padding: '0 24px 16px' }}>
          <button
            className="btn-primary"
            onClick={handleBrowseFile}
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: '13px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <IconPlus size={16} />
            <span>Browse .exe or Shortcut on PC...</span>
          </button>
        </div>

        <div className="wl-search">
          <span className="wl-search-icon">
            <IconSearch size={14} />
          </span>
          <input
            type="text"
            placeholder="Search installed applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="wl-content" style={{ maxHeight: '340px', overflowY: 'auto' }}>
          {loading ? (
            <div className="empty-state" style={{ padding: '32px' }}>
              <span>Loading applications...</span>
            </div>
          ) : filteredApps.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 8px' }}>
              {filteredApps.map((app, idx) => (
                <div
                  key={`${app.path}-${idx}`}
                  onClick={() => handleAddInstalledApp(app)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    cursor: 'pointer',
                    transition: 'background 160ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    {app.icon ? (
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={app.icon}
                          alt={app.name}
                          style={{
                            width: '26px',
                            height: '26px',
                            objectFit: 'contain',
                          }}
                          draggable={false}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '13px',
                          flexShrink: 0,
                        }}
                      >
                        {app.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'rgba(255, 255, 255, 0.92)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {app.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#0A84FF', fontWeight: 600, flexShrink: 0 }}>
                    + Pin
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '32px' }}>
              <span>No applications found</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AddAppModal;
