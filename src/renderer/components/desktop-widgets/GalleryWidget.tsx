import React, { useState } from 'react';
import { DesktopWidgetSize } from '../../../shared/constants';
import { IconPencil } from '../Icons';

interface GalleryData {
  images?: (string | null)[];
}

interface GalleryWidgetProps {
  size: DesktopWidgetSize;
  data?: GalleryData;
  onUpdateData: (patch: Partial<GalleryData>) => void;
}

export const GalleryWidget: React.FC<GalleryWidgetProps> = ({ data, onUpdateData }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const images = data?.images || [null, null, null, null];

  const pickImage = async (index: number) => {
    try {
      const url = await window.electronAPI?.selectImageFile?.();
      if (url) {
        const updated = [...images];
        updated[index] = url;
        onUpdateData({ images: updated });
      }
    } catch (_) {}
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '4px', height: '100%', width: '100%' }}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          onClick={() => pickImage(i)}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
          style={{
            position: 'relative',
            borderRadius: '8px',
            cursor: 'pointer',
            overflow: 'hidden',
            background: images[i] ? `url(${images[i]}) center/cover` : 'rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!images[i] && <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}>+</span>}
          {hoveredIndex === i && images[i] && (
            <div
              style={{
                position: 'absolute',
                top: '3px',
                right: '3px',
                width: '16px',
                height: '16px',
                borderRadius: '5px',
                background: 'rgba(0,0,0,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconPencil size={9} color="rgba(255,255,255,0.85)" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
