import React, { useState, useEffect } from 'react';
import { useWidgetStore } from '../store/widgetStore';
import { usePopover } from '../App';
import { IconPencil, IconClose } from '../components/Icons';

export const NotesWidget: React.FC = () => {
  const notes = useWidgetStore((state) => state.notes || []);
  const addNote = useWidgetStore((state) => state.addNote);
  const updateNote = useWidgetStore((state) => state.updateNote);
  const { activePopover, openPopover, closePopover } = usePopover();

  const isEditing = activePopover === 'notes';
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const firstNote = notes.length > 0 ? notes[0] : null;

  useEffect(() => {
    if (firstNote) {
      setEditTitle(firstNote.title || '');
      setEditContent(firstNote.content || '');
    } else {
      setEditTitle('');
      setEditContent('');
    }
  }, [firstNote]);

  const handleOpenEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditing) {
      closePopover();
    } else {
      openPopover('notes');
    }
  };

  const handleSave = () => {
    if (firstNote) {
      updateNote(firstNote.id, { title: editTitle, content: editContent, updatedAt: new Date().toISOString() });
    } else if (editTitle.trim() || editContent.trim()) {
      addNote({
        id: Date.now().toString(),
        title: editTitle.trim() || 'Untitled Note',
        content: editContent,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleSave();
    closePopover();
  };

  return (
    <div className="notes-widget" onClick={handleOpenEditor} title="Quick Note">
      <div className="notes-header-row">
        <div className="notes-title">{firstNote?.title || 'Notes'}</div>
        <button className="notes-edit-btn" onClick={handleOpenEditor} title="Edit Note">
          <IconPencil size={11} />
        </button>
      </div>
      <div className="notes-preview">{firstNote?.content || 'Click to write...'}</div>

      {isEditing && (
        <div className="popover" onClick={(e) => e.stopPropagation()} style={{ width: '280px' }}>
          <div className="popover-header">
            <span className="popover-title">Quick Note</span>
            <button className="popover-close" onClick={handleClose} title="Close">
              <IconClose size={10} />
            </button>
          </div>
          <div className="notes-editor">
            <input
              className="notes-editor-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSave}
              placeholder="Title..."
              autoFocus
            />
            <textarea
              className="notes-editor-content"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleSave}
              placeholder="Start typing..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesWidget;
