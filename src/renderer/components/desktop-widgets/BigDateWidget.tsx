import React, { useEffect, useState } from 'react';
import { FitBox } from './FitBox';

interface BigDateWidgetProps {
  width: number;
  height: number;
}

const FONT = '"SF Pro Rounded", "SF Pro Display", "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

export const BigDateWidget: React.FC<BigDateWidgetProps> = ({ width, height }) => {
  const [now, setNow] = useState(() => new Date());
  const [battery, setBattery] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let alive = true;
    const read = () => {
      window.electronAPI
        ?.getBatteryStatus()
        .then((b) => {
          if (alive) setBattery(b && b.hasBattery ? b.percent : null);
        })
        .catch(() => {});
    };
    read();
    const timer = setInterval(read, 60000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const hour = String(now.getHours() % 12 || 12);
  const minute = String(now.getMinutes()).padStart(2, '0');

  return (
    <FitBox width={width} height={height} designWidth={436} designHeight={216}>
      <div
        style={{
          width: '436px',
          height: '216px',
          boxSizing: 'border-box',
          padding: '16px 20px 18px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: FONT,
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {battery !== null ? (
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.45)',
                background: 'rgba(255,255,255,0.1)',
                letterSpacing: '0.2px',
              }}
            >
              {battery}%
            </span>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '25px', fontWeight: 700, letterSpacing: '-0.4px', lineHeight: 1.05 }}>
              {WEEKDAYS[now.getDay()]}
            </span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.78)', letterSpacing: '0.4px' }}>
              {now.getDate()} {MONTHS[now.getMonth()]}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', lineHeight: 0.84 }}>
          <span style={{ fontSize: '108px', fontWeight: 700, letterSpacing: '-4px', color: '#d9d9dd' }}>{hour}</span>
          <span style={{ fontSize: '108px', fontWeight: 700, letterSpacing: '-4px', color: '#8e8e93' }}>{minute}</span>
        </div>
      </div>
    </FitBox>
  );
};

export default BigDateWidget;
