import React, { useEffect, useState } from 'react';
import { FitBox } from './FitBox';

interface DigitalClockWidgetProps {
  width: number;
  height: number;
  label?: string;
  timezone?: string;
}

const FONT = '"DS-Digital", "Orbitron", "Consolas", "SF Mono", "Courier New", monospace';

const formatTime = (date: Date, timezone?: string): string => {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      ...(timezone ? { timeZone: timezone } : {}),
    }).formatToParts(date);
    const h = parts.find((p) => p.type === 'hour')?.value || '12';
    const m = parts.find((p) => p.type === 'minute')?.value || '00';
    return `${h}:${m}`;
  } catch {
    return `${date.getHours() % 12 || 12}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
};

export const DigitalClockWidget: React.FC<DigitalClockWidgetProps> = ({ width, height, label, timezone }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <FitBox width={width} height={height} designWidth={100} designHeight={110}>
      <div
        style={{
          width: '100px',
          height: '110px',
          boxSizing: 'border-box',
          padding: '12px 9px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#ffffff',
        }}
      >
        <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.8px', color: 'rgba(255,255,255,0.6)' }}>
          {(label || 'MUM').toUpperCase()}
        </span>
        <div
          style={{
            width: '100%',
            height: '52px',
            borderRadius: '13px',
            border: '2.5px solid rgba(255,255,255,0.9)',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.05)',
          }}
        >
          <span
            style={{
              fontFamily: FONT,
              fontSize: '25px',
              fontWeight: 800,
              letterSpacing: '0.5px',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {formatTime(now, timezone)}
          </span>
        </div>
      </div>
    </FitBox>
  );
};

export default DigitalClockWidget;
