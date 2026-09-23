import React, { useState } from 'react';
import { DesktopWidgetSize } from '../../../shared/constants';
import { IconPencil } from '../Icons';

interface PolaroidData {
  imageUrl?: string;
  caption?: string;
  date?: string;
}

interface PolaroidWidgetProps {
  size: DesktopWidgetSize;
  data?: PolaroidData;
  onUpdateData: (patch: Partial<PolaroidData>) => void;
}

export const PolaroidWidget: React.FC<PolaroidWidgetProps> = ({ size, data, onUpdateData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(data?.caption || '');
  const [dateDraft, setDateDraft] = useState(data?.date || '');

  const pickImage = async () => {
    try {
      const url = await window.electronAPI?.selectImageFile?.();
      if (url) onUpdateData({ imageUrl: url });
    } catch (_) {}
  };

  const save = () => {
    onUpdateData({ caption: captionDraft.trim(), date: dateDraft.trim() });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '7px' }}
      >
        <button
          onClick={pickImage}
          style={{
            height: size === 'large' ? '150px' : '70px',
            borderRadius: '6px',
            border: '1px dashed rgba(255,255,255,0.25)',
            background: data?.imageUrl ? `url(${data.imageUrl}) center/cover` : 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          {data?.imageUrl ? '' : 'Choose Photo'}
        </button>
        <input
          value={captionDraft}
          onChange={(e) => setCaptionDraft(e.target.value)}
          placeholder="Caption (optional)"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', padding: '6px 8px', color: '#ffffff', fontSize: '12px', outline: 'none' }}
        />
        <input
          value={dateDraft}
          onChange={(e) => setDateDraft(e.target.value)}
          placeholder="Date (optional)"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', padding: '6px 8px', color: '#ffffff', fontSize: '12px', outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setIsEditing(false)}
            style={{ flex: 1, padding: '6px 0', fontSize: '12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#ffffff', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            style={{ flex: 1, padding: '6px 0', fontSize: '12px', borderRadius: '8px', border: 'none', background: '#0a84ff', color: '#ffffff', cursor: 'pointer' }}
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => {
        setCaptionDraft(data?.caption || '');
        setDateDraft(data?.date || '');
        setIsEditing(true);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={(e) => e.stopPropagation()}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', width: '100%', cursor: 'pointer' }}
    >
      {data?.imageUrl ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            background: 'rgba(255,255,255,0.92)',
            borderRadius: '8px',
            padding: '8px 8px 10px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
          }}
        >
          <div
            style={{
              flex: 1,
              borderRadius: '2px',
              backgroundImage: `url(${data.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          {(data.caption || data.date) && (
            <div style={{ paddingTop: '6px', textAlign: 'center' }}>
              {data.caption && <div style={{ fontSize: size === 'large' ? '13px' : '11px', fontWeight: 600, color: '#1a1a1a' }}>{data.caption}</div>}
              {data.date && <div style={{ fontSize: '9px', color: '#8a8a8a', marginTop: '2px' }}>{data.date}</div>}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '13px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          Click to add a photo
        </div>
      )}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '22px',
            height: '22px',
            borderRadius: '6px',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconPencil size={11} color="rgba(255,255,255,0.85)" />
        </div>
      )}
    </div>
  );
};
