import React from 'react';
import { useConfigStore } from '../store/configStore';
import './notice.css';

export const Notice: React.FC = () => {
  const notice = useConfigStore((s) => s.notice);
  if (!notice) return null;
  return (
    <div className="app-notice-root">
      <div className="app-notice">{notice}</div>
    </div>
  );
};

export default Notice;
