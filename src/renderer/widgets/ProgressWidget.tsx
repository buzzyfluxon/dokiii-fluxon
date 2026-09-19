import React, { useState, useEffect } from 'react';

interface ProgressWidgetProps {
  type: 'day' | 'month' | 'year';
}

export const ProgressWidget: React.FC<ProgressWidgetProps> = ({ type }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  let progress = 0;
  let label = '';
  const totalDots = 35;

  if (type === 'day') {
    const hours = now.getHours() + now.getMinutes() / 60;
    progress = hours / 24;
    label = `${now.toLocaleString('default', { month: 'short' })} ${now.getDate()}`;
  } else if (type === 'month') {
    const day = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    progress = day / daysInMonth;
    label = `${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
  } else if (type === 'year') {
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const isLeap = now.getFullYear() % 4 === 0 && (now.getFullYear() % 100 !== 0 || now.getFullYear() % 400 === 0);
    const daysInYear = isLeap ? 366 : 365;
    progress = dayOfYear / daysInYear;
    label = `${now.getFullYear()}`;
  }

  const percentage = Math.round(progress * 100);
  const filledDots = Math.round(progress * totalDots);
  const dots = Array.from({ length: totalDots }, (_, i) => i < filledDots);

  return (
    <div className="progress-widget">
      <div className="progress-label">
        <span>{label}</span>
        <span className="progress-value">{percentage}%</span>
      </div>
      <div className="progress-dots">
        {dots.map((filled, idx) => (
          <div key={idx} className={`progress-dot ${filled ? 'filled' : ''}`} />
        ))}
      </div>
    </div>
  );
};

export default ProgressWidget;
