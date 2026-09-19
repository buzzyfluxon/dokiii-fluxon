import React, { useState, useEffect } from 'react';
import { DesktopWidgetSize } from '../../../shared/constants';

interface DateDayProps {
  size: DesktopWidgetSize;
  customTitle?: string;
}

export const DateDayWidget: React.FC<DateDayProps> = ({
  size = 'small',
  customTitle = 'PADHAIII',
}) => {
  const [dateInfo, setDateInfo] = useState({
    dayName: '',
    dayNumber: '',
    monthName: '',
    year: '',
  });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      setDateInfo({
        dayName: dayNames[now.getDay()],
        dayNumber: String(now.getDate()),
        monthName: monthNames[now.getMonth()],
        year: String(now.getFullYear()),
      });
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  if (size === 'medium') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.6px' }}>
            {dateInfo.dayName}
          </span>
          <span style={{ fontSize: '11px', color: '#ff3b30', fontWeight: 600 }}>
            {dateInfo.monthName} {dateInfo.year}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
          <span style={{ fontSize: '56px', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1 }}>
            {dateInfo.dayNumber}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>{customTitle}</span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>No upcoming events</span>
          </div>
        </div>
      </div>
    );
  }

  if (size === 'large') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.8px' }}>
            {dateInfo.dayName}
          </span>
          <span style={{ fontSize: '13px', color: '#ff3b30', fontWeight: 600 }}>
            {dateInfo.monthName} {dateInfo.year}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <span style={{ fontSize: '88px', fontWeight: 700, letterSpacing: '-3px', lineHeight: 1 }}>
            {dateInfo.dayNumber}
          </span>
          <span style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginTop: '8px' }}>
            {customTitle}
          </span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '10px 14px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Today's Focus: {customTitle}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: 600, letterSpacing: '0.5px' }}>
          {dateInfo.dayName}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', margin: 'auto 0' }}>
        <span style={{ fontSize: '52px', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1 }}>
          {dateInfo.dayNumber}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
          {customTitle}
        </span>
      </div>
    </div>
  );
};
