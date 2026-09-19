import React from 'react';
import { DesktopWidgetSize } from '../../../shared/constants';
import { useClockAngles, useMinuteTick } from '../../store/timeStore';

interface AnalogClockProps {
  size: DesktopWidgetSize;
}

const ClockFace = React.memo<{ diameter: number }>(({ diameter }) => {
  const center = diameter / 2;
  const r = center - 6;
  const hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  return (
    <>
      <circle cx={center} cy={center} r={r} fill="#141416" stroke="rgba(255, 255, 255, 0.18)" strokeWidth="1.5" />

      {Array.from({ length: 60 }).map((_, i) => {
        const angle = (i * 6 * Math.PI) / 180;
        const isHour = i % 5 === 0;
        const length = isHour ? 4 : 2;
        const rInner = r - length - 2;
        const x1 = center + (r - 2) * Math.sin(angle);
        const y1 = center - (r - 2) * Math.cos(angle);
        const x2 = center + rInner * Math.sin(angle);
        const y2 = center - rInner * Math.cos(angle);

        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isHour ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.25)'}
            strokeWidth={isHour ? 1.4 : 0.8}
          />
        );
      })}

      {hourNumbers.map((num, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const numR = r - 12;
        const x = center + numR * Math.sin(angle);
        const y = center - numR * Math.cos(angle) + 3.5;

        return (
          <text
            key={num}
            x={x}
            y={y}
            fill="#ffffff"
            fontSize={diameter < 130 ? '8.5' : '11'}
            fontWeight="500"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto"
            textAnchor="middle"
          >
            {num}
          </text>
        );
      })}
    </>
  );
});

const ClockDial: React.FC<{
  diameter: number;
  angles: { hour: number; minute: number; second: number };
}> = ({ diameter, angles }) => {
  const center = diameter / 2;
  const r = center - 6;

  return (
    <svg
      width={diameter}
      height={diameter}
      viewBox={`0 0 ${diameter} ${diameter}`}
      style={{ willChange: 'transform' }}
    >
      <ClockFace diameter={diameter} />

      <g transform={`rotate(${angles.hour} ${center} ${center})`}>
        <line
          x1={center}
          y1={center}
          x2={center}
          y2={center - r * 0.5}
          stroke="#ffffff"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </g>

      <g transform={`rotate(${angles.minute} ${center} ${center})`}>
        <line
          x1={center}
          y1={center}
          x2={center}
          y2={center - r * 0.72}
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>

      <g transform={`rotate(${angles.second} ${center} ${center})`}>
        <line
          x1={center}
          y1={center + 10}
          x2={center}
          y2={center - r * 0.82}
          stroke="#ff9500"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx={center} cy={center} r="3" fill="#ff9500" />
        <circle cx={center} cy={center} r="1.2" fill="#141416" />
      </g>
    </svg>
  );
};

export const AnalogClockWidget: React.FC<AnalogClockProps> = ({ size = 'small' }) => {
  const angles = useClockAngles();
  const { timeString, dateString } = useMinuteTick();

  if (size === 'medium') {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ClockDial diameter={116} angles={angles} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Current Time
          </span>
          <span style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.5px' }}>{timeString}</span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{dateString}</span>
        </div>
      </div>
    );
  }

  if (size === 'large') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Analog Clock
          </span>
          <span style={{ fontSize: '12px', color: '#ff9500', fontWeight: 500 }}>{timeString}</span>
        </div>
        <div style={{ margin: 'auto 0' }}>
          <ClockDial diameter={200} angles={angles} />
        </div>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>{dateString}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <ClockDial diameter={116} angles={angles} />
    </div>
  );
};
