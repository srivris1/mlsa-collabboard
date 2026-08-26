import { useCallback, useRef } from 'react';
import StickyNote from './StickyNote.jsx';
import Cursor from './Cursor.jsx';

function Board({ notes, cursors, userId, conflictNoteId, onCreateNote, onUpdateNote, onDeleteNote }) {
  const boardRef = useRef(null);

  const handleDoubleClick = useCallback(
    (e) => {
      // Only create a note when clicking the board background
      if (e.target === boardRef.current || e.target.classList.contains('board-grid')) {
        onCreateNote(e.clientX - 110, e.clientY - 80);
      }
    },
    [onCreateNote],
  );

  return (
    <div className="board" ref={boardRef} onDoubleClick={handleDoubleClick}>
      <div className="board-grid" />

      {Object.keys(notes).length === 0 && (
        <div className="board-hint">Double-click anywhere to create a note</div>
      )}

      {Object.values(notes).map((note) => (
        <StickyNote
          key={note.id}
          note={note}
          isConflicting={conflictNoteId === note.id}
          onUpdate={onUpdateNote}
          onDelete={onDeleteNote}
        />
      ))}

      {Object.entries(cursors)
        .filter(([id]) => id !== userId)
        .map(([id, cursor]) => (
          <Cursor key={id} cursor={cursor} />
        ))}
    </div>
  );
}

export default Board;
