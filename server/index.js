import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { store } from './store.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// ---- Helpers ----

function randomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 60%)`;
}

function randomName() {
  const adjectives = ['Swift', 'Calm', 'Bold', 'Keen', 'Warm', 'Cool', 'Bright', 'Wild', 'Quiet', 'Brave'];
  const nouns = ['Fox', 'Owl', 'Cat', 'Bear', 'Wolf', 'Deer', 'Hawk', 'Lynx', 'Seal', 'Crow'];
  const a = adjectives[Math.floor(Math.random() * adjectives.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  return `${a} ${n}`;
}

// ---- Socket.IO ----

io.on('connection', (socket) => {
  const userColor = randomColor();
  const userName = randomName();

  console.log(`  ✓ ${userName} connected  (${socket.id.slice(0, 8)})`);

  // Send full state on connect — this is how state survives a tab refresh
  socket.emit('state:sync', {
    notes: store.getAllNotes(),
    cursors: store.getAllCursors(),
    user: { id: socket.id, color: userColor, name: userName },
  });

  // Notify others about the new user
  socket.broadcast.emit('user:joined', {
    id: socket.id,
    color: userColor,
    name: userName,
  });

  // ---- Note events ----

  socket.on('note:create', (note, ack) => {
    const created = store.createNote({ ...note, createdBy: socket.id });
    socket.broadcast.emit('note:created', created);
    if (ack) ack({ ok: true, note: created });
  });

  socket.on('note:update', (update, ack) => {
    const result = store.updateNote(update.id, update.fields, update.timestamp);
    if (!result.note) {
      if (ack) ack({ ok: false, error: 'Note not found' });
      return;
    }
    // Broadcast the resolved state to everyone else
    socket.broadcast.emit('note:updated', result.note);
    // Tell the sender whether a conflict was resolved
    if (ack) ack({ ok: true, note: result.note, conflict: result.conflict });
  });

  socket.on('note:delete', (noteId, ack) => {
    store.deleteNote(noteId);
    socket.broadcast.emit('note:deleted', noteId);
    if (ack) ack({ ok: true });
  });

  // ---- Cursor events (volatile — dropping a frame is fine) ----

  socket.on('cursor:move', (position) => {
    store.setCursor(socket.id, { ...position, color: userColor, name: userName });
    socket.volatile.broadcast.emit('cursor:moved', {
      id: socket.id,
      ...position,
      color: userColor,
      name: userName,
    });
  });

  // ---- Disconnect ----

  socket.on('disconnect', () => {
    console.log(`  ✗ ${userName} disconnected (${socket.id.slice(0, 8)})`);
    store.removeCursor(socket.id);
    socket.broadcast.emit('cursor:removed', socket.id);
    socket.broadcast.emit('user:left', socket.id);
  });
});

// ---- Start ----

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n  🚀 CollabBoard server on http://localhost:${PORT}\n`);
});
