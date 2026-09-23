import React, { useState } from 'react';
import { DesktopWidgetSize } from '../../../shared/constants';
import { IconPencil } from '../Icons';

type MovieStatus = 'Playing' | 'Watching' | 'Completed';

interface MovieCardData {
  imageUrl?: string;
  title?: string;
  rating?: number;
  status?: MovieStatus;
}

interface MovieCardWidgetProps {
  size: DesktopWidgetSize;
  data?: MovieCardData;
  onUpdateData: (patch: Partial<MovieCardData>) => void;
}

const STATUSES: MovieStatus[] = ['Playing', 'Watching', 'Completed'];

export const MovieCardWidget: React.FC<MovieCardWidgetProps> = ({ size, data, onUpdateData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [titleDraft, setTitleDraft] = useState(data?.title || '');
  const [ratingDraft, setRatingDraft] = useState(data?.rating ?? 0);
  const [statusDraft, setStatusDraft] = useState<MovieStatus>(data?.status || 'Watching');

  const pickImage = async () => {
    try {
      const url = await window.electronAPI?.selectImageFile?.();
      if (url) onUpdateData({ imageUrl: url });
    } catch (_) {}
  };

  const save = () => {
    onUpdateData({ title: titleDraft.trim(), rating: ratingDraft, status: statusDraft });
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
            height: size === 'large' ? '130px' : '56px',
            borderRadius: '10px',
            border: '1px dashed rgba(255,255,255,0.25)',
            background: data?.imageUrl ? `url(${data.imageUrl}) center/cover` : 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          {data?.imageUrl ? '' : 'Choose Poster'}
        </button>
        <input
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          placeholder="Title"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', padding: '6px 8px', color: '#ffffff', fontSize: '12px', outline: 'none' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={ratingDraft}
            onChange={(e) => setRatingDraft(Number(e.target.value))}
            style={{ width: '52px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', padding: '6px 8px', color: '#ffffff', fontSize: '12px', outline: 'none' }}
          />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>/ 10</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusDraft(s)}
              style={{
                flex: 1,
                padding: '5px 0',
                fontSize: '10px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.14)',
                background: statusDraft === s ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
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
        setTitleDraft(data?.title || '');
        setRatingDraft(data?.rating ?? 0);
        setStatusDraft(data?.status || 'Watching');
        setIsEditing(true);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={(e) => e.stopPropagation()}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', width: '100%', cursor: 'pointer' }}
    >
      {data?.imageUrl ? (
        <>
          <div
            style={{
              flex: 1,
              borderRadius: '10px',
              backgroundImage: `url(${data.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {data.title && (
              <span style={{ fontSize: size === 'large' ? '14px' : '11px', fontWeight: 700, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {data.title}
              </span>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {data.status && (
                <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.3px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                  {data.status}
                </span>
              )}
              {typeof data.rating === 'number' && data.rating > 0 && (
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffffff' }}>{data.rating.toFixed(1)}</span>
              )}
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '13px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          Click to add a title
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
            background: 'rgba(0,0,0,0.35)',
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
