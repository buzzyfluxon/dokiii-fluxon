import React, { useState, useEffect } from 'react';
import { useConfigStore, DokiiiAppTab } from '../store/configStore';
import { useWidgetStore } from '../store/widgetStore';
import {
  WIDGET_REGISTRY,
  WIDGET_CATEGORIES,
  WidgetId,
  DesktopWidgetType,
  DesktopWidgetSize,
} from '../../shared/constants';
import { IconClose, IconMinus, IconMaximize, IconRestore } from './Icons';
import './dokiii-app.css';

export const DokiiiApp: React.FC = () => {
  const {
    dock,
    profiles,
    activeProfileId,
    activeAppTab,
    closeDokiiiApp,
    setActiveAppTab,
    updateConfig,
    switchProfile,
    createProfile,
    renameProfile,
    duplicateProfile,
    deleteProfile,
    addDesktopWidget,
    removeDesktopWidget,
    setDesktopWidgetSize,
    resetDesktopWidgetPositions,
    toggleDesktopWidgetsVisible,
  } = useConfigStore();

  const { enabledWidgets, toggleWidget } = useWidgetStore();

  const [newProfileName, setNewProfileName] = useState('');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [sysMetrics, setSysMetrics] = useState<{ cpu: number; ram: number; ssd: number }>({
    cpu: 10,
    ram: 65,
    ssd: 75,
  });
  const [batteryInfo, setBatteryInfo] = useState<{ percent: number; isCharging: boolean }>({
    percent: 100,
    isCharging: true,
  });

  useEffect(() => {
    let mounted = true;
    const loadTelemetry = async () => {
      try {
        if (window.electronAPI?.getSystemMetrics) {
          const m = await window.electronAPI.getSystemMetrics();
          if (mounted && m) setSysMetrics(m);
        }
        if (window.electronAPI?.getBatteryStatus) {
          const b = await window.electronAPI.getBatteryStatus();
          if (mounted && b) setBatteryInfo(b);
        }
      } catch (_) {}
    };
    loadTelemetry();
    const interval = setInterval(loadTelemetry, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    createProfile(newProfileName.trim());
    setNewProfileName('');
  };

  const handleSaveRename = (id: string) => {
    if (editNameInput.trim()) {
      renameProfile(id, editNameInput.trim());
    }
    setEditingProfileId(null);
  };

  const desktopWidgetsList = dock.desktopWidgets || [];

  const renderHomeTab = () => (
    <div className="dokiii-content-body">
      <div className="dokiii-grid">
        <div className="dokiii-stat-box">
          <span className="dokiii-stat-label">Active Profile</span>
          <span className="dokiii-stat-val" style={{ color: '#0a84ff' }}>
            {profiles.find((p) => p.id === activeProfileId)?.name || 'Default'}
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            {profiles.length} total profiles configured
          </span>
        </div>

        <div className="dokiii-stat-box">
          <span className="dokiii-stat-label">System Performance</span>
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
            <div>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>CPU </span>
              <span style={{ fontSize: '16px', fontWeight: 700 }}>{sysMetrics.cpu}%</span>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>RAM </span>
              <span style={{ fontSize: '16px', fontWeight: 700 }}>{sysMetrics.ram}%</span>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>SSD </span>
              <span style={{ fontSize: '16px', fontWeight: 700 }}>{sysMetrics.ssd}%</span>
            </div>
          </div>
        </div>

        <div className="dokiii-stat-box">
          <span className="dokiii-stat-label">Desktop Widgets</span>
          <span className="dokiii-stat-val">
            {dock.desktopWidgetsVisible !== false ? desktopWidgetsList.length : 0}
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            {dock.desktopWidgetsVisible !== false ? 'Visible on desktop' : 'Hidden'}
          </span>
        </div>

        <div className="dokiii-stat-box">
          <span className="dokiii-stat-label">Dock Apps & Widgets</span>
          <span className="dokiii-stat-val">
            {(dock.pinnedApps?.length || 0) + enabledWidgets.length}
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            Position: {dock.position}
          </span>
        </div>
      </div>

      <div className="dokiii-card">
        <span className="dokiii-card-title">Quick Controls</span>

        <div className="dokiii-row">
          <div className="dokiii-row-label">
            <span className="dokiii-row-name">Desktop Widgets</span>
            <span className="dokiii-row-desc">Show or hide widget layer on the desktop</span>
          </div>
          <div
            className={`dokiii-toggle ${dock.desktopWidgetsVisible !== false ? 'active' : ''}`}
            onClick={toggleDesktopWidgetsVisible}
          >
            <div className="dokiii-toggle-handle" />
          </div>
        </div>

        <div className="dokiii-row">
          <div className="dokiii-row-label">
            <span className="dokiii-row-name">Dock Magnification</span>
            <span className="dokiii-row-desc">Smooth continuous wave magnification on hover</span>
          </div>
          <div
            className={`dokiii-toggle ${dock.magnification ? 'active' : ''}`}
            onClick={() => updateConfig({ magnification: !dock.magnification })}
          >
            <div className="dokiii-toggle-handle" />
          </div>
        </div>

        <div className="dokiii-row">
          <div className="dokiii-row-label">
            <span className="dokiii-row-name">Automatically Hide Dock</span>
            <span className="dokiii-row-desc">Reveal dock only when cursor touches screen edge</span>
          </div>
          <div
            className={`dokiii-toggle ${dock.autoHide ? 'active' : ''}`}
            onClick={() => updateConfig({ autoHide: !dock.autoHide })}
          >
            <div className="dokiii-toggle-handle" />
          </div>
        </div>

        <div className="dokiii-row">
          <div className="dokiii-row-label">
            <span className="dokiii-row-name">Dynamic Island</span>
            <span className="dokiii-row-desc">Top status bar alert pill for system events and media</span>
          </div>
          <div
            className={`dokiii-toggle ${dock.dynamicIslandEnabled ? 'active' : ''}`}
            onClick={() => updateConfig({ dynamicIslandEnabled: !dock.dynamicIslandEnabled })}
          >
            <div className="dokiii-toggle-handle" />
          </div>
        </div>
      </div>

      <div className="dokiii-card">
        <span className="dokiii-card-title">Quick Profile Switch</span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {profiles.map((p) => (
            <button
              key={p.id}
              className={`dokiii-btn ${p.id === activeProfileId ? 'primary' : 'secondary'}`}
              onClick={() => switchProfile(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLibraryTab = () => (
    <div className="dokiii-content-body">
      {WIDGET_CATEGORIES.map((cat) => {
        const catWidgets = WIDGET_REGISTRY.filter((w) => w.category === cat.id);
        if (catWidgets.length === 0) return null;

        return (
          <div key={cat.id} className="dokiii-card">
            <span className="dokiii-card-title">{cat.label}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {catWidgets.map((w) => {
                const isDockEnabled = enabledWidgets.includes(w.id);
                const isDesktop = w.supportsDesktop;

                return (
                  <div key={w.id} className="dokiii-row">
                    <div className="dokiii-row-label">
                      <span className="dokiii-row-name">{w.name}</span>
                      <span className="dokiii-row-desc">{w.description}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {isDesktop && (
                        <button
                          className="dokiii-btn secondary"
                          onClick={() => addDesktopWidget(w.id as DesktopWidgetType, 'small')}
                        >
                          + Desktop
                        </button>
                      )}
                      <button
                        className={`dokiii-btn ${isDockEnabled ? 'danger' : 'primary'}`}
                        onClick={() => toggleWidget(w.id)}
                      >
                        {isDockEnabled ? 'Remove Dock' : '+ Dock'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderProfilesTab = () => (
    <div className="dokiii-content-body">
      <div className="dokiii-card">
        <span className="dokiii-card-title">Create Profile</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Profile Name (e.g., Gaming, Writing)"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateProfile();
            }}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button className="dokiii-btn primary" onClick={handleCreateProfile}>
            Create
          </button>
        </div>
      </div>

      <div className="dokiii-card">
        <span className="dokiii-card-title">Available Profiles</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {profiles.map((p) => {
            const isActive = p.id === activeProfileId;
            const isEditing = editingProfileId === p.id;

            return (
              <div key={p.id} className="dokiii-row">
                <div className="dokiii-row-label">
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        value={editNameInput}
                        onChange={(e) => setEditNameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(p.id);
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.12)',
                          border: '1px solid #0a84ff',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          color: '#ffffff',
                          fontSize: '13px',
                        }}
                      />
                      <button className="dokiii-btn primary" onClick={() => handleSaveRename(p.id)}>
                        Save
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="dokiii-row-name" style={{ fontSize: '14px', fontWeight: isActive ? 700 : 500 }}>
                        {p.name}
                      </span>
                      {isActive && (
                        <span style={{ fontSize: '10px', background: '#30d158', color: '#000000', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                  )}
                  <span className="dokiii-row-desc">
                    {p.dockWidgets.length} dock widgets · {p.desktopWidgets?.length || 0} desktop widgets · {p.pinnedApps?.length || 0} apps
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {!isActive && (
                    <button className="dokiii-btn primary" onClick={() => switchProfile(p.id)}>
                      Switch
                    </button>
                  )}
                  <button
                    className="dokiii-btn secondary"
                    onClick={() => {
                      setEditingProfileId(p.id);
                      setEditNameInput(p.name);
                    }}
                  >
                    Rename
                  </button>
                  <button className="dokiii-btn secondary" onClick={() => duplicateProfile(p.id)}>
                    Duplicate
                  </button>
                  {profiles.length > 1 && (
                    <button className="dokiii-btn danger" onClick={() => deleteProfile(p.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderDesktopTab = () => (
    <div className="dokiii-content-body">
      <div className="dokiii-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="dokiii-card-title">Desktop Widgets Layer</span>
            <span className="dokiii-row-desc" style={{ display: 'block', marginTop: '2px' }}>
              Freely positionable, transparent macOS widgets pinned to your desktop.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="dokiii-btn secondary" onClick={resetDesktopWidgetPositions}>
              Reset Positions
            </button>
            <button
              className={`dokiii-btn ${dock.desktopWidgetsVisible !== false ? 'primary' : 'secondary'}`}
              onClick={toggleDesktopWidgetsVisible}
            >
              {dock.desktopWidgetsVisible !== false ? 'Hide Layer' : 'Show Layer'}
            </button>
          </div>
        </div>
      </div>

      <div className="dokiii-card">
        <span className="dokiii-card-title">Add Widget to Desktop</span>
        <div className="dokiii-grid">
          {[
            { type: 'world-clock' as const, name: 'World Clock', desc: 'World silhouette map & digital clock' },
            { type: 'date-day' as const, name: 'Date & Day', desc: 'Large date numeral with day label' },
            { type: 'system-controls' as const, name: 'System Controls', desc: 'Pill volume slider & audio toggles' },
            { type: 'system-monitor' as const, name: 'System Monitor', desc: 'Concentric 3-ring CPU, RAM, SSD' },
            { type: 'battery' as const, name: 'Battery', desc: 'Charge ring & laptop percentage' },
            { type: 'analog-clock' as const, name: 'Analog Clock', desc: 'Classic dark analog clock dial' },
            { type: 'calendar' as const, name: 'Calendar Month', desc: 'Monthly calendar grid with today highlight' },
            { type: 'moon-phase' as const, name: 'Moon Phase', desc: 'Live astronomical lunar shading' },
          ].map((item) => (
            <div key={item.type} className="dokiii-tile">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.name}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{item.desc}</span>
              </div>
              <button
                className="dokiii-btn primary"
                onClick={() => addDesktopWidget(item.type, 'small')}
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="dokiii-card">
        <span className="dokiii-card-title">Active Desktop Widgets ({desktopWidgetsList.length})</span>
        {desktopWidgetsList.length === 0 ? (
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            No desktop widgets currently added. Click "+ Add" above to add any widget.
          </span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {desktopWidgetsList.map((w) => (
              <div key={w.id} className="dokiii-row">
                <div className="dokiii-row-label">
                  <span className="dokiii-row-name" style={{ textTransform: 'capitalize' }}>
                    {w.type.replace('-', ' ')}
                  </span>
                  <span className="dokiii-row-desc">
                    Size: {w.size} · Position: {Math.round(w.x)}, {Math.round(w.y)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <select
                    className="dokiii-select"
                    value={w.size}
                    onChange={(e) => setDesktopWidgetSize(w.id, e.target.value as DesktopWidgetSize)}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                  <button className="dokiii-btn danger" onClick={() => removeDesktopWidget(w.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderDockTab = () => (
    <div className="dokiii-content-body">
      <div className="dokiii-card">
        <span className="dokiii-card-title">Dock Position & Sizing</span>

        <div className="dokiii-row">
          <div className="dokiii-row-label">
            <span className="dokiii-row-name">Screen Position</span>
            <span className="dokiii-row-desc">Placement on your primary display</span>
          </div>
          <select
            className="dokiii-select"
            value={dock.position}
            onChange={(e) => updateConfig({ position: e.target.value as any })}
          >
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>

        <div className="dokiii-row">
          <div className="dokiii-row-label">
            <span className="dokiii-row-name">Icon Base Size</span>
            <span className="dokiii-row-desc">{dock.size}px</span>
          </div>
          <div className="dokiii-slider-group">
            <input
              type="range"
              min="36"
              max="96"
              className="dokiii-slider"
              value={dock.size}
              onChange={(e) => updateConfig({ size: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="dokiii-row">
          <div className="dokiii-row-label">
            <span className="dokiii-row-name">Item Spacing</span>
            <span className="dokiii-row-desc">{dock.widgetSpacing}px</span>
          </div>
          <div className="dokiii-slider-group">
            <input
              type="range"
              min="2"
              max="16"
              className="dokiii-slider"
              value={dock.widgetSpacing}
              onChange={(e) => updateConfig({ widgetSpacing: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div className="dokiii-card">
        <span className="dokiii-card-title">Magnification Wave</span>

        <div className="dokiii-row">
          <div className="dokiii-row-label">
            <span className="dokiii-row-name">Enable Magnification</span>
            <span className="dokiii-row-desc">Icons scale up in a smooth wave following the cursor</span>
          </div>
          <div
            className={`dokiii-toggle ${dock.magnification ? 'active' : ''}`}
            onClick={() => updateConfig({ magnification: !dock.magnification })}
          >
            <div className="dokiii-toggle-handle" />
          </div>
        </div>

        <div className="dokiii-row">
          <div className="dokiii-row-label">
            <span className="dokiii-row-name">Magnification Scale</span>
            <span className="dokiii-row-desc">{dock.magnificationScale.toFixed(2)}x</span>
          </div>
          <div className="dokiii-slider-group">
            <input
              type="range"
              min="1.2"
              max="2.2"
              step="0.05"
              className="dokiii-slider"
              value={dock.magnificationScale}
              onChange={(e) => updateConfig({ magnificationScale: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div className="dokiii-card">
        <span className="dokiii-card-title">Glassmorphism & Appearance</span>

        <div className="dokiii-row">
          <div className="dokiii-row-label">
            <span className="dokiii-row-name">Corner Radius</span>
            <span className="dokiii-row-desc">{dock.cornerRadius}px</span>
          </div>
          <div className="dokiii-slider-group">
            <input
              type="range"
              min="12"
              max="32"
              className="dokiii-slider"
              value={dock.cornerRadius}
              onChange={(e) => updateConfig({ cornerRadius: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="dokiii-row">
          <div className="dokiii-row-label">
            <span className="dokiii-row-name">Blur Intensity</span>
            <span className="dokiii-row-desc">{dock.blur}px</span>
          </div>
          <div className="dokiii-slider-group">
            <input
              type="range"
              min="10"
              max="80"
              className="dokiii-slider"
              value={dock.blur}
              onChange={(e) => updateConfig({ blur: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderHaloTab = () => {
    const halo = dock.halo || {
      enabled: true,
      displayMode: 'always',
      reducedMotion: false,
      showMusic: true,
      showSystemEvents: true,
      showDownloads: true,
      showScreenshots: true,
    };

    return (
      <div className="dokiii-content-body">
        <div className="dokiii-card">
          <span className="dokiii-card-title">DOKIII Halo Controls</span>

          <div className="dokiii-row">
            <div className="dokiii-row-label">
              <span className="dokiii-row-name">Enable Halo</span>
              <span className="dokiii-row-desc">Top-center dynamic desktop overlay pill</span>
            </div>
            <div
              className={`dokiii-toggle ${halo.enabled ? 'active' : ''}`}
              onClick={() => updateConfig({ halo: { ...halo, enabled: !halo.enabled } })}
            >
              <div className="dokiii-toggle-handle" />
            </div>
          </div>

          {halo.enabled && (
            <>
              <div className="dokiii-row">
                <div className="dokiii-row-label">
                  <span className="dokiii-row-name">Display Mode</span>
                  <span className="dokiii-row-desc">Always visible on desktop or only reveal during active events</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`dokiii-btn ${halo.displayMode !== 'active' ? 'primary' : 'secondary'}`}
                    onClick={() => updateConfig({ halo: { ...halo, displayMode: 'always' } })}
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                  >
                    Always On Desktop
                  </button>
                  <button
                    className={`dokiii-btn ${halo.displayMode === 'active' ? 'primary' : 'secondary'}`}
                    onClick={() => updateConfig({ halo: { ...halo, displayMode: 'active' } })}
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                  >
                    Show When Active
                  </button>
                </div>
              </div>

              <div className="dokiii-row">
                <div className="dokiii-row-label">
                  <span className="dokiii-row-name">Reduced Motion</span>
                  <span className="dokiii-row-desc">Disable spring morphing animations</span>
                </div>
                <div
                  className={`dokiii-toggle ${halo.reducedMotion ? 'active' : ''}`}
                  onClick={() => updateConfig({ halo: { ...halo, reducedMotion: !halo.reducedMotion } })}
                >
                  <div className="dokiii-toggle-handle" />
                </div>
              </div>

              <div className="dokiii-row">
                <div className="dokiii-row-label">
                  <span className="dokiii-row-name">Music</span>
                  <span className="dokiii-row-desc">Display active track, artwork, and playback controls</span>
                </div>
                <div
                  className={`dokiii-toggle ${halo.showMusic ? 'active' : ''}`}
                  onClick={() => updateConfig({ halo: { ...halo, showMusic: !halo.showMusic } })}
                >
                  <div className="dokiii-toggle-handle" />
                </div>
              </div>

              <div className="dokiii-row">
                <div className="dokiii-row-label">
                  <span className="dokiii-row-name">System Events</span>
                  <span className="dokiii-row-desc">Display volume adjustments, mute toggles, and battery updates</span>
                </div>
                <div
                  className={`dokiii-toggle ${halo.showSystemEvents ? 'active' : ''}`}
                  onClick={() => updateConfig({ halo: { ...halo, showSystemEvents: !halo.showSystemEvents } })}
                >
                  <div className="dokiii-toggle-handle" />
                </div>
              </div>

              <div className="dokiii-row">
                <div className="dokiii-row-label">
                  <span className="dokiii-row-name">Downloads</span>
                  <span className="dokiii-row-desc">Display download progress and completion notifications</span>
                </div>
                <div
                  className={`dokiii-toggle ${halo.showDownloads ? 'active' : ''}`}
                  onClick={() => updateConfig({ halo: { ...halo, showDownloads: !halo.showDownloads } })}
                >
                  <div className="dokiii-toggle-handle" />
                </div>
              </div>

              <div className="dokiii-row">
                <div className="dokiii-row-label">
                  <span className="dokiii-row-name">Screenshots</span>
                  <span className="dokiii-row-desc">Display confirmation alert when screenshot is taken</span>
                </div>
                <div
                  className={`dokiii-toggle ${halo.showScreenshots ? 'active' : ''}`}
                  onClick={() => updateConfig({ halo: { ...halo, showScreenshots: !halo.showScreenshots } })}
                >
                  <div className="dokiii-toggle-handle" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderSettingsTab = () => (
    <div className="dokiii-content-body">
      <div className="dokiii-card">
        <span className="dokiii-card-title">General Settings</span>

        <div className="dokiii-row">
          <div className="dokiii-row-label">
            <span className="dokiii-row-name">Launch at Startup</span>
            <span className="dokiii-row-desc">Automatically launch DOKIII when logging into Windows</span>
          </div>
          <div
            className={`dokiii-toggle ${dock.launchAtStartup ? 'active' : ''}`}
            onClick={async () => {
              const next = !dock.launchAtStartup;
              updateConfig({ launchAtStartup: next });
              try {
                window.electronAPI?.setLaunchAtStartup(next);
              } catch (_) {}
            }}
          >
            <div className="dokiii-toggle-handle" />
          </div>
        </div>

        <div className="dokiii-row">
          <div className="dokiii-row-label">
            <span className="dokiii-row-name">Running App Indicators</span>
            <span className="dokiii-row-desc">Display glowing dot beneath currently open applications</span>
          </div>
          <div
            className={`dokiii-toggle ${dock.showIndicators ? 'active' : ''}`}
            onClick={() => updateConfig({ showIndicators: !dock.showIndicators })}
          >
            <div className="dokiii-toggle-handle" />
          </div>
        </div>

        <div className="dokiii-row">
          <div className="dokiii-row-label">
            <span className="dokiii-row-name">Always On Top</span>
            <span className="dokiii-row-desc">Float dock above all fullscreen windows</span>
          </div>
          <div
            className={`dokiii-toggle ${dock.alwaysOnTop ? 'active' : ''}`}
            onClick={() => {
              const next = !dock.alwaysOnTop;
              updateConfig({ alwaysOnTop: next });
              try {
                window.electronAPI?.setAlwaysOnTop(next);
              } catch (_) {}
            }}
          >
            <div className="dokiii-toggle-handle" />
          </div>
        </div>
      </div>

      <div className="dokiii-card">
        <span className="dokiii-card-title">Shortcuts & Keybindings</span>
        <div className="dokiii-row">
          <div className="dokiii-row-label">
            <span className="dokiii-row-name">File Search</span>
            <span className="dokiii-row-desc">Open instant macOS Spotlight search</span>
          </div>
          <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>
            Alt + Space
          </span>
        </div>
        <div className="dokiii-row">
          <div className="dokiii-row-label">
            <span className="dokiii-row-name">Command Palette</span>
            <span className="dokiii-row-desc">Trigger quick actions and commands</span>
          </div>
          <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>
            Ctrl + Space
          </span>
        </div>
      </div>

      <div className="dokiii-card">
        <span className="dokiii-card-title">Maintenance & Uninstall</span>
        <div className="dokiii-row">
          <div className="dokiii-row-label">
            <span className="dokiii-row-name">Uninstall DOKIII</span>
            <span className="dokiii-row-desc">Launch the easy uninstaller wizard to remove shortcuts and files</span>
          </div>
          <button
            className="dokiii-btn danger"
            onClick={() => {
              try {
                window.electronAPI?.showUninstall();
              } catch (_) {}
            }}
          >
            Uninstall...
          </button>
        </div>
      </div>
    </div>
  );

  const renderAboutTab = () => (
    <div className="dokiii-content-body" style={{ alignItems: 'center', textAlign: 'center' }}>
      <div style={{ margin: '20px 0 10px 0' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
            margin: '0 auto',
            fontSize: '32px',
            fontWeight: 800,
            letterSpacing: '-1px',
            color: '#ffffff',
          }}
        >
          D
        </div>
      </div>
      <span style={{ fontSize: '24px', fontWeight: 700 }}>DOKIII</span>
      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Version 1.0.0 (Release)</span>
      <p style={{ maxWidth: '420px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginTop: '8px' }}>
        A refined macOS-style Desktop Dock and interactive Desktop Widgets system designed exclusively for Windows.
      </p>
      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', display: 'block' }}>
        Developer: buzzyfluxon
      </span>

      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <button
          className="dokiii-btn secondary"
          onClick={() => {
            try {
              window.electronAPI?.openUrl('https://github.com/buzzyfluxon');
            } catch (_) {}
          }}
        >
          GitHub (buzzyfluxon)
        </button>
        <button
          className="dokiii-btn secondary"
          onClick={() => {
            try {
              window.electronAPI?.openUrl('https://github.com/buzzyfluxon');
            } catch (_) {}
          }}
        >
          Check for Updates
        </button>
        <button
          className="dokiii-btn danger"
          onClick={() => {
            try {
              window.electronAPI?.showUninstall();
            } catch (_) {}
          }}
        >
          Uninstall DOKIII
        </button>
      </div>
    </div>
  );

  const renderActiveTabContent = () => {
    switch (activeAppTab) {
      case 'home':
        return renderHomeTab();
      case 'library':
        return renderLibraryTab();
      case 'profiles':
        return renderProfilesTab();
      case 'desktop':
        return renderDesktopTab();
      case 'dock':
        return renderDockTab();
      case 'halo':
        return renderHaloTab();
      case 'island':
        return renderHaloTab();
      case 'settings':
        return renderSettingsTab();
      case 'about':
        return renderAboutTab();
      default:
        return renderHomeTab();
    }
  };

  const navItems: { id: DokiiiAppTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'library', label: 'Widget Library' },
    { id: 'profiles', label: 'Widget Profiles' },
    { id: 'desktop', label: 'Desktop Widgets' },
    { id: 'dock', label: 'Dock' },
    { id: 'halo', label: 'Halo' },
    { id: 'settings', label: 'Settings' },
    { id: 'about', label: 'About' },
  ];

  return (
    <div className="dokiii-app-backdrop" onClick={closeDokiiiApp}>
      <div className={`dokiii-window${isMaximized ? ' is-maximized' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="dokiii-sidebar">
          <div className="dokiii-window-controls">
            <button className="dokiii-control-dot close" onClick={closeDokiiiApp} title="Close">
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                <line x1="1" y1="1" x2="5" y2="5" />
                <line x1="5" y1="1" x2="1" y2="5" />
              </svg>
            </button>
            <button className="dokiii-control-dot minimize" onClick={closeDokiiiApp} title="Minimize">
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                <line x1="1" y1="3" x2="5" y2="3" />
              </svg>
            </button>
            <button className="dokiii-control-dot maximize" onClick={() => setIsMaximized(!isMaximized)} title={isMaximized ? 'Restore' : 'Zoom'}>
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

          <div className="dokiii-nav-list">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`dokiii-nav-item ${activeAppTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveAppTab(item.id)}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="dokiii-main-content">
          <div className="dokiii-content-header">
            <div>
              <span className="dokiii-content-title">
                {navItems.find((i) => i.id === activeAppTab)?.label}
              </span>
              <span className="dokiii-content-subtitle" style={{ display: 'block' }}>
                {activeAppTab === 'home' && 'Main Overview & Control Center'}
                {activeAppTab === 'library' && 'Browse and add widgets to Dock or Desktop'}
                {activeAppTab === 'profiles' && 'Custom workspaces for study, coding, and focus'}
                {activeAppTab === 'desktop' && 'Desktop widget positioning and sizing'}
                {activeAppTab === 'dock' && 'Customize dock magnification, style, and behavior'}
                {activeAppTab === 'halo' && 'Configure the DOKIII Halo top-center dynamic desktop overlay'}
                {activeAppTab === 'island' && 'Dynamic status pill configuration (Under Development)'}
                {activeAppTab === 'settings' && 'System options, startup, and shortcuts'}
                {activeAppTab === 'about' && 'DOKIII Information and Build Details'}
              </span>
            </div>
            <div className="dokiii-header-actions">
              <button className="dokiii-action-btn" onClick={closeDokiiiApp} title="Minimize">
                <IconMinus size={13} />
              </button>
              <button
                className="dokiii-action-btn"
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? <IconRestore size={12} /> : <IconMaximize size={12} />}
              </button>
              <button className="dokiii-action-btn close" onClick={closeDokiiiApp} title="Close">
                <IconClose size={13} />
              </button>
            </div>
          </div>

          {renderActiveTabContent()}
        </div>
      </div>
    </div>
  );
};
