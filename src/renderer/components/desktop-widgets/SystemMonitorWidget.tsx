import React, { useState, useEffect } from 'react';
import { DesktopWidgetSize } from '../../../shared/constants';

interface SystemMonitorProps {
  size: DesktopWidgetSize;
}

export const SystemMonitorWidget: React.FC<SystemMonitorProps> = ({ size = 'small' }) => {
  const [metrics, setMetrics] = useState<{ cpu: number; ram: number; ssd: number }>({
    cpu: 12,
    ram: 68,
    ssd: 78,
  });

  useEffect(() => {
    let mounted = true;
    const fetchMetrics = async () => {
      try {
        if (window.electronAPI?.getSystemMetrics) {
          const res = await window.electronAPI.getSystemMetrics();
          if (mounted && res) {
            setMetrics(res);
          }
        }
      } catch (_) {}
    };
    fetchMetrics();
    const timer = setInterval(fetchMetrics, 6000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const renderGaugeRings = (svgSize = 58) => {
    const center = svgSize / 2;
    const strokeWidth = 3.5;
    const r1 = center - strokeWidth;
    const r2 = r1 - strokeWidth - 2.5;
    const r3 = r2 - strokeWidth - 2.5;

    const c1 = 2 * Math.PI * r1;
    const c2 = 2 * Math.PI * r2;
    const c3 = 2 * Math.PI * r3;

    const o1 = c1 - (metrics.cpu / 100) * c1;
    const o2 = c2 - (metrics.ram / 100) * c2;
    const o3 = c3 - (metrics.ssd / 100) * c3;

    return (
      <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={center} cy={center} r={r1} fill="none" stroke="rgba(255, 255, 255, 0.14)" strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={r1}
          fill="none"
          stroke="#ffffff"
          strokeWidth={strokeWidth}
          strokeDasharray={c1}
          strokeDashoffset={o1}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />

        <circle cx={center} cy={center} r={r2} fill="none" stroke="rgba(255, 255, 255, 0.14)" strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={r2}
          fill="none"
          stroke="rgba(255, 255, 255, 0.75)"
          strokeWidth={strokeWidth}
          strokeDasharray={c2}
          strokeDashoffset={o2}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />

        <circle cx={center} cy={center} r={r3} fill="none" stroke="rgba(255, 255, 255, 0.14)" strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={r3}
          fill="none"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth={strokeWidth}
          strokeDasharray={c3}
          strokeDashoffset={o3}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
    );
  };

  if (size === 'medium') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            System Activity
          </span>
          <span style={{ fontSize: '11px', color: '#30d158', fontWeight: 600 }}>Normal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
          {renderGaugeRings(72)}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'rgba(255,255,255,0.65)' }}>CPU</span>
              <span style={{ fontWeight: 600 }}>{metrics.cpu}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'rgba(255,255,255,0.65)' }}>RAM</span>
              <span style={{ fontWeight: 600 }}>{metrics.ram}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'rgba(255,255,255,0.65)' }}>SSD</span>
              <span style={{ fontWeight: 600 }}>{metrics.ssd}%</span>
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
            System Monitor
          </span>
          <span style={{ fontSize: '12px', color: '#30d158', fontWeight: 600 }}>Healthy</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
          {renderGaugeRings(120)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Processor (CPU)</span>
            <span style={{ fontWeight: 600 }}>{metrics.cpu}%</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Memory (RAM)</span>
            <span style={{ fontWeight: 600 }}>{metrics.ram}%</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Disk Storage (SSD)</span>
            <span style={{ fontWeight: 600 }}>{metrics.ssd}%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '2px' }}>
        {renderGaugeRings(56)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', paddingBottom: '2px' }}>
        <div style={{ display: 'flex', gap: '6px', fontSize: '11px', fontWeight: 500, letterSpacing: '0.2px' }}>
          <span style={{ color: 'rgba(255,255,255,0.65)' }}>CPU</span>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>{metrics.cpu}%</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', fontSize: '11px', fontWeight: 500, letterSpacing: '0.2px' }}>
          <span style={{ color: 'rgba(255,255,255,0.65)' }}>RAM</span>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>{metrics.ram}%</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', fontSize: '11px', fontWeight: 500, letterSpacing: '0.2px' }}>
          <span style={{ color: 'rgba(255,255,255,0.65)' }}>SSD</span>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>{metrics.ssd}%</span>
        </div>
      </div>
    </div>
  );
};
