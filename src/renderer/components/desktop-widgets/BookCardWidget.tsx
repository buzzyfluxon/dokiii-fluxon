import React, { useState } from 'react';
import { DesktopWidgetSize } from '../../../shared/constants';
import { IconPencil } from '../Icons';

interface BookCardData {
  imageUrl?: string;
  title?: string;
  author?: string;
  progress?: number;
}

interface BookCardWidgetProps {
  size: DesktopWidgetSize;
  data?: BookCardData;
  onUpdateData: (patch: Partial<BookCardData>) => void;
}

export const BookCardWidget: React.FC<BookCardWidgetProps> = ({ size, data, onUpdateData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [titleDraft, setTitleDraft] = useState(data?.title || '');
  const [authorDraft, setAuthorDraft] = useState(data?.author || '');
  const [progressDraft, setProgressDraft] = useState(data?.progress ?? 0);

  const pickImage = async () => {
    try {
      const url = await window.electronAPI?.selectImageFile?.();
      if (url) onUpdateData({ imageUrl: url });
    } catch (_) {}
  };

  const save = () => {
    onUpdateData({ title: titleDraft.trim(), author: authorDraft.trim(), progress: progressDraft });
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
          {data?.imageUrl ? '' : 'Choose Cover'}
        </button>
        <input
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          placeholder="Title"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', padding: '6px 8px', color: '#ffffff', fontSize: '12px', outline: 'none' }}
        />
        <input
          value={authorDraft}
          onChange={(e) => setAuthorDraft(e.target.value)}
          placeholder="Author"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', padding: '6px 8px', color: '#ffffff', fontSize: '12px', outline: 'none' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={progressDraft}
            onChange={(e) => setProgressDraft(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#0a84ff' }}
          />
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', minWidth: '28px', textAlign: 'right' }}>{progressDraft}%</span>
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
        setAuthorDraft(data?.author || '');
        setProgressDraft(data?.progress ?? 0);
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
            {data.author && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{data.author}</span>}
            {typeof data.progress === 'number' && (
              <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginTop: '2px' }}>
                <div style={{ height: '100%', width: `${data.progress}%`, borderRadius: '2px', background: '#0a84ff' }} />
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '13px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          Click to add a book
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
