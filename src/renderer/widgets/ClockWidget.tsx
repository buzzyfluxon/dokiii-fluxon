import React from 'react';
import { useMinuteTick } from '../store/timeStore';

export const ClockWidget: React.FC = () => {
  const { timeString, dateString } = useMinuteTick();

  return (
    <div className="clock-widget">
      <div className="clock-time">{timeString}</div>
      <div className="clock-date">{dateString}</div>
    </div>
  );
};

export default ClockWidget;
