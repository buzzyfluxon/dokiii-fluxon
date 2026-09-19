import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useConfigStore } from '../../store/configStore';
import { useMediaStore } from '../../store/mediaStore';
import dokiiiLogo from '../../assets/dokiii-logo.jpg';
import {
  IconMusic,
  IconPlay,
  IconPause,
  IconPrevious,
  IconNext,
} from '../Icons';
import './halo.css';

interface EphemeralEvent {
  type: 'volume' | 'mute' | 'battery' | 'screenshot' | 'download';
  title: string;
  subtitle?: string;
  value?: number;
}

export const Halo: React.FC = () => {
  const dock = useConfigStore((s) => s.dock);
  const halo = dock.halo;

  const [isExpanded, setIsExpanded] = useState(false);
  const { mediaInfo, position: mediaPosition, duration: mediaDuration, controlMedia, seekMedia } = useMediaStore();
  const [ephemeralEvent, setEphemeralEvent] = useState<EphemeralEvent | null>(null);
  const prevVolumeRef = useRef<number | null>(null);
  const prevMuteRef = useRef<boolean | null>(null);
  const prevScreenshotCountRef = useRef<number | null>(null);
  const prevDownloadCountRef = useRef<number | null>(null);
  const prevBatteryRef = useRef<{ percent: number; isCharging: boolean } | null>(null);

  const haloRef = useRef<HTMLDivElement>(null);
  const eventTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerEphemeral = useCallback((event: EphemeralEvent, durationMs: number = 2800) => {
    if (eventTimeoutRef.current) clearTimeout(eventTimeoutRef.current);
    setEphemeralEvent(event);
    eventTimeoutRef.current = setTimeout(() => {
      setEphemeralEvent(null);
    }, durationMs);
  }, []);

  useEffect(() => {
    if (!halo?.enabled) return;

    let mounted = true;

    const poll = async () => {
      if (!mounted) return;

      if (halo.showSystemEvents) {
        try {
          if (window.electronAPI?.getAudioVolume) {
            const res = await window.electronAPI.getAudioVolume();
            if (mounted && res) {
              if (prevVolumeRef.current !== null && res.volume !== prevVolumeRef.current) {
                triggerEphemeral({
                  type: 'volume',
                  title: `Volume ${res.volume}%`,
                  value: res.volume,
                });
              }
              if (prevMuteRef.current !== null && res.isMuted !== prevMuteRef.current) {
                triggerEphemeral({
                  type: 'mute',
                  title: res.isMuted ? 'Muted' : 'Unmuted',
                });
              }
              prevVolumeRef.current = res.volume;
              prevMuteRef.current = res.isMuted;
            }
          }

          if (window.electronAPI?.getBatteryStatus) {
            const b = await window.electronAPI.getBatteryStatus();
            if (mounted && b && b.hasBattery) {
              const prev = prevBatteryRef.current;
              if (prev && (b.isCharging !== prev.isCharging || Math.abs(b.percent - prev.percent) >= 5)) {
                triggerEphemeral({
                  type: 'battery',
                  title: b.isCharging ? 'Battery Charging' : 'Battery',
                  subtitle: `${b.percent}%`,
                  value: b.percent,
                });
              }
              prevBatteryRef.current = b;
            }
          }
        } catch (_) {}
      }

      try {
        if (halo.showScreenshots && window.electronAPI?.getRecentScreenshots) {
          const sc = await window.electronAPI.getRecentScreenshots();
          if (mounted && sc) {
            if (prevScreenshotCountRef.current !== null && sc.length > prevScreenshotCountRef.current) {
              triggerEphemeral({
                type: 'screenshot',
                title: 'Screenshot Captured',
                subtitle: sc[0]?.name || 'Saved to Pictures',
              });
            }
            prevScreenshotCountRef.current = sc.length;
          }
        }

        if (halo.showDownloads && window.electronAPI?.getDownloads) {
          const dl = await window.electronAPI.getDownloads();
          if (mounted && dl) {
            if (prevDownloadCountRef.current !== null && dl.length > prevDownloadCountRef.current) {
              triggerEphemeral({
                type: 'download',
                title: 'Download Finished',
                subtitle: dl[0]?.name || 'Saved to Downloads',
              });
            }
            prevDownloadCountRef.current = dl.length;
          }
        }
      } catch (_) {}
    };

    poll();
    const interval = setInterval(poll, 8000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [
    halo?.enabled,
    halo?.showSystemEvents,
    halo?.showScreenshots,
    halo?.showDownloads,
    triggerEphemeral,
  ]);

  useEffect(() => {
    if (!isExpanded) return;
    const handleOutside = (e: MouseEvent) => {
      if (haloRef.current && !haloRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handleOutside);
    }, 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handleOutside);
    };
  }, [isExpanded]);

  if (!halo?.enabled) return null;

  const hasMedia = Boolean(halo.showMusic && mediaInfo && (mediaInfo.title || mediaInfo.isPlaying));
  const hasActiveEvent = Boolean(ephemeralEvent || hasMedia);

  const shouldHide = halo.displayMode === 'active' && !hasActiveEvent && !isExpanded;

  const handlePointerEnter = () => {
    window.electronAPI?.setIgnoreMouseEvents(false);
  };

  const handlePointerLeave = () => {
    if (!isExpanded) {
      window.electronAPI?.setIgnoreMouseEvents(true, true);
    }
  };

  const handlePillClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  const handleMediaControl = async (e: React.MouseEvent, action: 'play-pause' | 'next' | 'previous') => {
    e.stopPropagation();
    await controlMedia(action);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!mediaDuration || mediaDuration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetSec = Math.floor(ratio * mediaDuration);
    seekMedia(targetSec);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) secs = 0;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = mediaDuration > 0
    ? Math.min(100, Math.max(0, (mediaPosition / mediaDuration) * 100))
    : (mediaInfo?.isPlaying ? 35 : 0);

  const getPillStateClass = () => {
    if (isExpanded) return 'state-expanded';
    if (ephemeralEvent) {
      if (ephemeralEvent.type === 'volume' || ephemeralEvent.type === 'mute' || ephemeralEvent.type === 'battery') {
        return 'state-system';
      }
      return 'state-notification';
    }
    if (hasMedia) return 'state-music';
    return 'state-idle';
  };

  const renderCompactContent = () => {
    if (ephemeralEvent) {
      return (
        <>
          <div className="halo-compact-text">
            <span className="halo-compact-title">{ephemeralEvent.title}</span>
            {ephemeralEvent.subtitle && (
              <span className="halo-compact-subtitle">{ephemeralEvent.subtitle}</span>
            )}
          </div>
          {ephemeralEvent.type === 'volume' && ephemeralEvent.value !== undefined && (
            <div className="halo-system-bar">
              <div className="halo-system-bar-fill" style={{ width: `${ephemeralEvent.value}%` }} />
            </div>
          )}
          {ephemeralEvent.type === 'battery' && ephemeralEvent.value !== undefined && (
            <div className="halo-system-bar">
              <div
                className="halo-system-bar-fill"
                style={{
                  width: `${ephemeralEvent.value}%`,
                  background: ephemeralEvent.value < 20 ? '#ff453a' : '#30d158',
                }}
              />
            </div>
          )}
        </>
      );
    }

    if (hasMedia && mediaInfo) {
      return (
        <>
          {mediaInfo.albumArt ? (
            <div className="halo-compact-art">
              <img src={mediaInfo.albumArt} alt="" draggable={false} />
            </div>
          ) : (
            <div className="halo-compact-art">
              <IconMusic size={12} color="rgba(255, 255, 255, 0.7)" />
            </div>
          )}
          <div className="halo-compact-text">
            <span className="halo-compact-title">{mediaInfo.title || 'Playing'}</span>
            <span className="halo-compact-subtitle">{mediaInfo.artist || 'Media'}</span>
          </div>
          {mediaInfo.isPlaying && (
            <div className="halo-wave">
              <span className="halo-wave-bar b1" />
              <span className="halo-wave-bar b2" />
              <span className="halo-wave-bar b3" />
            </div>
          )}
        </>
      );
    }

    return (
      <div className="halo-compact-text">
        <span className="halo-compact-title">DOKIII Halo</span>
        <span className="halo-compact-subtitle">Active Desktop</span>
      </div>
    );
  };

  const renderExpandedContent = () => {
    const title = mediaInfo?.title || 'No Media Playing';
    const artist = mediaInfo?.artist || 'Ready to play';
    const isPlaying = Boolean(mediaInfo?.isPlaying);

    return (
      <>
        <div className="halo-exp-header">
          <div className="halo-exp-header-left">
            <div className="halo-logo">
              <img src={dokiiiLogo} alt="DOKIII" draggable={false} />
            </div>
            <span className="halo-exp-header-title">
              {ephemeralEvent ? ephemeralEvent.title : 'Now Playing'}
            </span>
          </div>
          <span className="halo-exp-header-time">
            {mediaDuration > 0 ? `${formatTime(mediaPosition)} / ${formatTime(mediaDuration)}` : ''}
          </span>
        </div>

        <div className="halo-exp-body">
          <div className="halo-exp-art">
            {mediaInfo?.albumArt ? (
              <img src={mediaInfo.albumArt} alt="" draggable={false} />
            ) : (
              <IconMusic size={24} color="rgba(255, 255, 255, 0.75)" />
            )}
          </div>

          <div className="halo-exp-info">
            <span className="halo-exp-title">{title}</span>
            <span className="halo-exp-artist">{artist}</span>
            <div className="halo-exp-seekbar" onClick={handleSeek}>
              <div className="halo-exp-seekfill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="halo-exp-controls">
            <button
              className="halo-exp-btn"
              onClick={(e) => handleMediaControl(e, 'previous')}
              title="Previous"
            >
              <IconPrevious size={12} />
            </button>
            <button
              className="halo-exp-btn play"
              onClick={(e) => handleMediaControl(e, 'play-pause')}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <IconPause size={13} color="white" /> : <IconPlay size={13} color="white" />}
            </button>
            <button
              className="halo-exp-btn"
              onClick={(e) => handleMediaControl(e, 'next')}
              title="Next"
            >
              <IconNext size={12} />
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div
      ref={haloRef}
      className={`halo-root${shouldHide ? ' hidden' : ''}${halo.reducedMotion ? ' reduced-motion' : ''}`}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <div
        className={`halo-pill ${getPillStateClass()}`}
        onClick={handlePillClick}
      >
        {!isExpanded && (
          <div className="halo-logo">
            <img src={dokiiiLogo} alt="DOKIII" draggable={false} />
          </div>
        )}
        {!isExpanded ? renderCompactContent() : renderExpandedContent()}
      </div>
    </div>
  );
};

export default Halo;
