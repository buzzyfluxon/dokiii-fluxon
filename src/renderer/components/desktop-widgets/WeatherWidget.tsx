import React, { useEffect, useState } from 'react';
import { FitBox } from './FitBox';

type WxKind = 'sun' | 'partly' | 'cloud' | 'fog' | 'rain' | 'snow' | 'storm';

interface WxHour {
  label: string;
  temp: number;
  kind: WxKind;
}

interface WxDay {
  label: string;
  lo: number;
  hi: number;
  kind: WxKind;
}

interface WxData {
  temp: number;
  hi: number;
  lo: number;
  text: string;
  hours: WxHour[];
  days: WxDay[];
}

const kindFromCode = (code: number): WxKind => {
  if (code === 0) return 'sun';
  if (code <= 2) return 'partly';
  if (code === 3) return 'cloud';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'rain';
};

const textFromCode = (code: number): string => {
  if (code === 0) return 'Clear';
  if (code === 1) return 'Mostly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Cloudy';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
};

const CLOUD = 'M7 19a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.6 4.7 4.7 0 0 1 17.5 19H7z';

const WxIcon: React.FC<{ kind: WxKind; size?: number }> = ({ kind, size = 14 }) => {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block', flexShrink: 0 }}>
      {kind === 'sun' && (
        <g stroke="#e8e8ec" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4.2" fill="#e8e8ec" />
          {rays.map((a) => (
            <line key={a} x1="12" y1="2.6" x2="12" y2="5" transform={`rotate(${a} 12 12)`} />
          ))}
        </g>
      )}
      {kind === 'partly' && (
        <g>
          <circle cx="9" cy="8.5" r="3.4" fill="#b9b9c0" />
          <path d={CLOUD} fill="#e8e8ec" transform="translate(1.5 1) scale(0.88)" />
        </g>
      )}
      {kind === 'cloud' && <path d={CLOUD} fill="#d6d6dc" />}
      {kind === 'fog' && (
        <g stroke="#c9c9d0" strokeWidth="2.2" strokeLinecap="round">
          <line x1="4" y1="8" x2="20" y2="8" />
          <line x1="6" y1="12.5" x2="22" y2="12.5" />
          <line x1="4" y1="17" x2="18" y2="17" />
        </g>
      )}
      {kind === 'rain' && (
        <g>
          <path d={CLOUD} fill="#d6d6dc" transform="translate(0 -3)" />
          <g stroke="#9a9aa2" strokeWidth="2" strokeLinecap="round">
            <line x1="8" y1="18" x2="7" y2="21.5" />
            <line x1="12.5" y1="18" x2="11.5" y2="21.5" />
            <line x1="17" y1="18" x2="16" y2="21.5" />
          </g>
        </g>
      )}
      {kind === 'snow' && (
        <g>
          <path d={CLOUD} fill="#d6d6dc" transform="translate(0 -3)" />
          <g fill="#c9c9d0">
            <circle cx="8" cy="19.5" r="1.4" />
            <circle cx="12.5" cy="21" r="1.4" />
            <circle cx="17" cy="19.5" r="1.4" />
          </g>
        </g>
      )}
      {kind === 'storm' && (
        <g>
          <path d={CLOUD} fill="#b9b9c0" transform="translate(0 -3)" />
          <polygon points="13,14 9,20 12,20 10.5,24 16,17 12.8,17" fill="#f2f2f5" />
        </g>
      )}
    </svg>
  );
};

const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? 'AM' : 'PM'}`;

const loadWeather = async (city: string): Promise<WxData> => {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`
  );
  const geo = await geoRes.json();
  const place = geo?.results?.[0];
  if (!place) throw new Error('city not found');
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=6`
  );
  const d = await res.json();
  const hourKey = String(d.current.time).slice(0, 13) + ':00';
  const start = Math.max(0, d.hourly.time.indexOf(hourKey));
  const hours: WxHour[] = [];
  for (let i = 0; i < 6; i++) {
    const idx = start + i;
    if (d.hourly.time[idx] === undefined) break;
    hours.push({
      label: hourLabel(Number(String(d.hourly.time[idx]).slice(11, 13))),
      temp: Math.round(d.hourly.temperature_2m[idx]),
      kind: kindFromCode(d.hourly.weather_code[idx]),
    });
  }
  const days: WxDay[] = [];
  for (let i = 1; i <= 5; i++) {
    if (d.daily.time[i] === undefined) break;
    days.push({
      label: new Date(`${d.daily.time[i]}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' }),
      lo: Math.round(d.daily.temperature_2m_min[i]),
      hi: Math.round(d.daily.temperature_2m_max[i]),
      kind: kindFromCode(d.daily.weather_code[i]),
    });
  }
  return {
    temp: Math.round(d.current.temperature_2m),
    hi: Math.round(d.daily.temperature_2m_max[0]),
    lo: Math.round(d.daily.temperature_2m_min[0]),
    text: textFromCode(d.current.weather_code),
    hours,
    days,
  };
};

