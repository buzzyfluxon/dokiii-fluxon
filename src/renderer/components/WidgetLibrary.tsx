import React, { useState, useMemo } from 'react';
import { useWidgetStore } from '../store/widgetStore';
import { useConfigStore } from '../store/configStore';
import { WIDGET_REGISTRY, WIDGET_CATEGORIES, WidgetCategory, WidgetId } from '../../shared/constants';
import { WidgetIcon, IconSearch, IconClose, IconMinus, IconMaximize, IconRestore } from './Icons';
import dokiiiLogo from '../assets/dokiii-logo.jpg';

const WidgetLibrary: React.FC = () => {
  const { enabledWidgets, toggleWidget } = useWidgetStore();
  const { toggleWidgetLibrary, addDesktopWidget } = useConfigStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<WidgetCategory | 'all'>('all');
  const [isMaximized, setIsMaximized] = useState(false);

  const filtered = useMemo(() => {
    return WIDGET_REGISTRY.filter((w) => {
      const matchesSearch = !search || w.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'all' || w.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof WIDGET_REGISTRY> = {};
    for (const widget of filtered) {
      const cat = WIDGET_CATEGORIES.find((c) => c.id === widget.category);
      const label = cat?.label || 'Other';
      if (!groups[label]) groups[label] = [];
      groups[label].push(widget);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="widget-library-overlay" onClick={(e) => e.target === e.currentTarget && toggleWidgetLibrary()}>
      <div className={`widget-library${isMaximized ? ' is-maximized' : ''}`}>
        <div className="wl-header">
          <div className="wl-mac-controls">
            <button className="wl-mac-dot close" onClick={toggleWidgetLibrary} title="Close">
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                <line x1="1" y1="1" x2="5" y2="5" />
                <line x1="5" y1="1" x2="1" y2="5" />
              </svg>
            </button>
            <button className="wl-mac-dot minimize" onClick={toggleWidgetLibrary} title="Minimize">
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                <line x1="1" y1="3" x2="5" y2="3" />
              </svg>
            </button>
            <button className="wl-mac-dot maximize" onClick={() => setIsMaximized(!isMaximized)} title={isMaximized ? 'Restore' : 'Zoom'}>
              {isMaximized ? (
                <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
                  <polygon points="0,2 2,2 2,0" />
                  <polygon points="6,4 4,4 4,6" />
                </svg>
              ) : (
                <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
                  <polygon points="0,2.5 0,0 2.5,0" />
                  <polygon points="6,3.5 6,6 3.5,6" />
                </svg>
              )}
            </button>
          </div>
          <div className="wl-logo-badge">
            <img src={dokiiiLogo} alt="DOKIII" draggable={false} onDragStart={(e) => e.preventDefault()} />
          </div>
          <span className="wl-title">DOKIII Widgets</span>
          <span className="wl-count">{WIDGET_REGISTRY.length}</span>
          <span className="wl-in-bar">{enabledWidgets.length} in bar</span>
          <div className="wl-header-actions">
            <button className="wl-action-btn" onClick={toggleWidgetLibrary} title="Minimize">
              <IconMinus size={13} />
            </button>
            <button className="wl-action-btn" onClick={() => setIsMaximized(!isMaximized)} title={isMaximized ? 'Restore' : 'Maximize'}>
              {isMaximized ? <IconRestore size={12} /> : <IconMaximize size={12} />}
            </button>
            <button className="wl-action-btn close" onClick={toggleWidgetLibrary} title="Close">
              <IconClose size={13} />
            </button>
          </div>
        </div>

        <div className="wl-search">
          <span className="wl-search-icon">
            <IconSearch size={14} />
          </span>
          <input
            type="text"
            placeholder="Search widgets"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="wl-categories">
          <button
            className={`wl-category-chip${activeCategory === 'all' ? ' active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All
          </button>
          {WIDGET_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`wl-category-chip${activeCategory === cat.id ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="wl-content">
          {Object.entries(grouped).map(([label, widgets]) => (
            <div key={label}>
              <div className="wl-section-title">
                <span>{label}</span>
              </div>
              <div className="wl-grid">
                {widgets.map((widget) => (
                  <div
                    key={widget.id}
                    className={`wl-widget-card${enabledWidgets.includes(widget.id) ? ' active' : ''}`}
                  >
                    <div className="wl-widget-icon">
                      <WidgetIcon id={widget.id} size={22} />
                    </div>
                    <span className="wl-widget-name">{widget.name}</span>
                    <span className="wl-widget-desc">{widget.description}</span>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', width: '100%' }}>
                      <button
                        type="button"
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          fontSize: '11px',
                          borderRadius: '6px',
                          border: 'none',
                          background: enabledWidgets.includes(widget.id) ? '#ff453a' : '#0a84ff',
                          color: '#ffffff',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                        onClick={() => toggleWidget(widget.id as WidgetId)}
                      >
                        {enabledWidgets.includes(widget.id) ? 'Remove Dock' : '+ Dock'}
                      </button>
                      {widget.supportsDesktop && (
                        <button
                          type="button"
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            fontSize: '11px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'rgba(255,255,255,0.1)',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                          onClick={() => addDesktopWidget(widget.id as any, 'small')}
                        >
                          + Desktop
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <div className="empty-state" style={{ padding: '48px' }}>
              <IconSearch size={28} color="var(--text-tertiary)" />
              <span style={{ marginTop: '8px' }}>No widgets found</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WidgetLibrary;
