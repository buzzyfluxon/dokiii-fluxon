import React, { useState } from 'react';
import { IconMaximize, IconCrop, IconWindow } from '../components/Icons';

export default function ScreenshotCaptureWidget() {
  const [feedback, setFeedback] = useState<string | null>(null);

  const capture = (mode: 'full' | 'region' | 'window') => {
    window.electronAPI?.captureScreenshot(mode)
      .then(() => setFeedback(mode))
      .catch(() => {})
      .finally(() => setTimeout(() => setFeedback(null), 500));
  };

  return (
    <div className={`screenshot-capture-widget ${feedback ? 'flash' : ''}`}>
      <button className="capture-btn" onClick={() => capture('full')} title="Full Screen Capture">
        <IconMaximize size={12} />
      </button>
      <button className="capture-btn" onClick={() => capture('region')} title="Region Snip">
        <IconCrop size={12} />
      </button>
      <button className="capture-btn" onClick={() => capture('window')} title="Window Capture">
        <IconWindow size={12} />
      </button>
    </div>
  );
}
