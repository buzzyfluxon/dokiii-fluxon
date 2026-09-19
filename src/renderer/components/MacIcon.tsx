import React, { useState, useEffect } from 'react';
import type { DockAppItem } from '../../shared/constants';
import photosIcon from '../assets/photos-icon.jpg';

import { useClockAngles, useTimeStore } from '../store/timeStore';

interface MacIconProps {
  app: DockAppItem;
  size?: number;
  live?: boolean;
}

export const MacIcon: React.FC<MacIconProps> = ({ app, size = 48, live = true }) => {
  const isClock = app.iconType === 'clock';
  const isCalendar = app.iconType === 'calendar';

  const clockAngles = useClockAngles();
  const minuteKey = useTimeStore((s) => (isCalendar && live ? s.minuteKey : ''));

  const dateInfo = React.useMemo(() => {
    if (!isCalendar) return { month: 'JAN', day: '1', weekday: 'MON' };
    const now = new Date();
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const weekNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return {
      month: monthNames[now.getMonth()],
      day: String(now.getDate()),
      weekday: weekNames[now.getDay()],
    };
  }, [isCalendar, minuteKey]);

  const [dynamicIcon, setDynamicIcon] = useState<string | null>(app.icon || null);

  useEffect(() => {
    let isMounted = true;
    if (app.iconType === 'custom' && app.path && window.electronAPI?.getAppIcon) {
      window.electronAPI
        .getAppIcon(app.path)
        .then((icon) => {
          if (isMounted && icon) {
            setDynamicIcon(icon);
          } else if (isMounted && app.icon) {
            setDynamicIcon(app.icon);
          }
        })
        .catch(() => {
          if (isMounted && app.icon) {
            setDynamicIcon(app.icon);
          }
        });
      return () => {
        isMounted = false;
      };
    } else if (app.icon) {
      setDynamicIcon(app.icon);
    }
  }, [app.icon, app.path, app.iconType]);

  const cornerRadius = Math.round(size * 0.22);

  const containerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: `${cornerRadius}px`,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35), inset 0 0.5px 0.5px rgba(255, 255, 255, 0.35)',
    flexShrink: 0,
  };

  if (app.iconType === 'calendar') {
    return (
      <div style={{ ...containerStyle, background: '#ffffff', flexDirection: 'column' }}>
        <div
          style={{
            width: '100%',
            height: '28%',
            background: 'linear-gradient(180deg, #ff453a 0%, #d70015 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: `${Math.max(7, Math.round(size * 0.16))}px`,
            fontWeight: 700,
            letterSpacing: '0.5px',
          }}
        >
          {dateInfo.month}
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1c1c1e',
            fontSize: `${Math.round(size * 0.44)}px`,
            fontWeight: 300,
            lineHeight: 1,
          }}
        >
          {dateInfo.day}
        </div>
      </div>
    );
  }

  if (app.iconType === 'clock') {
    const secDeg = clockAngles.second;
    const minDeg = clockAngles.minute;
    const hourDeg = clockAngles.hour;

    return (
      <div
        style={{
          ...containerStyle,
          background: 'linear-gradient(135deg, #2c2c2e 0%, #1c1c1e 100%)',
        }}
      >
        <svg width={size} height={size} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="#1c1c1e" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="50"
              y1="10"
              x2="50"
              y2={deg % 90 === 0 ? '16' : '13'}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={deg % 90 === 0 ? '3' : '1.5'}
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="28"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            transform={`rotate(${hourDeg} 50 50)`}
          />
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="18"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${minDeg} 50 50)`}
          />
          <line
            x1="50"
            y1="56"
            x2="50"
            y2="15"
            stroke="#ff453a"
            strokeWidth="1.5"
            strokeLinecap="round"
            transform={`rotate(${secDeg} 50 50)`}
          />
          <circle cx="50" cy="50" r="3.5" fill="#ff453a" />
        </svg>
      </div>
    );
  }

  if (app.iconType === 'finder') {
    return (
      <div
        style={{
          ...containerStyle,
          background: 'linear-gradient(135deg, #4fc3f7 0%, #0288d1 50%, #01579b 100%)',
        }}
      >
        <svg width={size * 0.76} height={size * 0.76} viewBox="0 0 100 100">
          <path
            d="M50 8 C26.8 8 8 26.8 8 50 C8 73.2 26.8 92 50 92 C73.2 92 92 73.2 92 50 C92 26.8 73.2 8 50 8 Z"
            fill="none"
          />
          <path
            d="M50 14 C30.1 14 14 30.1 14 50 C14 69.9 30.1 86 50 86 Z"
            fill="#81d4fa"
          />
          <path
            d="M50 14 C69.9 14 86 30.1 86 50 C86 69.9 69.9 86 50 86 Z"
            fill="#0288d1"
          />
          <path
            d="M50 14 L50 64 L40 64 C35 64 35 68 40 68 L50 68 L50 86"
            stroke="#0a2540"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="34" cy="42" r="5" fill="#0a2540" />
          <circle cx="66" cy="42" r="5" fill="#0a2540" />
          <path
            d="M26 66 Q50 82 74 66"
            stroke="#0a2540"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    );
  }

  if (app.iconType === 'safari') {
    return (
      <div
        style={{
          ...containerStyle,
          background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)',
        }}
      >
        <svg width={size * 0.88} height={size * 0.88} viewBox="0 0 100 100">
          <defs>
            <linearGradient id="safariGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#29b6f6" />
              <stop offset="100%" stopColor="#0277bd" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="44" fill="url(#safariGrad)" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((d) => (
            <line
              key={d}
              x1="50"
              y1="12"
              x2="50"
              y2={d % 90 === 0 ? '18' : '15'}
              stroke="rgba(255,255,255,0.7)"
              strokeWidth={d % 90 === 0 ? '2.5' : '1.5'}
              transform={`rotate(${d} 50 50)`}
            />
          ))}
          <polygon points="50,14 42,50 50,46" fill="#ff3b30" />
          <polygon points="50,14 58,50 50,46" fill="#d70015" />
          <polygon points="50,86 42,50 50,54" fill="#ffffff" />
          <polygon points="50,86 58,50 50,54" fill="#e0e0e0" />
          <circle cx="50" cy="50" r="4" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  if (app.iconType === 'terminal') {
    return (
      <div
        style={{
          ...containerStyle,
          background: 'linear-gradient(180deg, #3a3a3c 0%, #1c1c1e 100%)',
          border: '0.5px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 100 100">
          <rect x="6" y="10" width="88" height="80" rx="12" fill="#000000" />
          <path
            d="M22 32 L40 48 L22 64"
            stroke="#30d158"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <line
            x1="48"
            y1="64"
            x2="74"
            y2="64"
            stroke="#ffffff"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  if (app.iconType === 'mail') {
    return (
      <div
        style={{
          ...containerStyle,
          background: 'linear-gradient(135deg, #007aff 0%, #0051ba 100%)',
        }}
      >
        <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 100 100">
          <rect x="10" y="24" width="80" height="54" rx="8" fill="#ffffff" />
          <path
            d="M12 28 L50 56 L88 28"
            stroke="#007aff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <line x1="12" y1="74" x2="40" y2="50" stroke="#c7c7cc" strokeWidth="3" />
          <line x1="88" y1="74" x2="60" y2="50" stroke="#c7c7cc" strokeWidth="3" />
        </svg>
      </div>
    );
  }

  if (app.iconType === 'music') {
    return (
      <div
        style={{
          ...containerStyle,
          background: 'linear-gradient(135deg, #fc3c44 0%, #f92c8b 50%, #b827fc 100%)',
        }}
      >
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 100 100">
          <path
            d="M36 72 C36 78 30 84 22 84 C14 84 8 78 8 72 C8 66 14 60 22 60 C26 60 30 62 33 65 L33 26 C33 22 36 19 40 18 L76 10 C80 9 84 12 84 16 L84 56 C84 62 78 68 70 68 C62 68 56 62 56 56 C56 50 62 44 70 44 C74 44 78 46 81 49 L81 22 L36 32 Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    );
  }

  if (app.iconType === 'photos') {
    return (
      <div
        style={{
          ...containerStyle,
          background: 'transparent',
          boxShadow: 'none',
        }}
      >
        <img
          src={photosIcon}
          alt="Photos"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: `${cornerRadius}px`,
            objectFit: 'cover',
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.35))',
          }}
          draggable={false}
        />
      </div>
    );
  }

  if (app.iconType === 'settings') {
    return (
      <div
        style={{
          ...containerStyle,
          background: 'linear-gradient(135deg, #8e8e93 0%, #48484a 50%, #2c2c2e 100%)',
        }}
      >
        <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="16" fill="#636366" stroke="#aeaeb2" strokeWidth="4" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
            <rect
              key={d}
              x="44"
              y="12"
              width="12"
              height="16"
              rx="4"
              fill="#aeaeb2"
              transform={`rotate(${d} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="32" fill="none" stroke="#aeaeb2" strokeWidth="6" />
        </svg>
      </div>
    );
  }

  if (app.iconType === 'app-store') {
    return (
      <div
        style={{
          ...containerStyle,
          background: 'linear-gradient(135deg, #0a84ff 0%, #0051ba 100%)',
        }}
      >
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 100 100">
          <line x1="50" y1="16" x2="22" y2="76" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
          <line x1="50" y1="16" x2="78" y2="76" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
          <line x1="26" y1="56" x2="74" y2="56" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  const iconToRender = dynamicIcon || app.icon;

  if (iconToRender) {
    return (
      <div
        style={{
          ...containerStyle,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.05) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '0.5px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <img
          src={iconToRender}
          alt={app.name}
          style={{
            width: `${Math.round(size * 0.74)}px`,
            height: `${Math.round(size * 0.74)}px`,
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.4))',
          }}
          draggable={false}
        />
      </div>
    );
  }

  const initial = app.name ? app.name.charAt(0).toUpperCase() : 'A';
  const customColor = app.color || 'linear-gradient(135deg, #636366 0%, #3a3a3c 100%)';

  return (
    <div
      style={{
        ...containerStyle,
        background: customColor.includes('gradient')
          ? customColor
          : `linear-gradient(135deg, ${customColor} 0%, #1c1c1e 100%)`,
      }}
    >
      <span
        style={{
          color: '#ffffff',
          fontSize: `${Math.round(size * 0.45)}px`,
          fontWeight: 700,
          letterSpacing: '-0.5px',
        }}
      >
        {initial}
      </span>
    </div>
  );
};
export default MacIcon;
