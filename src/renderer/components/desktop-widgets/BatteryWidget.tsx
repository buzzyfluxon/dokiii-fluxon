import React, { useState, useEffect } from 'react';
import { DesktopWidgetSize } from '../../../shared/constants';

interface BatteryProps {
  size: DesktopWidgetSize;
}

export const BatteryWidget: React.FC<BatteryProps> = ({ size = 'small' }) => {
  const [battery, setBattery] = useState<{ percent: number; isCharging: boolean; hasBattery: boolean }>({
    percent: 100,
    isCharging: true,
    hasBattery: true,
  });

  useEffect(() => {
    let mounted = true;
    const fetchBattery = async () => {
      try {
        if (window.electronAPI?.getBatteryStatus) {
          const res = await window.electronAPI.getBatteryStatus();
          if (mounted && res) {
            setBattery(res);
          }
        }
      } catch (_) {}
    };
    fetchBattery();
    const timer = setInterval(fetchBattery, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const renderBatteryRing = (ringSize = 54) => {
    const center = ringSize / 2;
    const strokeWidth = 3.5;
    const r = center - strokeWidth;
    const circ = 2 * Math.PI * r;
    const offset = circ - (battery.percent / 100) * circ;

    return (
      <div style={{ position: 'relative', width: ringSize, height: ringSize }}>
        <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={center} cy={center} r={r} fill="none" stroke="rgba(255, 255, 255, 0.16)" strokeWidth={strokeWidth} />
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="#ffffff"
            strokeWidth={strokeWidth}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </svg>

        {battery.isCharging && (
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#30d158',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#30d158" stroke="#30d158" strokeWidth="1">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <line x1="2" y1="20" x2="22" y2="20" />
          </svg>
        </div>
      </div>
    );
  };

  if (size === 'medium') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Power & Battery
          </span>
          <span style={{ fontSize: '11px', color: battery.isCharging ? '#30d158' : 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
            {battery.isCharging ? 'Charging' : 'On Battery'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
          {renderBatteryRing(68)}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '36px', fontWeight: 600, letterSpacing: '-0.5px' }}>
              {battery.percent}%
            </span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              {battery.isCharging ? 'Connected to Power Adapter' : 'Remaining Battery'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (size === 'large') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Battery Health
          </span>
          <span style={{ fontSize: '12px', color: '#30d158', fontWeight: 600 }}>Normal</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          {renderBatteryRing(110)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '42px', fontWeight: 700, letterSpacing: '-1px' }}>
            {battery.percent}%
          </span>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
            {battery.isCharging ? 'Power Supply Connected' : 'Running on Internal Battery'}
          </span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '10px 14px', marginTop: '10px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Maximum Capacity: 100%</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '2px' }}>
        {renderBatteryRing(54)}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', paddingBottom: '2px' }}>
        <span style={{ fontSize: '34px', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1 }}>
          {battery.percent}%
        </span>
      </div>
    </div>
  );
};
