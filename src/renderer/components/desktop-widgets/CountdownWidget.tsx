import React, { useState, useEffect } from 'react';
import { DesktopWidgetSize } from '../../../shared/constants';
import { IconPencil } from '../Icons';

interface CountdownData {
  title?: string;
  targetDate?: string;
}

interface CountdownWidgetProps {
  size: DesktopWidgetSize;
  data?: CountdownData;
  onUpdateData: (patch: Partial<CountdownData>) => void;
}

function getRemaining(targetDate?: string) {
  if (!targetDate) return null;
  const target = new Date(targetDate).getTime();
  if (Number.isNaN(target)) return null;
  const diffMs = target - Date.now();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return { diffMs, days };
}

export const CountdownWidget: React.FC<CountdownWidgetProps> = ({ size, data, onUpdateData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [titleDraft, setTitleDraft] = useState(data?.title || '');
  const [dateDraft, setDateDraft] = useState(data?.targetDate || '');
  const [remaining, setRemaining] = useState(() => getRemaining(data?.targetDate));

  useEffect(() => {
    setRemaining(getRemaining(data?.targetDate));
    if (!data?.targetDate) return;
    const timer = setInterval(() => setRemaining(getRemaining(data.targetDate)), 60000);
    return () => clearInterval(timer);
  }, [data?.targetDate]);

  const save = () => {
    onUpdateData({ title: titleDraft.trim(), targetDate: dateDraft });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px', justifyContent: 'center' }}
      >
        <input
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          placeholder="Event title"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '8px',
            padding: '6px 8px',
            color: '#ffffff',
            fontSize: '12px',
            outline: 'none',
          }}
        />
        <input
          type="date"
          value={dateDraft ? dateDraft.slice(0, 10) : ''}
          onChange={(e) => setDateDraft(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '8px',
            padding: '6px 8px',
            color: '#ffffff',
            fontSize: '12px',
            outline: 'none',
            colorScheme: 'dark',
          }}
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

  const numberSize = size === 'large' ? 64 : size === 'medium' ? 48 : 40;

  return (
    <div
      onClick={() => {
        setTitleDraft(data?.title || '');
        setDateDraft(data?.targetDate || '');
        setIsEditing(true);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={(e) => e.stopPropagation()}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center', gap: '6px', cursor: 'pointer', textAlign: 'center' }}
    >
      {remaining ? (
        <>
          <span style={{ fontSize: `${numberSize}px`, fontWeight: 700, letterSpacing: '-2px', lineHeight: 1, color: remaining.days < 0 ? 'rgba(255,255,255,0.4)' : '#ffffff' }}>
            {remaining.days < 0 ? 0 : remaining.days}
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            {remaining.days < 0 ? 'Passed' : remaining.days === 1 ? 'day left' : 'days left'}
          </span>
          {data?.title && (
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginTop: '2px' }}>{data.title}</span>
          )}
        </>
      ) : (
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Click to set a date</span>
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
