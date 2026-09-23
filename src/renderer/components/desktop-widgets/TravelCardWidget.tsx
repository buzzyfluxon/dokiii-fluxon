import React, { useState } from 'react';
import { DesktopWidgetSize } from '../../../shared/constants';
import { IconPencil } from '../Icons';

interface TravelCardData {
  imageUrl?: string;
  destination?: string;
  travelDate?: string;
}

interface TravelCardWidgetProps {
  size: DesktopWidgetSize;
  data?: TravelCardData;
  onUpdateData: (patch: Partial<TravelCardData>) => void;
}

function getDaysAway(travelDate?: string) {
  if (!travelDate) return null;
  const target = new Date(travelDate).getTime();
  if (Number.isNaN(target)) return null;
  const days = Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
  return days;
}

export const TravelCardWidget: React.FC<TravelCardWidgetProps> = ({ size, data, onUpdateData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [destDraft, setDestDraft] = useState(data?.destination || '');
  const [dateDraft, setDateDraft] = useState(data?.travelDate || '');

  const pickImage = async () => {
    try {
      const url = await window.electronAPI?.selectImageFile?.();
      if (url) onUpdateData({ imageUrl: url });
    } catch (_) {}
  };

  const save = () => {
    onUpdateData({ destination: destDraft.trim(), travelDate: dateDraft });
    setIsEditing(false);
  };

  const daysAway = getDaysAway(data?.travelDate);

  if (isEditing) {
    return (
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}
      >
        <button
          onClick={pickImage}
          style={{
            height: size === 'large' ? '120px' : '60px',
            borderRadius: '10px',
            border: '1px dashed rgba(255,255,255,0.25)',
            background: data?.imageUrl ? `url(${data.imageUrl}) center/cover` : 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          {data?.imageUrl ? '' : 'Choose Image'}
        </button>
        <input
          value={destDraft}
          onChange={(e) => setDestDraft(e.target.value)}
          placeholder="Destination"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', padding: '6px 8px', color: '#ffffff', fontSize: '12px', outline: 'none' }}
        />
        <input
          type="date"
          value={dateDraft ? dateDraft.slice(0, 10) : ''}
          onChange={(e) => setDateDraft(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', padding: '6px 8px', color: '#ffffff', fontSize: '12px', outline: 'none', colorScheme: 'dark' }}
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
        setDestDraft(data?.destination || '');
        setDateDraft(data?.travelDate || '');
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
              borderRadius: '14px',
              backgroundImage: `url(${data.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          {(data.destination || daysAway !== null) && (
            <div style={{ paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              {data.destination && (
                <span style={{ fontSize: size === 'large' ? '15px' : '12px', fontWeight: 700, color: '#ffffff' }}>{data.destination}</span>
              )}
              {daysAway !== null && (
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)' }}>
                  {daysAway > 0 ? `${daysAway}d away` : daysAway === 0 ? 'Today' : 'Passed'}
                </span>
              )}
            </div>
          )}
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '13px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          Click to add a destination
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
