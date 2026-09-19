import React, { useState, useEffect } from 'react';
import type { StorageInfo } from '../types/widget';

const StorageWidget: React.FC = () => {
  const [storage, setStorage] = useState<StorageInfo | null>(null);

  const fetchStorage = async () => {
    try {
      const info = await window.electronAPI.getStorageInfo();
      const cDrive = info.find((d) => d.drive === 'C') || info[0];
      if (cDrive) setStorage(cDrive);
    } catch {}
  };

  useEffect(() => {
    fetchStorage();
    const interval = setInterval(fetchStorage, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    try {
      window.electronAPI.runCommand('open settings');
    } catch {}
  };

  if (!storage) {
    return (
      <div className="storage-widget" onClick={handleClick} title="Storage (C:)">
        <div className="storage-ring">
          <svg viewBox="0 0 44 44">
            <circle className="ring-bg" cx="22" cy="22" r="18" />
          </svg>
          <div className="storage-text">--</div>
        </div>
      </div>
    );
  }

  const usedPercent = storage.total > 0 ? (storage.used / storage.total) * 100 : 0;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (usedPercent / 100) * circumference;
  const freeGb = Math.round(storage.free / (1024 * 1024 * 1024));

  return (
    <div className="storage-widget" onClick={handleClick} title={`Storage C: ${freeGb} GB Free`}>
      <div className="storage-ring">
        <svg viewBox="0 0 44 44">
          <circle className="ring-bg" cx="22" cy="22" r={radius} />
          <circle
            className="ring-fill"
            cx="22"
            cy="22"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 22 22)"
          />
        </svg>
        <div className="storage-text">{freeGb}G</div>
      </div>
    </div>
  );
};

export default StorageWidget;
