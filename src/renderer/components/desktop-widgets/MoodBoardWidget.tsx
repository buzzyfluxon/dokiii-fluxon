import React, { useState } from 'react';
import { DesktopWidgetSize } from '../../../shared/constants';
import { IconPencil, IconClose, IconPlus } from '../Icons';

interface MoodBoardData {
  images?: string[];
}

interface MoodBoardWidgetProps {
  size: DesktopWidgetSize;
  data?: MoodBoardData;
  onUpdateData: (patch: Partial<MoodBoardData>) => void;
}

type Cell = { col: string; row: string };

const LAYOUTS: Record<number, Cell[]> = {
  1: [{ col: '1/7', row: '1/5' }],
  2: [
    { col: '1/4', row: '1/5' },
    { col: '4/7', row: '1/5' },
  ],
  3: [
    { col: '1/4', row: '1/5' },
    { col: '4/7', row: '1/3' },
    { col: '4/7', row: '3/5' },
  ],
  4: [
    { col: '1/4', row: '1/3' },
    { col: '4/7', row: '1/3' },
    { col: '1/4', row: '3/5' },
    { col: '4/7', row: '3/5' },
  ],
  5: [
    { col: '1/4', row: '1/3' },
    { col: '4/7', row: '1/3' },
    { col: '1/3', row: '3/5' },
    { col: '3/5', row: '3/5' },
    { col: '5/7', row: '3/5' },
  ],
  6: [
    { col: '1/3', row: '1/3' },
    { col: '3/5', row: '1/3' },
    { col: '5/7', row: '1/3' },
    { col: '1/3', row: '3/5' },
    { col: '3/5', row: '3/5' },
    { col: '5/7', row: '3/5' },
  ],
};

export const MoodBoardWidget: React.FC<MoodBoardWidgetProps> = ({ data, onUpdateData }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const images = data?.images || [];
  const canAdd = images.length < 6;
  const layoutCount = Math.max(canAdd ? images.length + 1 : images.length, 1);
  const layout = LAYOUTS[layoutCount];

  const replaceImage = async (index: number) => {
    try {
      const url = await window.electronAPI?.selectImageFile?.();
      if (!url) return;
      const updated = [...images];
      updated[index] = url;
      onUpdateData({ images: updated });
    } catch (_) {}
  };

  const removeImage = (index: number) => {
    onUpdateData({ images: images.filter((_, i) => i !== index) });
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gridTemplateRows: 'repeat(4, 1fr)', gap: '4px', height: '100%', width: '100%' }}
    >
      {images.map((url, i) => (
        <div
          key={i}
          onClick={() => replaceImage(i)}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
          style={{
            position: 'relative',
            gridColumn: layout[i].col,
            gridRow: layout[i].row,
            borderRadius: '8px',
            overflow: 'hidden',
            cursor: 'pointer',
            backgroundImage: `url(${url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {hoveredIndex === i && (
            <>
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(i);
                }}
                style={{
                  position: 'absolute',
                  bottom: '3px',
                  right: '3px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '5px',
                  background: 'rgba(0,0,0,0.45)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <IconClose size={9} color="rgba(255,255,255,0.85)" />
              </button>
            </>
          )}
        </div>
      ))}
      {canAdd && (
        <div
          onClick={() => replaceImage(images.length)}
          style={{
            gridColumn: layout[images.length].col,
            gridRow: layout[images.length].row,
            borderRadius: '8px',
            border: '1px dashed rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <IconPlus size={12} color="rgba(255,255,255,0.4)" />
        </div>
      )}
    </div>
  );
};
