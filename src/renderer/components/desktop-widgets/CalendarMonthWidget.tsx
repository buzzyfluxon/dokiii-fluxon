import React from 'react';
import { DesktopWidgetSize } from '../../../shared/constants';

interface CalendarProps {
  size: DesktopWidgetSize;
}

export const CalendarMonthWidget: React.FC<CalendarProps> = ({ size = 'small' }) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const days: { day: number; currentMonth: boolean; isToday: boolean }[] = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({
      day: daysInPrevMonth - i,
      currentMonth: false,
      isToday: false,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      currentMonth: true,
      isToday: i === currentDay,
    });
  }

  const remaining = 35 - days.length;
  const fillDays = remaining >= 0 ? remaining : 42 - days.length;
  for (let i = 1; i <= fillDays; i++) {
    days.push({
      day: i,
      currentMonth: false,
      isToday: false,
    });
  }

  const weekdayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const grid = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '2px' }}>
        {weekdayHeaders.map((w, idx) => (
          <span key={idx} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
            {w}
          </span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '3px', textAlign: 'center' }}>
        {days.slice(0, 35).map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '18px',
              fontSize: '11px',
              fontWeight: item.isToday ? 700 : 400,
              color: item.isToday
                ? '#000000'
                : item.currentMonth
                ? 'rgba(255,255,255,0.9)'
                : 'rgba(255,255,255,0.25)',
              background: item.isToday ? '#ffffff' : 'transparent',
              borderRadius: '5px',
              boxShadow: item.isToday ? '0 2px 6px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            {item.day}
          </div>
        ))}
      </div>
    </div>
  );

  if (size === 'medium') {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ flex: 1.1 }}>{grid}</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#ff3b30', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {monthNames[currentMonth]} {currentYear}
          </span>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>
            {today.toLocaleDateString(undefined, { weekday: 'long' })}
          </span>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 10px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
            No events scheduled today
          </div>
        </div>
      </div>
    );
  }

  if (size === 'large') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
            {monthNames[currentMonth]} {currentYear}
          </span>
          <span style={{ fontSize: '12px', color: '#ff3b30', fontWeight: 600 }}>
            Day {currentDay}
          </span>
        </div>
        <div style={{ margin: '12px 0' }}>{grid}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Today's Schedule
          </span>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
            All clear for today
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      {grid}
    </div>
  );
};
