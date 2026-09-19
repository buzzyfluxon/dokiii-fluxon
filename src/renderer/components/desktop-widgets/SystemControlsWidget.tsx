import React, { useState, useEffect, useRef } from 'react';
import { DesktopWidgetSize } from '../../../shared/constants';

interface SystemControlsProps {
  size: DesktopWidgetSize;
}

export const SystemControlsWidget: React.FC<SystemControlsProps> = ({ size = 'small' }) => {
  const [volume, setVolume] = useState<number>(75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [headphonesActive, setHeadphonesActive] = useState<boolean>(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState<boolean>(false);
  const pillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const loadAudio = async () => {
      try {
        if (window.electronAPI?.getAudioVolume) {
          const res = await window.electronAPI.getAudioVolume();
          if (mounted && res) {
            setVolume(res.volume);
            setIsMuted(res.isMuted);
          }
        }
      } catch (_) {}
    };
    loadAudio();
    return () => {
      mounted = false;
    };
  }, []);

  const handlePillClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!pillRef.current) return;
    const rect = pillRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    if (clickY > rect.height - 36) {
      toggleMute(e);
      return;
    }
    const ratio = Math.max(0, Math.min(1, 1 - clickY / rect.height));
    const newVol = Math.round(ratio * 100);
    setVolume(newVol);
    if (isMuted) setIsMuted(false);
    try {
      window.electronAPI?.setAudioVolume(newVol);
    } catch (_) {}
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingVolume(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingVolume || !pillRef.current) return;
    const rect = pillRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, 1 - clickY / rect.height));
    const newVol = Math.round(ratio * 100);
    setVolume(newVol);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingVolume) {
      setIsDraggingVolume(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
      try {
        window.electronAPI?.setAudioVolume(volume);
      } catch (_) {}
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    try {
      window.electronAPI?.toggleAudioMute();
    } catch (_) {}
  };

  const toggleHeadphones = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHeadphonesActive(!headphonesActive);
  };

  const pillFillHeight = isMuted ? 0 : volume;

  const volumeSliderPill = (
    <div
      ref={pillRef}
      onClick={handlePillClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        width: '52px',
        height: '114px',
        borderRadius: '26px',
        background: 'rgba(255, 255, 255, 0.16)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'ns-resize',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
      }}
    >
      <div
        style={{
          width: '100%',
          height: `${pillFillHeight}%`,
          background: 'rgba(255, 255, 255, 0.88)',
          transition: isDraggingVolume ? 'none' : 'height 0.15s ease',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '0',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={pillFillHeight > 25 ? '#1c1c1e' : '#ffffff'}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isMuted ? (
            <>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={pillFillHeight > 25 ? '#1c1c1e' : '#ffffff'} />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </>
          ) : (
            <>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={pillFillHeight > 25 ? '#1c1c1e' : '#ffffff'} />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </>
          )}
        </svg>
      </div>
    </div>
  );

  const headphoneButton = (
    <button
      onClick={toggleHeadphones}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        width: '46px',
        height: '46px',
        borderRadius: '50%',
        background: headphonesActive ? '#0a84ff' : 'rgba(255, 255, 255, 0.14)',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 0.2s ease, transform 0.1s ease',
        color: '#ffffff',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    </button>
  );

  const muteButton = (
    <button
      onClick={toggleMute}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        width: '46px',
        height: '46px',
        borderRadius: '50%',
        background: isMuted ? '#ff453a' : 'rgba(255, 255, 255, 0.14)',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 0.2s ease, transform 0.1s ease',
        color: '#ffffff',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    </button>
  );

  if (size === 'medium') {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {volumeSliderPill}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {headphoneButton}
            {muteButton}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Audio Output
          </span>
          <span style={{ fontSize: '16px', fontWeight: 600 }}>{isMuted ? 'Muted' : `${volume}%`}</span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            {headphonesActive ? 'Headphones Connected' : 'Default Speakers'}
          </span>
        </div>
      </div>
    );
  }

  if (size === 'large') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Control Center
          </span>
          <span style={{ fontSize: '12px', color: '#0a84ff', fontWeight: 500 }}>System Controls</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', margin: '20px 0' }}>
          {volumeSliderPill}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {headphoneButton}
            {muteButton}
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Master Audio</span>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{isMuted ? 'Muted' : `${volume}%`}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
      {volumeSliderPill}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
        {headphoneButton}
        {muteButton}
      </div>
    </div>
  );
};
