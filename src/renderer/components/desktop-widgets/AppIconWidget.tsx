import React from 'react';
import { useCachedImage } from '../../hooks/useCachedImage';
import { glyphSvg } from '../../../shared/presetAssets';

interface AppIconData {
  glyph?: string;
  icon?: string;
  path?: string;
}

interface AppIconWidgetProps {
  width: number;
  height: number;
  label?: string;
  data?: AppIconData;
}

export const AppIconWidget: React.FC<AppIconWidgetProps> = ({ width, height, label, data }) => {
  const image = useCachedImage(data?.glyph === 'image' ? data?.icon : null);
  const tile = Math.min(64, width - 12);

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        color: '#ffffff',
      }}
    >
      <div
        style={{
          width: `${tile}px`,
          height: `${tile}px`,
          borderRadius: `${Math.round(tile * 0.27)}px`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(150deg, #3b3b40 0%, #151517 100%)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.45), inset 0 0.5px 0.5px rgba(255,255,255,0.35)',
          border: '0.5px solid rgba(255,255,255,0.18)',
        }}
      >
        {data?.glyph === 'image' ? (
          image ? (
            <img
              src={image}
              alt=""
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1)' }}
            />
          ) : null
        ) : (
          <div
            style={{ width: `${Math.round(tile * 0.62)}px`, height: `${Math.round(tile * 0.62)}px` }}
            dangerouslySetInnerHTML={{ __html: glyphSvg(data?.glyph || 'apps') }}
          />
        )}
      </div>
      <span
        style={{
          fontSize: '10.5px',
          fontWeight: 600,
          maxWidth: `${width}px`,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textShadow: '0 1px 4px rgba(0,0,0,0.7)',
        }}
      >
        {label}
      </span>
    </div>
  );
};

export default AppIconWidget;
