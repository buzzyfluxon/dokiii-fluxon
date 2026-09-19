import React, { useState, useEffect, useRef } from 'react';
import { usePopover } from '../App';
import { IconApps, IconFile, IconSearch } from '../components/Icons';
import type { FileSearchResult } from '../types/widget';

export default function FileSearchWidget() {
  const { activePopover, openPopover, closePopover } = usePopover();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FileSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOpen = activePopover === 'file-search' && query.trim().length > 0;

  useEffect(() => {
    const handler = setTimeout(() => {
      if (query.trim()) {
        window.electronAPI.searchFiles(query.trim()).then((res) => {
          setResults(res);
          setSelectedIndex(0);
          openPopover('file-search');
        }).catch(() => {});
      } else {
        setResults([]);
        if (activePopover === 'file-search') {
          closePopover();
        }
      }
    }, 200);

    return () => clearTimeout(handler);
  }, [query, openPopover, closePopover, activePopover]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      closePopover();
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        window.electronAPI.openPath(results[selectedIndex].path);
        closePopover();
        setQuery('');
      }
    }
  };

  return (
    <div className="search-widget" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        placeholder="Search or open..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (query.trim()) openPopover('file-search');
        }}
      />
      {isOpen && (
        <div className="search-results">
          {results.length === 0 ? (
            <div className="search-result-item" style={{ color: 'var(--text-tertiary)', fontSize: '9px', justifyContent: 'center' }}>
              <IconSearch size={14} style={{ marginRight: '6px' }} />
              <span>No results found</span>
            </div>
          ) : (
            results.map((res, idx) => (
              <div
                key={res.path}
                className={`search-result-item${idx === selectedIndex ? ' selected' : ''}`}
                onClick={() => {
                  window.electronAPI.openPath(res.path);
                  closePopover();
                  setQuery('');
                }}
              >
                <span className="search-result-icon">
                  {res.type === 'app' ? <IconApps size={14} /> : <IconFile size={14} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="search-result-name">{res.name}</div>
                  <div className="search-result-path">{res.path}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
