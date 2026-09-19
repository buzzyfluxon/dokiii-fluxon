import React, { useState, useEffect } from 'react';
import { IconTrash } from '../components/Icons';

export const RecycleBinWidget: React.FC = () => {
  const [count, setCount] = useState<number>(0);

  const fetchCount = async () => {
    try {
      if (window.electronAPI?.getRecycleBinCount) {
        const result = await window.electronAPI.getRecycleBinCount();
        setCount(result);
      }
    } catch {}
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    try {
      window.electronAPI?.openRecycleBin();
      setTimeout(fetchCount, 1500);
    } catch {}
  };

  return (
    <div className="recycle-bin-widget" onClick={handleClick} title="Recycle Bin">
      <div className="recycle-bin-icon">
        <IconTrash size={18} />
        {count > 0 && <span className="recycle-bin-badge">{count}</span>}
      </div>
    </div>
  );
};

export default RecycleBinWidget;
