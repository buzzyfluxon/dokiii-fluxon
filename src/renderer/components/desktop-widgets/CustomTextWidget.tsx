import React, { useState } from 'react';
import { DesktopWidgetSize } from '../../../shared/constants';
import { IconPencil } from '../Icons';

interface CustomTextData {
  text?: string;
  align?: 'left' | 'center' | 'right';
  weight?: 'regular' | 'bold';
}

interface CustomTextWidgetProps {
  size: DesktopWidgetSize;
  data?: CustomTextData;
  onUpdateData: (patch: Partial<CustomTextData>) => void;
}

export const CustomTextWidget: React.FC<CustomTextWidgetProps> = ({ size, data, onUpdateData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [draft, setDraft] = useState(data?.text || '');

  const align = data?.align || 'left';
  const weight = data?.weight || 'bold';
  const fontSize = size === 'large' ? 28 : size === 'medium' ? 22 : 18;

  const startEditing = () => {
    setDraft(data?.text || '');
    setIsEditing(true);
  };

  const save = () => {
    onUpdateData({ text: draft.trim() });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}
      >
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          placeholder="Type anything"
          style={{
            flex: 1,
            resize: 'none',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '10px',
            padding: '8px',
            color: '#ffffff',
            fontSize: '13px',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              onClick={() => onUpdateData({ align: a })}
              style={{
                flex: 1,
                padding: '4px 0',
                fontSize: '11px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.14)',
                background: align === a ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              {a}
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
      onClick={startEditing}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={(e) => e.stopPropagation()}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '100%', width: '100%', cursor: 'text' }}
    >
      {data?.text ? (
        <span
          style={{
            width: '100%',
            fontSize: `${fontSize}px`,
            fontWeight: weight === 'bold' ? 700 : 500,
            lineHeight: 1.25,
            color: '#ffffff',
            textAlign: align,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {data.text}
        </span>
      ) : (
        <span style={{ width: '100%', textAlign: align, fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
          Click to add text
        </span>
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
