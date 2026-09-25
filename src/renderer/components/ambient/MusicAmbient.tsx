import React, { useEffect, useRef, useState } from 'react';
import { useConfigStore } from '../../store/configStore';
import { useMediaStore } from '../../store/mediaStore';
import { extractPalette, FALLBACK_PALETTE } from '../../utils/extractPalette';
import './musicAmbient.css';

type IntensityKey = 'low' | 'medium' | 'high';

const INTENSITY_PRESETS: Record<IntensityKey, { opacity: number; blur: number; scale: number; duration: number }> = {
  low: { opacity: 0.24, blur: 92, scale: 1.0, duration: 48 },
  medium: { opacity: 0.4, blur: 80, scale: 1.12, duration: 36 },
  high: { opacity: 0.56, blur: 68, scale: 1.24, duration: 26 },
};

const paletteCache = new Map<string, string[]>();
const MAX_CACHE_ENTRIES = 10;

const cachePalette = (key: string, palette: string[]) => {
  paletteCache.set(key, palette);
  if (paletteCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = paletteCache.keys().next().value;
    if (oldestKey !== undefined) paletteCache.delete(oldestKey);
  }
};

interface LayerState {
  a: string[];
  b: string[];
  active: 'a' | 'b';
}

export const MusicAmbient: React.FC = () => {
  const dock = useConfigStore((s) => s.dock);
  const dockHidden = useConfigStore((s) => s.dockHidden);
  const mediaInfo = useMediaStore((s) => s.mediaInfo);

  const ambient = dock.musicAmbient;
  const enabled = Boolean(ambient?.enabled);

  const [layers, setLayers] = useState<LayerState>({
    a: FALLBACK_PALETTE,
    b: FALLBACK_PALETTE,
    active: 'a',
  });

  const trackKeyRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || !mediaInfo) return;

    const trackKey = mediaInfo.albumArt
      ? mediaInfo.albumArt
      : `${mediaInfo.title || ''}|${mediaInfo.artist || ''}`;

    if (!trackKey || trackKey === trackKeyRef.current) return;
    trackKeyRef.current = trackKey;

    let cancelled = false;

    const applyPalette = (palette: string[]) => {
      if (cancelled) return;
      setLayers((prev) => {
        const nextActive: 'a' | 'b' = prev.active === 'a' ? 'b' : 'a';
        return { ...prev, [nextActive]: palette, active: nextActive };
      });
    };

    const cached = paletteCache.get(trackKey);
    if (cached) {
      applyPalette(cached);
      return () => {
        cancelled = true;
      };
    }

    if (!mediaInfo.albumArt) {
      cachePalette(trackKey, FALLBACK_PALETTE);
      applyPalette(FALLBACK_PALETTE);
      return () => {
        cancelled = true;
      };
    }

    extractPalette(mediaInfo.albumArt)
      .then((palette) => {
        cachePalette(trackKey, palette);
        applyPalette(palette);
      })
      .catch(() => {
        cachePalette(trackKey, FALLBACK_PALETTE);
        applyPalette(FALLBACK_PALETTE);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, mediaInfo]);

  if (!enabled || dockHidden) return null;
  if (!mediaInfo) return null;

  const preset = INTENSITY_PRESETS[(ambient?.intensity as IntensityKey) || 'medium'];
  const position = dock.position || 'bottom';
  const isPlaying = Boolean(mediaInfo.isPlaying);

  const rootStyle = {
    '--ambient-opacity': preset.opacity,
    '--ambient-blur': `${preset.blur}px`,
    '--ambient-scale': preset.scale,
    '--ambient-duration': `${preset.duration}s`,
  } as React.CSSProperties;

  const renderBlobs = (palette: string[]) =>
    palette.map((color, i) => (
      <span
        key={i}
        className={`ambient-blob blob-${i % 4}`}
        style={{ '--blob-color': color } as React.CSSProperties}
      />
    ));

  return (
    <div
      className={`music-ambient-root ambient-${position}${isPlaying ? '' : ' ambient-paused'}`}
      style={rootStyle}
      aria-hidden="true"
    >
      <div className={`ambient-layer${layers.active === 'a' ? ' ambient-visible' : ''}`}>
        {renderBlobs(layers.a)}
      </div>
      <div className={`ambient-layer${layers.active === 'b' ? ' ambient-visible' : ''}`}>
        {renderBlobs(layers.b)}
      </div>
    </div>
  );
};

export default MusicAmbient;
