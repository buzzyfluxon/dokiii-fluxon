import React, { useState, useEffect, useRef } from 'react';
import type { MediaInfo } from '../types/widget';
import { usePopover } from '../App';
import {
  IconMusic,
  IconPrevious,
  IconPlay,
  IconPause,
  IconNext,
  IconSpotify,
  IconAppleMusic,
} from '../components/Icons';

import { useMediaStore } from '../store/mediaStore';

export const MediaPlayerWidget: React.FC = () => {
  const { mediaInfo, position, duration, controlMedia, seekMedia } = useMediaStore();
  const { activePopover, openPopover, closePopover } = usePopover();
  const popoverRef = useRef<HTMLDivElement>(null);
  const isPlayerOpen = activePopover === 'media-player';

  useEffect(() => {
    if (!isPlayerOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      const widgetEl = popoverRef.current?.parentElement;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        (!widgetEl || !widgetEl.contains(e.target as Node))
      ) {
        closePopover();
      }
    };
    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handlePointerDown);
    }, 60);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isPlayerOpen, closePopover]);

  const handleControl = async (e: React.MouseEvent, action: 'play-pause' | 'next' | 'previous') => {
    e.stopPropagation();
    await controlMedia(action);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!duration || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSec = Math.floor(ratio * duration);
    seekMedia(targetSec);
  };

  const handleWidgetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayerOpen) {
      closePopover();
    } else {
      openPopover('media-player');
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) secs = 0;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const hasMedia = mediaInfo && (mediaInfo.title || mediaInfo.artist);
  const trackTitle = hasMedia ? (mediaInfo.title || 'Unknown Track') : 'No Media Playing';
  const trackArtist = hasMedia ? (mediaInfo.artist || 'Unknown Artist') : 'Ready to play';
  const isPlaying = hasMedia && mediaInfo.isPlaying;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : (isPlaying ? 35 : 0);

  const renderServiceIcon = () => {
    if (mediaInfo?.appName === 'spotify') {
      return <IconSpotify size={16} color="#1db954" />;
    }
    if (mediaInfo?.appName === 'applemusic') {
      return <IconAppleMusic size={16} color="#fa586a" />;
    }
    return <IconMusic size={15} color="rgba(255, 255, 255, 0.6)" />;
  };

  return (
    <div className="media-widget" onClick={handleWidgetClick} title={trackTitle}>
      <div className="media-art">
        {mediaInfo?.albumArt ? (
          <img src={mediaInfo.albumArt} alt="Artwork" draggable={false} onDragStart={(e) => e.preventDefault()} />
        ) : (
          <div className="media-art-placeholder">
            <IconMusic size={16} />
          </div>
        )}
        {isPlaying && (
          <div className="media-art-playing-indicator">
            <span className="playing-bar bar1" />
            <span className="playing-bar bar2" />
            <span className="playing-bar bar3" />
          </div>
        )}
      </div>

      <div className="media-info">
        <div className="media-title">{trackTitle}</div>
        <div className="media-artist">{trackArtist}</div>
        <div className="media-progress">
          <div className="media-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="media-controls">
        <button className="media-btn" onClick={(e) => handleControl(e, 'previous')} title="Previous">
          <IconPrevious size={10} />
        </button>
        <button className="media-btn play-btn" onClick={(e) => handleControl(e, 'play-pause')} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <IconPause size={10} color="white" /> : <IconPlay size={10} color="white" />}
        </button>
        <button className="media-btn" onClick={(e) => handleControl(e, 'next')} title="Next">
          <IconNext size={10} />
        </button>
      </div>

      {isPlayerOpen && (
        <div
          ref={popoverRef}
          className="widgetpod-popover"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="widgetpod-art-container">
            {mediaInfo?.albumArt ? (
              <img src={mediaInfo.albumArt} alt={trackTitle} className="widgetpod-art" draggable={false} onDragStart={(e) => e.preventDefault()} />
            ) : (
              <div className="widgetpod-art-placeholder">
                <IconMusic size={32} color="rgba(255, 255, 255, 0.85)" />
              </div>
            )}
          </div>

          <div className="widgetpod-details">
            <div className="widgetpod-header">
              <div className="widgetpod-text-col">
                <div className="widgetpod-title" title={trackTitle}>{trackTitle}</div>
                <div className="widgetpod-artist" title={trackArtist}>{trackArtist}</div>
                {mediaInfo?.albumTitle && (
                  <div className="widgetpod-album" title={mediaInfo.albumTitle}>{mediaInfo.albumTitle}</div>
                )}
              </div>
              <div className="widgetpod-badge">
                {renderServiceIcon()}
              </div>
            </div>

            <div className="widgetpod-progress-row">
              <div className="widgetpod-progress-bar" onClick={handleSeek} style={{ cursor: duration > 0 ? 'pointer' : 'default' }}>
                <div className="widgetpod-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="widgetpod-time-row">
                <span>{formatTime(position)}</span>
                <span>{duration > 0 ? `-${formatTime(Math.max(0, duration - position))}` : '--:--'}</span>
              </div>
            </div>

            <div className="widgetpod-controls">
              <button
                className="widgetpod-btn"
                onClick={(e) => handleControl(e, 'previous')}
                title="Previous Track"
              >
                <IconPrevious size={15} />
              </button>
              <button
                className="widgetpod-btn play-btn"
                onClick={(e) => handleControl(e, 'play-pause')}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <IconPause size={16} color="white" /> : <IconPlay size={16} color="white" />}
              </button>
              <button
                className="widgetpod-btn"
                onClick={(e) => handleControl(e, 'next')}
                title="Next Track"
              >
                <IconNext size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPlayerWidget;
