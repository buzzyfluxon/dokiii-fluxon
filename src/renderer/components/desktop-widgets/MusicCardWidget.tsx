import React from 'react';
import { useMediaStore } from '../../store/mediaStore';
import { useCachedImage } from '../../hooks/useCachedImage';
import { IconPlay, IconPause, IconMusic } from '../Icons';
import { FitBox } from './FitBox';
import { glyphSvg } from '../../../shared/presetAssets';

interface MusicCardData {
  title?: string;
  subtitle?: string;
  thumbs?: string[];
}

interface MusicCardWidgetProps {
  width: number;
  height: number;
  data?: MusicCardData;
}

const TILE_TONES = [
  'linear-gradient(135deg, #4a4a50, #1f1f23)',
  'linear-gradient(135deg, #8a8a90, #3a3a3f)',
  'linear-gradient(135deg, #2f2f34, #111113)',
  'linear-gradient(135deg, #6c6c72, #26262a)',
];

const Thumb: React.FC<{ url?: string; index: number; art?: string | null }> = ({ url, index, art }) => {
  const cached = useCachedImage(url);
  const src = art || cached;
  return (
    <div
      style={{
        width: '43px',
        height: '43px',
        borderRadius: '9px',
        overflow: 'hidden',
        flexShrink: 0,
        background: TILE_TONES[index % TILE_TONES.length],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.14)',
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1)' }}
        />
      ) : (
        <IconMusic size={16} color="rgba(255,255,255,0.35)" />
      )}
    </div>
  );
};

export const MusicCardWidget: React.FC<MusicCardWidgetProps> = ({ width, height, data }) => {
  const mediaInfo = useMediaStore((s) => s.mediaInfo);
  const controlMedia = useMediaStore((s) => s.controlMedia);

  const live = Boolean(mediaInfo && (mediaInfo.title || mediaInfo.artist));
  const title = live ? mediaInfo!.title || 'Unknown Track' : data?.title || 'Desi Boyz';
  const subtitle = live ? mediaInfo!.artist || 'Unknown Artist' : data?.subtitle || 'Album • by Pritam';
  const isPlaying = Boolean(live && mediaInfo!.isPlaying);
  const art = live ? mediaInfo!.albumArt || null : null;
  const thumbs = data?.thumbs || [];

  return (
    <FitBox width={width} height={height} designWidth={212} designHeight={116}>
      <div
        style={{
          width: '212px',
          height: '116px',
          boxSizing: 'border-box',
          padding: '11px 11px 10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '27px',
              height: '27px',
              borderRadius: '6px',
              overflow: 'hidden',
              flexShrink: 0,
              background: TILE_TONES[0],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {art ? (
              <img src={art} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1)' }} />
            ) : (
              <IconMusic size={13} color="rgba(255,255,255,0.5)" />
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {title}
            </span>
            <span
              style={{
                fontSize: '8.5px',
                color: 'rgba(255,255,255,0.6)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {subtitle}
            </span>
          </div>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              controlMedia('play-pause');
            }}
            title={isPlaying ? 'Pause' : 'Play'}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              padding: 0,
            }}
          >
            {isPlaying ? <IconPause size={10} color="#111113" /> : <IconPlay size={10} color="#111113" />}
          </button>
          <div
            style={{ width: '13px', height: '13px', flexShrink: 0, opacity: 0.85 }}
            dangerouslySetInnerHTML={{ __html: glyphSvg('spotify') }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {[0, 1, 2, 3].map((i) => (
            <Thumb key={i} index={i} url={thumbs[i]} art={i === 0 ? art : null} />
          ))}
        </div>
      </div>
    </FitBox>
  );
};

export default MusicCardWidget;
