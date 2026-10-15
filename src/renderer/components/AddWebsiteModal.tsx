import React, { useState, useEffect, useRef } from 'react';
import { useConfigStore } from '../store/configStore';
import { DockAppItem } from '../../shared/constants';
import { IconClose } from './Icons';

interface AddWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const normalizeUrl = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (!/^https?:$/.test(url.protocol)) return null;
    if (!url.hostname.includes('.') && url.hostname !== 'localhost') return null;
    return url.toString();
  } catch {
    return null;
  }
};

const defaultName = (url: string): string => {
  const host = new URL(url).hostname.replace(/^www\./i, '');
  const label = host.split('.')[0] || host;
  return label.length <= 3 ? label.toUpperCase() : label.charAt(0).toUpperCase() + label.slice(1);
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '13px',
  borderRadius: '10px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  background: 'rgba(255, 255, 255, 0.06)',
  color: 'rgba(255, 255, 255, 0.95)',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'rgba(255, 255, 255, 0.55)',
  marginBottom: '6px',
  display: 'block',
};

export const AddWebsiteModal: React.FC<AddWebsiteModalProps> = ({ isOpen, onClose }) => {
  const { addPinnedApp, dock, showNotice } = useConfigStore();
  const [urlInput, setUrlInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [autoIcon, setAutoIcon] = useState<string | null>(null);
  const [customIcon, setCustomIcon] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const requestId = useRef(0);

  const normalized = normalizeUrl(urlInput);
  const previewIcon = customIcon || autoIcon;
  const previewName = nameInput.trim() || (normalized ? defaultName(normalized) : '');

  useEffect(() => {
    if (!isOpen) {
      setUrlInput('');
      setNameInput('');
      setAutoIcon(null);
      setCustomIcon(null);
      setFetching(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !normalized || customIcon) {
      setFetching(false);
      return;
    }
    const id = ++requestId.current;
    setFetching(true);
    const timer = setTimeout(() => {
      window.electronAPI
        .fetchFavicon(normalized)
        .then((icon) => {
          if (id === requestId.current) {
            setAutoIcon(icon);
            setFetching(false);
          }
        })
        .catch(() => {
          if (id === requestId.current) {
            setAutoIcon(null);
            setFetching(false);
          }
        });
    }, 450);
    return () => clearTimeout(timer);
  }, [normalized, customIcon, isOpen]);

  if (!isOpen) return null;

  const handlePickIcon = async () => {
    try {
      const icon = await window.electronAPI.pickIconImage();
      if (icon) setCustomIcon(icon);
    } catch {}
  };

  const handleRefetch = () => {
    setCustomIcon(null);
    setAutoIcon(null);
  };

  const handleAdd = () => {
    if (!normalized) return;
    const exists = (dock.pinnedApps || []).some((a) => a.path === normalized);
    if (exists) {
      showNotice('This website is already in the dock.');
      return;
    }
    const app: DockAppItem = {
      id: `web-${Date.now()}`,
      name: previewName,
      path: normalized,
      iconType: 'custom',
      icon: previewIcon || undefined,
      color: '#0A84FF',
    };
    addPinnedApp(app);
    onClose();
  };

  return (
    <div
      className="widget-library-overlay"
      style={{ zIndex: 10020 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="widget-library" style={{ maxWidth: '440px' }}>
        <div className="wl-header">
          <span className="wl-title">Add Website to Dock</span>
          <button className="wl-close" onClick={onClose} title="Close">
            <IconClose size={12} />
          </button>
        </div>

        <div style={{ padding: '4px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 100%)',
                border: '0.5px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '26px',
                fontWeight: 700,
              }}
            >
              {previewIcon ? (
                <img
                  src={previewIcon}
                  alt=""
                  style={{ width: '54px', height: '54px', objectFit: 'contain' }}
                  draggable={false}
                />
              ) : fetching ? (
                <span style={{ fontSize: '11px', fontWeight: 500 }}>Fetching…</span>
              ) : (
                <span>{previewName ? previewName.charAt(0).toUpperCase() : '?'}</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handlePickIcon}
                style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Choose custom icon
              </button>
              <button
                type="button"
                onClick={handleRefetch}
                disabled={!normalized}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.8)',
                  cursor: normalized ? 'pointer' : 'default',
                  opacity: normalized ? 1 : 0.5,
                }}
              >
                Fetch icon from website
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Website</label>
            <input
              type="text"
              style={fieldStyle}
              placeholder="pw.live or https://pw.live"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
          </div>

          <div>
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              style={fieldStyle}
              placeholder={normalized ? defaultName(normalized) : 'Optional'}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleAdd}
            disabled={!normalized}
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: '13px',
              borderRadius: '12px',
              cursor: normalized ? 'pointer' : 'default',
              opacity: normalized ? 1 : 0.5,
            }}
          >
            Add to Dock
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWebsiteModal;
