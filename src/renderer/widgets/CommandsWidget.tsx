import React, { useState } from 'react';

export default function CommandsWidget() {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && text.trim()) {
      window.electronAPI.runCommand(text.trim())
        .then(() => {
          setFeedback('success');
          setText('');
        })
        .catch(() => {
          setFeedback('error');
        })
        .finally(() => {
          setTimeout(() => setFeedback(null), 1000);
        });
    }
  };

  return (
    <div className="commands-widget" onClick={(e) => e.stopPropagation()}>
      <input
        type="text"
        className={`commands-input${feedback ? ` ${feedback}` : ''}`}
        placeholder="No commands yet"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
