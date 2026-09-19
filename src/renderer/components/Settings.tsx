import React, { useState } from 'react';
import { useConfigStore } from '../store/configStore';
import { IconClose, IconPlus, IconTrash, IconMinus, IconMaximize, IconRestore } from './Icons';
import dokiiiLogo from '../assets/dokiii-logo.jpg';
import AddAppModal from './AddAppModal';
import MacIcon from './MacIcon';

export const Settings: React.FC = () => {
  const { dock, updateConfig, toggleSettings, removePinnedApp } = useConfigStore();
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const handleToggle = (key: keyof typeof dock) => {
    const current = dock[key];
    if (typeof current === 'boolean') {
      updateConfig({ [key]: !current } as any);
      if (key === 'alwaysOnTop') {
        window.electronAPI?.setAlwaysOnTop(!current);
      }
      if (key === 'autoHide') {
        window.electronAPI?.setAutoHide(!current);
      }
      if (key === 'launchAtStartup') {
        window.electronAPI?.setLaunchAtStartup(!current);
      }
    }
  };

  const handleSlider = (key: keyof typeof dock, value: number) => {
    updateConfig({ [key]: value } as any);
  };

  const handlePosition = (pos: 'bottom' | 'left' | 'right') => {
    updateConfig({ position: pos });
  };

  const handleMinimizeEffect = (effect: 'genie' | 'scale') => {
    updateConfig({ minimizeEffect: effect });
  };

  const pinnedApps = dock.pinnedApps || [];

  return (
    <>
      <div className="settings-overlay" onClick={(e) => e.target === e.currentTarget && toggleSettings()}>
        <div className={`settings-panel${isMaximized ? ' is-maximized' : ''}`} style={isMaximized ? undefined : { maxWidth: '640px', maxHeight: '86vh' }}>
          <div className="settings-header">
            <div className="settings-mac-controls">
              <button className="settings-mac-dot close" onClick={toggleSettings} title="Close">
                <svg width="6" height="6" viewBox="0 0 6 6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="5" y2="5" />
                  <line x1="5" y1="1" x2="1" y2="5" />
                </svg>
              </button>
              <button className="settings-mac-dot minimize" onClick={toggleSettings} title="Minimize">
                <svg width="6" height="6" viewBox="0 0 6 6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                  <line x1="1" y1="3" x2="5" y2="3" />
                </svg>
              </button>
              <button className="settings-mac-dot maximize" onClick={() => setIsMaximized(!isMaximized)} title={isMaximized ? 'Restore' : 'Zoom'}>
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
            <span className="settings-title">Desktop & Dock</span>
            <div className="settings-header-actions">
              <button className="settings-action-btn" onClick={toggleSettings} title="Minimize">
                <IconMinus size={13} />
              </button>
              <button className="settings-action-btn" onClick={() => setIsMaximized(!isMaximized)} title={isMaximized ? 'Restore' : 'Maximize'}>
                {isMaximized ? <IconRestore size={12} /> : <IconMaximize size={12} />}
              </button>
              <button className="settings-action-btn close" onClick={toggleSettings} title="Close">
                <IconClose size={13} />
              </button>
            </div>
          </div>

          <div className="settings-content" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            <div className="settings-section">
              <div className="settings-section-title">Size and Magnification</div>

              <div className="setting-row">
                <div>
                  <div className="setting-label">Size</div>
                  <div className="setting-desc">{dock.size || 64}px</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Small</span>
                  <input
                    type="range"
                    className="setting-slider"
                    min={44}
                    max={84}
                    value={dock.size || 64}
                    onChange={(e) => handleSlider('size', Number(e.target.value))}
                  />
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Large</span>
                </div>
              </div>

              <div className="setting-row">
                <div>
                  <div className="setting-label">Magnification</div>
                  <div className="setting-desc">Icons expand smoothly as your pointer hovers over them</div>
                </div>
                <button
                  className={`setting-toggle${dock.magnification ? ' on' : ''}`}
                  onClick={() => handleToggle('magnification')}
                />
              </div>

              {dock.magnification && (
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Magnification Scale</div>
                    <div className="setting-desc">{Math.round((dock.magnificationScale || 1.65) * 100)}%</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Min</span>
                    <input
                      type="range"
                      className="setting-slider"
                      min={120}
                      max={220}
                      value={Math.round((dock.magnificationScale || 1.65) * 100)}
                      onChange={(e) => handleSlider('magnificationScale', Number(e.target.value) / 100)}
                    />
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Max</span>
                  </div>
                </div>
              )}
            </div>

            <div className="settings-section">
              <div className="settings-section-title">Position on screen</div>

              <div className="setting-row">
                <div>
                  <div className="setting-label">Screen Position</div>
                  <div className="setting-desc">Move the Dock to the left, bottom, or right edge</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '3px', borderRadius: '10px' }}>
                  {(['left', 'bottom', 'right'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => handlePosition(pos)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '7px',
                        border: 'none',
                        background: (dock.position || 'bottom') === pos ? '#0A84FF' : 'transparent',
                        color: (dock.position || 'bottom') === pos ? '#ffffff' : 'rgba(255,255,255,0.6)',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                        transition: 'all 160ms ease',
                      }}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">Dock Behavior & Effects</div>

              <div className="setting-row">
                <div>
                  <div className="setting-label">Minimize windows using</div>
                  <div className="setting-desc">Visual transition effect when minimizing</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '3px', borderRadius: '10px' }}>
                  {(['genie', 'scale'] as const).map((eff) => (
                    <button
                      key={eff}
                      onClick={() => handleMinimizeEffect(eff)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '7px',
                        border: 'none',
                        background: (dock.minimizeEffect || 'genie') === eff ? '#0A84FF' : 'transparent',
                        color: (dock.minimizeEffect || 'genie') === eff ? '#ffffff' : 'rgba(255,255,255,0.6)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 160ms ease',
                      }}
                    >
                      {eff === 'genie' ? 'Genie effect' : 'Scale effect'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-row">
                <div>
                  <div className="setting-label">Minimize windows into application icon</div>
                  <div className="setting-desc">Windows minimize directly into their Dock icon</div>
                </div>
                <button
                  className={`setting-toggle${dock.minimizeToIcon !== false ? ' on' : ''}`}
                  onClick={() => handleToggle('minimizeToIcon')}
                />
              </div>

              <div className="setting-row">
                <div>
                  <div className="setting-label">Automatically hide and show the Dock</div>
                  <div className="setting-desc">Reveal the Dock only when pointer moves to screen edge</div>
                </div>
                <button
                  className={`setting-toggle${dock.autoHide ? ' on' : ''}`}
                  onClick={() => handleToggle('autoHide')}
                />
              </div>

              <div className="setting-row">
                <div>
                  <div className="setting-label">Live Icons</div>
                  <div className="setting-desc">Calendar and Clock update dynamically in real time</div>
                </div>
                <button
                  className={`setting-toggle${dock.liveIcons !== false ? ' on' : ''}`}
                  onClick={() => handleToggle('liveIcons')}
                />
              </div>

              <div className="setting-row">
                <div>
                  <div className="setting-label">Show indicators for open applications</div>
                  <div className="setting-desc">Display a luminous dot beneath active apps</div>
                </div>
                <button
                  className={`setting-toggle${dock.showIndicators !== false ? ' on' : ''}`}
                  onClick={() => handleToggle('showIndicators')}
                />
              </div>

              <div className="setting-row">
                <div>
                  <div className="setting-label">Always On Top</div>
                  <div className="setting-desc">Keep above other desktop windows</div>
                </div>
                <button
                  className={`setting-toggle${dock.alwaysOnTop ? ' on' : ''}`}
                  onClick={() => handleToggle('alwaysOnTop')}
                />
              </div>

              <div className="setting-row">
                <div>
                  <div className="setting-label">Start with Windows</div>
                  <div className="setting-desc">Launch DOKIII automatically when computer boots</div>
                </div>
                <button
                  className={`setting-toggle${dock.launchAtStartup ? ' on' : ''}`}
                  onClick={() => handleToggle('launchAtStartup')}
                />
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">DOKIII Halo</div>

              <div className="setting-row">
                <div>
                  <div className="setting-label">Enable Halo</div>
                  <div className="setting-desc">Top-center dynamic desktop overlay pill</div>
                </div>
                <button
                  className={`setting-toggle${dock.halo?.enabled !== false ? ' on' : ''}`}
                  onClick={() => {
                    const halo = dock.halo || { enabled: true, displayMode: 'always', reducedMotion: false, showMusic: true, showSystemEvents: true, showDownloads: true, showScreenshots: true };
                    updateConfig({ halo: { ...halo, enabled: !halo.enabled } });
                  }}
                />
              </div>

              {dock.halo?.enabled !== false && (
                <>
                  <div className="setting-row">
                    <div>
                      <div className="setting-label">Display Mode</div>
                      <div className="setting-desc">Always visible on desktop or only reveal during active events</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => {
                          const halo = dock.halo || { enabled: true, displayMode: 'always', reducedMotion: false, showMusic: true, showSystemEvents: true, showDownloads: true, showScreenshots: true };
                          updateConfig({ halo: { ...halo, displayMode: 'always' } });
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          background: dock.halo?.displayMode !== 'active' ? '#0a84ff' : 'rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Always On Desktop
                      </button>
                      <button
                        onClick={() => {
                          const halo = dock.halo || { enabled: true, displayMode: 'always', reducedMotion: false, showMusic: true, showSystemEvents: true, showDownloads: true, showScreenshots: true };
                          updateConfig({ halo: { ...halo, displayMode: 'active' } });
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          background: dock.halo?.displayMode === 'active' ? '#0a84ff' : 'rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Show When Active
                      </button>
                    </div>
                  </div>

                  <div className="setting-row">
                    <div>
                      <div className="setting-label">Reduced Motion</div>
                      <div className="setting-desc">Disable spring morphing animations</div>
                    </div>
                    <button
                      className={`setting-toggle${dock.halo?.reducedMotion ? ' on' : ''}`}
                      onClick={() => {
                        const halo = dock.halo || { enabled: true, displayMode: 'always', reducedMotion: false, showMusic: true, showSystemEvents: true, showDownloads: true, showScreenshots: true };
                        updateConfig({ halo: { ...halo, reducedMotion: !halo.reducedMotion } });
                      }}
                    />
                  </div>

                  <div className="setting-row">
                    <div>
                      <div className="setting-label">Music</div>
                      <div className="setting-desc">Show currently playing song, artist, and playback controls</div>
                    </div>
                    <button
                      className={`setting-toggle${dock.halo?.showMusic !== false ? ' on' : ''}`}
                      onClick={() => {
                        const halo = dock.halo || { enabled: true, displayMode: 'always', reducedMotion: false, showMusic: true, showSystemEvents: true, showDownloads: true, showScreenshots: true };
                        updateConfig({ halo: { ...halo, showMusic: !halo.showMusic } });
                      }}
                    />
                  </div>

                  <div className="setting-row">
                    <div>
                      <div className="setting-label">System Events</div>
                      <div className="setting-desc">Show volume changes, mute status, and battery updates</div>
                    </div>
                    <button
                      className={`setting-toggle${dock.halo?.showSystemEvents !== false ? ' on' : ''}`}
                      onClick={() => {
                        const halo = dock.halo || { enabled: true, displayMode: 'always', reducedMotion: false, showMusic: true, showSystemEvents: true, showDownloads: true, showScreenshots: true };
                        updateConfig({ halo: { ...halo, showSystemEvents: !halo.showSystemEvents } });
                      }}
                    />
                  </div>

                  <div className="setting-row">
                    <div>
                      <div className="setting-label">Downloads</div>
                      <div className="setting-desc">Show download progress and completed notifications</div>
                    </div>
                    <button
                      className={`setting-toggle${dock.halo?.showDownloads !== false ? ' on' : ''}`}
                      onClick={() => {
                        const halo = dock.halo || { enabled: true, displayMode: 'always', reducedMotion: false, showMusic: true, showSystemEvents: true, showDownloads: true, showScreenshots: true };
                        updateConfig({ halo: { ...halo, showDownloads: !halo.showDownloads } });
                      }}
                    />
                  </div>

                  <div className="setting-row">
                    <div>
                      <div className="setting-label">Screenshots</div>
                      <div className="setting-desc">Show screenshot captured confirmations</div>
                    </div>
                    <button
                      className={`setting-toggle${dock.halo?.showScreenshots !== false ? ' on' : ''}`}
                      onClick={() => {
                        const halo = dock.halo || { enabled: true, displayMode: 'always', reducedMotion: false, showMusic: true, showSystemEvents: true, showDownloads: true, showScreenshots: true };
                        updateConfig({ halo: { ...halo, showScreenshots: !halo.showScreenshots } });
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="settings-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div className="settings-section-title" style={{ margin: 0 }}>Applications on Dock</div>
                <button
                  className="btn-primary"
                  onClick={() => setIsAddAppOpen(true)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <IconPlus size={12} />
                  <span>Add Application</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pinnedApps.map((app) => (
                  <div
                    key={app.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MacIcon app={app} size={24} live={false} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>{app.name}</span>
                      <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>{app.path}</span>
                    </div>
                    <button
                      onClick={() => removePinnedApp(app.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ff453a',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                      }}
                      title="Remove from Dock"
                    >
                      <IconTrash size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">Danger Zone</div>
              <div className="setting-row">
                <div>
                  <div className="setting-label">Uninstall DOKIII</div>
                  <div className="setting-desc">Remove desktop shortcut, startup, and clean up app files</div>
                </div>
                <button
                  className="setting-uninstall-btn"
                  onClick={() => window.electronAPI?.showUninstall()}
                >
                  Uninstall DOKIII...
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddAppModal isOpen={isAddAppOpen} onClose={() => setIsAddAppOpen(false)} />
    </>
  );
};

export default Settings;
