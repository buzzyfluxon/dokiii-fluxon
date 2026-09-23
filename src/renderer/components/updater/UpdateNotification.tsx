import React, { useState } from 'react';
import { useUpdaterStore } from '../../store/updaterStore';
import { IconClose } from '../Icons';
import dokiiiLogo from '../../assets/dokiii-logo.jpg';
import './update-notification.css';

export const UpdateNotification: React.FC = () => {
  const updater = useUpdaterStore((s) => s.updater);
  const startDownload = useUpdaterStore((s) => s.startDownload);
  const installUpdate = useUpdaterStore((s) => s.installUpdate);
  const dismissUpdate = useUpdaterStore((s) => s.dismissUpdate);

  const [hiddenKey, setHiddenKey] = useState<string | null>(null);

  const isRelevant =
    updater.status === 'available' ||
    updater.status === 'downloading' ||
    updater.status === 'downloaded' ||
    (updater.status === 'error' && updater.phase === 'download');

  const isVisible = isRelevant && hiddenKey !== updater.status;

  const handlePointerEnter = () => {
    window.electronAPI?.setIgnoreMouseEvents(false);
  };

  const handlePointerLeave = () => {
    window.electronAPI?.setIgnoreMouseEvents(true, true);
  };

  const handleClose = () => {
    setHiddenKey(updater.status);
  };

  if (!isVisible) return null;

  let title = '';
  let subtitle = '';
  let showClose = false;
  let actions: React.ReactNode = null;
  let progressPercent: number | null = null;

  if (updater.status === 'available') {
    title = `DOKIII ${updater.version} is available`;
    subtitle = 'A new version is ready to download';
    actions = (
      <>
        <button className="update-toast-btn secondary" onClick={dismissUpdate}>
          Later
        </button>
        <button className="update-toast-btn primary" onClick={startDownload}>
          Update Now
        </button>
      </>
    );
  } else if (updater.status === 'downloading') {
    title = `Downloading DOKIII ${updater.version}`;
    subtitle = `${updater.percent}%`;
    showClose = true;
    progressPercent = updater.percent;
  } else if (updater.status === 'downloaded') {
    title = `DOKIII ${updater.version} is ready to install`;
    subtitle = 'Restart DOKIII to finish updating';
    showClose = true;
    actions = (
      <button className="update-toast-btn primary" onClick={installUpdate}>
        Restart & Install
      </button>
    );
  } else if (updater.status === 'error') {
    title = "Couldn't download the update";
    subtitle = updater.message;
    showClose = true;
    actions = (
      <button className="update-toast-btn primary" onClick={startDownload}>
        Retry
      </button>
    );
  }

  return (
    <div className="update-toast-root" onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave}>
      <div className="update-toast">
        {showClose && (
          <button className="update-toast-close" onClick={handleClose} title="Close">
            <IconClose size={11} />
          </button>
        )}
        <div className="update-toast-header">
          <div className="update-toast-logo">
            <img src={dokiiiLogo} alt="DOKIII" draggable={false} />
          </div>
          <div className="update-toast-text">
            <span className="update-toast-title">{title}</span>
            <span className="update-toast-subtitle">{subtitle}</span>
          </div>
        </div>
        {progressPercent !== null && (
          <div className="update-toast-progress">
            <div className="update-toast-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        )}
        {actions && <div className="update-toast-actions">{actions}</div>}
      </div>
    </div>
  );
};

export default UpdateNotification;
