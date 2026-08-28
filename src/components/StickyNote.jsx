import { useState, useRef, useCallback, useEffect } from 'react';

const COLORS = [
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Pink', value: '#fda4af' },
  { name: 'Blue', value: '#93c5fd' },
  { name: 'Green', value: '#86efac' },
  { name: 'Purple', value: '#c4b5fd' },
  { name: 'Orange', value: '#fed7aa' },
];

function StickyNote({ note, isConflicting, onUpdate, onDelete }) {
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const noteRef = useRef(null);
  const textareaRef = useRef(null);

  const handleDragStart = useCallback((e) => {
    
    if (
      e.target.tagName === 'TEXTAREA' ||
      e.target.closest('.note-color-dot') ||
      e.target.closest('.note-delete')
    )
      return;
    e.preventDefault();
    const rect = noteRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      const x = e.clientX - dragOffset.current.x;
      const y = e.clientY - dragOffset.current.y;
      onUpdate(note.id, { x, y });
    };

    const handleUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, note.id, onUpdate]);

  const handleTextChange = useCallback(
    (e) => onUpdate(note.id, { text: e.target.value }),
    [note.id, onUpdate],
  );

  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    textareaRef.current?.focus();
  }, []);

  const handleColorChange = useCallback(
    (color) => onUpdate(note.id, { color }),
    [note.id, onUpdate],
  );

  return (
    <div
      ref={noteRef}
      className={`sticky-note${isDragging ? ' dragging' : ''}${isConflicting ? ' conflicting' : ''}`}
      style={{
        left: `${note.x}px`,
        top: `${note.y}px`,
        '--note-color': note.color,
      }}
      onMouseDown={handleDragStart}
      onDoubleClick={handleDoubleClick}
    >
      <div className="note-header">
        <div className="note-colors">
          {COLORS.map((c) => (
            <button
              key={c.value}
              className={`note-color-dot${note.color === c.value ? ' active' : ''}`}
              style={{ backgroundColor: c.value }}
              onClick={() => handleColorChange(c.value)}
              title={c.name}
              aria-label={`Change color to ${c.name}`}
            />
          ))}
        </div>
        <button
          className="note-delete"
          onClick={() => onDelete(note.id)}
          title="Delete note"
          aria-label="Delete note"
        >
          ×
        </button>
      </div>
      <textarea
        ref={textareaRef}
        className="note-text"
        value={note.text || ''}
        onChange={handleTextChange}
        placeholder="Type something…"
        spellCheck={false}
      />
    </div>
  );
}

export default StickyNote;
