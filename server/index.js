import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { store } from './store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

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

io.on('connection', (socket) => {
  const userColor = randomColor();
  const userName = randomName();

  console.log(`  ✓ ${userName} connected  (${socket.id.slice(0, 8)})`);

  socket.emit('state:sync', {
    notes: store.getAllNotes(),
    cursors: store.getAllCursors(),
    user: { id: socket.id, color: userColor, name: userName },
  });

  socket.broadcast.emit('user:joined', {
    id: socket.id,
    color: userColor,
    name: userName,
  });

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
    
    socket.broadcast.emit('note:updated', result.note);
    
    if (ack) ack({ ok: true, note: result.note, conflict: result.conflict });
  });

  socket.on('note:delete', (noteId, ack) => {
    store.deleteNote(noteId);
    socket.broadcast.emit('note:deleted', noteId);
    if (ack) ack({ ok: true });
  });

  socket.on('cursor:move', (position) => {
    store.setCursor(socket.id, { ...position, color: userColor, name: userName });
    socket.volatile.broadcast.emit('cursor:moved', {
      id: socket.id,
      ...position,
      color: userColor,
      name: userName,
    });
  });

  socket.on('disconnect', () => {
    console.log(`  ✗ ${userName} disconnected (${socket.id.slice(0, 8)})`);
    store.removeCursor(socket.id);
    socket.broadcast.emit('cursor:removed', socket.id);
    socket.broadcast.emit('user:left', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n  🚀 CollabBoard server on http://localhost:${PORT}\n`);
});
