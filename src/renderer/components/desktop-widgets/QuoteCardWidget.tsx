import React, { useState, useEffect } from 'react';
import { DesktopWidgetSize } from '../../../shared/constants';
import { IconPencil, IconPlus, IconClose } from '../Icons';

interface Quote {
  id: string;
  text: string;
  author: string;
}

interface QuoteCardData {
  quotes?: Quote[];
  activeIndex?: number;
  rotate?: boolean;
}

interface QuoteCardWidgetProps {
  size: DesktopWidgetSize;
  data?: QuoteCardData;
  onUpdateData: (patch: Partial<QuoteCardData>) => void;
}

export const QuoteCardWidget: React.FC<QuoteCardWidgetProps> = ({ size, data, onUpdateData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [textDraft, setTextDraft] = useState('');
  const [authorDraft, setAuthorDraft] = useState('');

  const quotes = data?.quotes || [];
  const activeIndex = Math.min(data?.activeIndex || 0, Math.max(quotes.length - 1, 0));
  const active = quotes[activeIndex];
  const rotate = Boolean(data?.rotate);

  useEffect(() => {
    if (!rotate || quotes.length < 2) return;
    const timer = setInterval(() => {
      onUpdateData({ activeIndex: (activeIndex + 1) % quotes.length });
    }, 20000);
    return () => clearInterval(timer);
  }, [rotate, quotes.length, activeIndex]);

  const addQuote = () => {
    if (!textDraft.trim()) return;
    const next: Quote = { id: `q-${Date.now()}`, text: textDraft.trim(), author: authorDraft.trim() };
    const updated = [...quotes, next];
    onUpdateData({ quotes: updated, activeIndex: updated.length - 1 });
    setTextDraft('');
    setAuthorDraft('');
  };

  const removeQuote = (id: string) => {
    const updated = quotes.filter((q) => q.id !== id);
    onUpdateData({ quotes: updated, activeIndex: 0 });
  };

  const quoteFontSize = size === 'large' ? 20 : size === 'medium' ? 16 : 13;

  if (isEditing) {
    return (
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px', overflowY: 'auto' }}
      >
        <textarea
          value={textDraft}
          onChange={(e) => setTextDraft(e.target.value)}
          placeholder="Quote text"
          style={{
            resize: 'none',
            minHeight: '48px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '10px',
            padding: '8px',
            color: '#ffffff',
            fontSize: '12px',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <input
          value={authorDraft}
          onChange={(e) => setAuthorDraft(e.target.value)}
          placeholder="Author"
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
        <button
          onClick={addQuote}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px 0', fontSize: '12px', borderRadius: '8px', border: 'none', background: '#0a84ff', color: '#ffffff', cursor: 'pointer' }}
        >
          <IconPlus size={11} />
          Add Quote
        </button>

        {quotes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {quotes.map((q, i) => (
              <div
                key={q.id}
                onClick={() => onUpdateData({ activeIndex: i })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px',
                  padding: '5px 8px',
                  borderRadius: '8px',
                  background: i === activeIndex ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {q.text}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeQuote(q.id);
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                  <IconClose size={10} color="rgba(255,255,255,0.5)" />
                </button>
              </div>
            ))}
          </div>
        )}

        {quotes.length > 1 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
            <input type="checkbox" checked={rotate} onChange={(e) => onUpdateData({ rotate: e.target.checked })} />
            Rotate quotes
          </label>
        )}

        <button
          onClick={() => setIsEditing(false)}
          style={{ padding: '6px 0', fontSize: '12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#ffffff', cursor: 'pointer' }}
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={(e) => e.stopPropagation()}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', width: '100%', cursor: 'pointer', gap: '10px' }}
    >
      {active ? (
        <>
          <span
            style={{
              fontSize: `${quoteFontSize}px`,
              fontWeight: 600,
              lineHeight: 1.3,
              color: '#ffffff',
              fontStyle: 'italic',
              display: '-webkit-box',
              WebkitLineClamp: size === 'small' ? 4 : 6,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            &ldquo;{active.text}&rdquo;
          </span>
          {active.author && (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', fontWeight: 500, letterSpacing: '0.3px' }}>
              &mdash; {active.author}
            </span>
          )}
        </>
      ) : (
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Click to add a quote</span>
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
