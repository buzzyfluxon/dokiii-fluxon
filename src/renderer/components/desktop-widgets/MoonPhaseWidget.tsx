import React, { useState, useEffect } from 'react';
import { DesktopWidgetSize } from '../../../shared/constants';

interface MoonPhaseProps {
  size: DesktopWidgetSize;
}

export const MoonPhaseWidget: React.FC<MoonPhaseProps> = ({ size = 'small' }) => {
  const [moonData, setMoonData] = useState({
    phaseFraction: 0.5,
    phaseName: 'Full Moon',
    illumination: 100,
  });

  useEffect(() => {
    const computeMoon = () => {
      const now = new Date();
      const referenceTime = Date.UTC(2000, 0, 6, 18, 14, 0);
      const synodicMonth = 29.53058867 * 86400 * 1000;
      const diff = now.getTime() - referenceTime;
      const phaseFraction = ((diff % synodicMonth) + synodicMonth) % synodicMonth / synodicMonth;

      const illumination = Math.round(((1 - Math.cos(phaseFraction * 2 * Math.PI)) / 2) * 100);

      let phaseName = '';
      if (phaseFraction < 0.03 || phaseFraction >= 0.97) {
        phaseName = 'New Moon';
      } else if (phaseFraction < 0.22) {
        phaseName = 'Waxing Crescent';
      } else if (phaseFraction < 0.28) {
        phaseName = 'First Quarter';
      } else if (phaseFraction < 0.47) {
        phaseName = 'Waxing Gibbous';
      } else if (phaseFraction < 0.53) {
        phaseName = 'Full Moon';
      } else if (phaseFraction < 0.72) {
        phaseName = 'Waning Gibbous';
      } else if (phaseFraction < 0.78) {
        phaseName = 'Last Quarter';
      } else {
        phaseName = 'Waning Crescent';
      }

      setMoonData({
        phaseFraction,
        phaseName,
        illumination,
      });
    };

    computeMoon();
    const timer = setInterval(computeMoon, 600000);
    return () => clearInterval(timer);
  }, []);

  const renderMoonGraphic = (radius = 48) => {
    const diameter = radius * 2;
    const center = radius;
    const p = moonData.phaseFraction;
    const isWaxing = p <= 0.5;

    let shadowPath = '';
    const norm = isWaxing ? p * 2 : (p - 0.5) * 2;
    const offset = (norm - 0.5) * 2;
    const rX = Math.abs(offset) * radius;

    if (p < 0.5) {
      if (offset < 0) {
        shadowPath = `M ${center} ${center - radius} A ${radius} ${radius} 0 0 0 ${center} ${center + radius} A ${rX} ${radius} 0 0 1 ${center} ${center - radius} Z`;
      } else {
        shadowPath = `M ${center} ${center - radius} A ${radius} ${radius} 0 0 0 ${center} ${center + radius} A ${rX} ${radius} 0 0 0 ${center} ${center - radius} Z`;
      }
    } else {
      if (offset < 0) {
        shadowPath = `M ${center} ${center - radius} A ${radius} ${radius} 0 0 1 ${center} ${center + radius} A ${rX} ${radius} 0 0 0 ${center} ${center - radius} Z`;
      } else {
        shadowPath = `M ${center} ${center - radius} A ${radius} ${radius} 0 0 1 ${center} ${center + radius} A ${rX} ${radius} 0 0 1 ${center} ${center - radius} Z`;
      }
    }

    return (
      <div
        style={{
          width: diameter,
          height: diameter,
          borderRadius: '50%',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6), inset 0 0 10px rgba(255,255,255,0.15)',
        }}
      >
        <svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`}>
          <defs>
            <radialGradient id="moonTexture" cx="45%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#f4f4f6" />
              <stop offset="50%" stopColor="#d2d4d8" />
              <stop offset="85%" stopColor="#9da0a6" />
              <stop offset="100%" stopColor="#686b72" />
            </radialGradient>
            <radialGradient id="craterDark" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(50,52,58,0.55)" />
              <stop offset="100%" stopColor="rgba(70,72,80,0.1)" />
            </radialGradient>
          </defs>

          <circle cx={center} cy={center} r={radius} fill="url(#moonTexture)" />

          <circle cx={center - radius * 0.3} cy={center - radius * 0.2} r={radius * 0.25} fill="url(#craterDark)" />
          <circle cx={center + radius * 0.25} cy={center - radius * 0.35} r={radius * 0.18} fill="url(#craterDark)" />
          <circle cx={center + radius * 0.2} cy={center + radius * 0.25} r={radius * 0.3} fill="url(#craterDark)" />
          <circle cx={center - radius * 0.35} cy={center + radius * 0.3} r={radius * 0.2} fill="url(#craterDark)" />
          <circle cx={center - radius * 0.05} cy={center + radius * 0.05} r={radius * 0.15} fill="url(#craterDark)" />

          {shadowPath && (
            <path
              d={shadowPath}
              fill="rgba(10, 10, 14, 0.88)"
              style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }}
            />
          )}

          <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        </svg>
      </div>
    );
  };

  if (size === 'medium') {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {renderMoonGraphic(46)}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Lunar Phase
          </span>
          <span style={{ fontSize: '18px', fontWeight: 600 }}>{moonData.phaseName}</span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            Illumination: {moonData.illumination}%
          </span>
        </div>
      </div>
    );
  }

  if (size === 'large') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Moon Phase
          </span>
          <span style={{ fontSize: '12px', color: '#0a84ff', fontWeight: 500 }}>
            {moonData.illumination}% lit
          </span>
        </div>
        <div style={{ margin: 'auto 0' }}>{renderMoonGraphic(85)}</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <span style={{ fontSize: '16px', fontWeight: 600 }}>{moonData.phaseName}</span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Waxing Moon Cycle</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      {renderMoonGraphic(48)}
    </div>
  );
};
