import React from 'react';
import { useCachedImage } from '../../hooks/useCachedImage';

interface PhotoCardData {
  imageUrl?: string;
  grayscale?: boolean;
  position?: string;
}

interface PhotoCardWidgetProps {
  width: number;
  height: number;
  data?: PhotoCardData;
}

export const PhotoCardWidget: React.FC<PhotoCardWidgetProps> = ({ width, height, data }) => {
  const src = useCachedImage(data?.imageUrl);

  return (
    <div style={{ width: `${width}px`, height: `${height}px`, position: 'relative', background: '#16161a' }}>
      {src ? (
        <img
          src={src}
          alt=""
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: data?.position || 'center',
            filter: data?.grayscale ? 'grayscale(1) contrast(1.05)' : 'none',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '10px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.45)',
            background: 'linear-gradient(135deg, #2a2a2e, #141416)',
          }}
        >
          {data?.imageUrl ? 'Loading photo…' : 'Double-click to add a photo'}
        </div>
      )}
    </div>
  );
};

export default PhotoCardWidget;
