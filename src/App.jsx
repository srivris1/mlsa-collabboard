import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import Board from './components/Board.jsx';
import Toolbar from './components/Toolbar.jsx';

function App() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState({});
  const [cursors, setCursors] = useState({});
  const [selectedColor, setSelectedColor] = useState('#fef08a');
  const [conflictNoteId, setConflictNoteId] = useState(null);
  const conflictTimer = useRef(null);

  // ---- Socket connection ----
  useEffect(() => {
    const isLocalDev = window.location.hostname === 'localhost' && window.location.port === '5173';
    const serverUrl = isLocalDev ? 'http://localhost:3001' : window.location.origin;

    const s = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    // Full state sync on (re)connect — state survives refresh
    s.on('state:sync', (data) => {
      const notesMap = {};
      data.notes.forEach((n) => { notesMap[n.id] = n; });
      setNotes(notesMap);
      setCursors(data.cursors || {});
      setUser(data.user);
    });

    // Note events from other tabs
    s.on('note:created', (note) => {
      setNotes((prev) => ({ ...prev, [note.id]: note }));
    });

    s.on('note:updated', (note) => {
      setNotes((prev) => ({ ...prev, [note.id]: note }));
    });

    s.on('note:deleted', (noteId) => {
      setNotes((prev) => {
        const next = { ...prev };
        delete next[noteId];
        return next;
      });
    });

    // Cursor events from other tabs
    s.on('cursor:moved', (data) => {
      setCursors((prev) => ({ ...prev, [data.id]: data }));
    });

    s.on('cursor:removed', (id) => {
      setCursors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });

    setSocket(s);
    return () => s.disconnect();
  }, []);

  // ---- Note actions (all optimistic) ----

  const createNote = useCallback((x, y) => {
    if (!socket) return;
    const id = crypto.randomUUID();
    const note = { id, text: '', x, y, color: selectedColor };

    // Optimistic: show immediately
    setNotes((prev) => ({
      ...prev,
      [id]: { ...note, createdAt: Date.now(), fieldTimestamps: {} },
    }));

    socket.emit('note:create', note, (res) => {
      if (res?.ok) {
        setNotes((prev) => ({ ...prev, [id]: res.note }));
      }
    });
  }, [socket, selectedColor]);

  const updateNote = useCallback((id, fields) => {
    if (!socket) return;
    const timestamp = Date.now();

    // Optimistic: apply locally first
    setNotes((prev) => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], ...fields } };
    });

    socket.emit('note:update', { id, fields, timestamp }, (res) => {
      if (res?.ok) {
        // Replace with server's resolved state
        setNotes((prev) => ({ ...prev, [id]: res.note }));
        if (res.conflict) {
          // Flash conflict indicator
          setConflictNoteId(id);
          if (conflictTimer.current) clearTimeout(conflictTimer.current);
          conflictTimer.current = setTimeout(() => setConflictNoteId(null), 800);
        }
      }
    });
  }, [socket]);

  const deleteNote = useCallback((id) => {
    if (!socket) return;
    // Optimistic: remove immediately
    setNotes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    socket.emit('note:delete', id);
  }, [socket]);

  // ---- Cursor broadcast ----

  const handleMouseMove = useCallback((e) => {
    if (!socket) return;
    socket.volatile.emit('cursor:move', { x: e.clientX, y: e.clientY });
  }, [socket]);

  const onlineUsers = Object.keys(cursors).length + (connected ? 1 : 0);

  return (
    <div className="app" onMouseMove={handleMouseMove}>
      <Toolbar
        connected={connected}
        onlineUsers={onlineUsers}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        userName={user?.name}
        userColor={user?.color}
      />
      <Board
        notes={notes}
        cursors={cursors}
        userId={user?.id}
        conflictNoteId={conflictNoteId}
        onCreateNote={createNote}
        onUpdateNote={updateNote}
        onDeleteNote={deleteNote}
      />
    </div>
  );
}

export default App;
