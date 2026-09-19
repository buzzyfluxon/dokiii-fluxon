import React from 'react';
import { DesktopWidgetSize } from '../../../shared/constants';
import { useTimeStore } from '../../store/timeStore';

interface WorldClockProps {
  size: DesktopWidgetSize;
  customTitle?: string;
  city?: string;
}

const WORLD_MAP_PATH = "M25,22 Q30,12 42,16 Q52,18 55,28 Q50,42 42,48 Q35,46 30,38 Q22,34 25,22 Z M42,56 Q48,58 52,68 Q50,82 42,88 Q36,80 38,68 Z M85,15 Q105,12 125,20 Q145,15 160,22 Q175,32 165,48 Q152,55 138,45 Q120,48 108,40 Q95,44 88,32 Q82,24 85,15 Z M92,48 Q105,46 112,54 Q115,70 105,82 Q94,80 88,68 Q86,56 92,48 Z M148,60 Q162,58 168,68 Q165,78 152,80 Q142,75 148,60 Z";

const WorldMapSvg: React.FC<{ height: string }> = React.memo(({ height }) => (
  <svg
    viewBox="0 0 200 100"
    style={{
      width: '100%',
      height,
      opacity: 0.85,
      filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
    }}
  >
    <path fill="rgba(255, 255, 255, 0.72)" d={WORLD_MAP_PATH} />
  </svg>
));

export const WorldClockWidget: React.FC<WorldClockProps> = ({
  size = 'small',
  customTitle = 'At Home',
  city = 'Local',
}) => {
  const time = useTimeStore((s) => s.timeString);
  const secondsNum = useTimeStore((s) => (size === 'small' ? 0 : s.seconds));
  const sec = size === 'small' ? '' : String(secondsNum).padStart(2, '0');

  const mapHeight = size === 'large' ? '120px' : size === 'medium' ? '70px' : '55px';

  if (size === 'medium') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            World Clock
          </span>
          <span style={{ fontSize: '11px', color: '#0a84ff', fontWeight: 500 }}>{city}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div style={{ flex: 1.2 }}>
            <WorldMapSvg height={mapHeight} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{customTitle}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.5px' }}>{time}</span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{sec}</span>
            </div>
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
            World Clock
          </span>
          <span style={{ fontSize: '12px', color: '#0a84ff', fontWeight: 500 }}>{city}</span>
        </div>
        <div style={{ margin: '8px 0' }}>
          <WorldMapSvg height={mapHeight} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '4px' }}>
          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{customTitle}</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '44px', fontWeight: 600, letterSpacing: '-1px' }}>{time}</span>
            <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.45)' }}>{sec}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingTop: '2px' }}>
        <WorldMapSvg height={mapHeight} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '2px' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>
          {customTitle}
        </span>
        <span style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.5px' }}>{time}</span>
      </div>
    </div>
  );
};