const cacheKey = (city: string) => `dokiii-weather:${city.toLowerCase()}`;

const readCache = (city: string): WxData | null => {
  try {
    const raw = localStorage.getItem(cacheKey(city));
    return raw ? (JSON.parse(raw) as WxData) : null;
  } catch {
    return null;
  }
};

interface WeatherWidgetProps {
  width: number;
  height: number;
  city?: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ width, height, city }) => {
  const place = (city || 'Bengaluru').trim() || 'Bengaluru';
  const [data, setData] = useState<WxData | null>(() => readCache(place));

  useEffect(() => {
    let alive = true;
    setData(readCache(place));
    const refresh = () => {
      loadWeather(place)
        .then((next) => {
          if (!alive) return;
          setData(next);
          try {
            localStorage.setItem(cacheKey(place), JSON.stringify(next));
          } catch {}
        })
        .catch(() => {});
    };
    refresh();
    const timer = setInterval(refresh, 20 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [place]);

  const lows = data ? data.days.map((x) => x.lo) : [];
  const highs = data ? data.days.map((x) => x.hi) : [];
  const min = lows.length ? Math.min(...lows) : 0;
  const max = highs.length ? Math.max(...highs) : 1;
  const span = Math.max(1, max - min);

  return (
    <FitBox width={width} height={height} designWidth={212} designHeight={216}>
      <div
        style={{
          width: '212px',
          height: '216px',
          boxSizing: 'border-box',
          padding: '11px 12px 10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontVariantNumeric: 'tabular-nums',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              {place}
              <svg width="7" height="7" viewBox="0 0 10 10" fill="#ffffff">
                <polygon points="9,1 1,4.5 4.6,5.4 5.5,9" />
              </svg>
            </span>
            <span style={{ fontSize: '30px', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.5px' }}>
              {data ? `${data.temp}°` : '--°'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: '2px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600 }}>{data ? data.text : ''}</span>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginTop: '1px' }}>
              {data ? `H:${data.hi}° L:${data.lo}°` : ''}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '2px' }}>
          {(data ? data.hours : []).map((h, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flex: 1 }}>
              <span style={{ fontSize: '7.5px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{h.label}</span>
              <WxIcon kind={h.kind} size={13} />
              <span style={{ fontSize: '9px', fontWeight: 600 }}>{h.temp}°</span>
            </div>
          ))}
        </div>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.14)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {(data ? data.days : []).map((day, i) => {
            const left = ((day.lo - min) / span) * 100;
            const barWidth = Math.max(8, ((day.hi - day.lo) / span) * 100);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '15px' }}>
                <span style={{ width: '24px', fontSize: '9px', fontWeight: 600 }}>{day.label}</span>
                <WxIcon kind={day.kind} size={11} />
                <span style={{ width: '20px', textAlign: 'right', fontSize: '9px', color: 'rgba(255,255,255,0.55)' }}>
                  {day.lo}°
                </span>
                <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.16)', position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: `${Math.min(left, 100 - barWidth)}%`,
                      width: `${barWidth}%`,
                      top: 0,
                      bottom: 0,
                      borderRadius: '2px',
                      background: 'linear-gradient(90deg, #8e8e93, #f2f2f5)',
                    }}
                  />
                </div>
                <span style={{ width: '20px', fontSize: '9px', fontWeight: 600 }}>{day.hi}°</span>
              </div>
            );
          })}
        </div>
      </div>
    </FitBox>
  );
};

export default WeatherWidget;
