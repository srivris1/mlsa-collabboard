# CollabBoard — Real-Time Collaborative Sticky Notes

A real-time collaborative sticky-note board where **multiple browser tabs** see each other's actions instantly — live cursors, drag-and-drop notes, color tagging, and conflict-safe simultaneous edits.

Built for **MLSA SRM Technical Task 4.1: Live-Sync Mini App** (2nd-year submission with all extensions).

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io) ![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)

---

## ✨ Features

### Base Task
- **Real-time sync** — Create, edit, drag, and delete sticky notes across multiple tabs
- **Live cursors** — See other users' cursor positions with colored SVG arrows and name tags
- **React + Socket.IO** — Modern component architecture with WebSocket-based real-time communication

### 2nd-Year Extensions
- **Optimistic UI updates** — Changes apply locally *immediately* before server confirmation, so the UI feels instant (no waiting for round-trips)
- **Field-level conflict resolution** — Two tabs editing the *same note* simultaneously are handled with **Last-Write-Wins per field** (text, position, color each tracked independently). If one tab drags a note while another edits its text, both updates merge cleanly. A red glow flash indicates when a conflict is resolved.
- **State survives refresh** — The server is the source of truth. Closing a tab and reopening it restores the exact board state (notes + positions + text) from the server.

### How simultaneous edits are resolved
Each note field (`text`, `x`, `y`, `color`) carries its own timestamp. When two tabs update the same field at the same time, the later timestamp wins (Last-Write-Wins). When they update *different* fields, both edits merge cleanly — no data is lost. The losing tab sees a brief red conflict flash animation to indicate the resolution happened.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (check with `node -v`)

### Run it
```bash
# Install dependencies
npm install

# Start both the server and Vite dev server
npm run dev
```

This starts:
- **Express + Socket.IO server** on `http://localhost:3001`
- **Vite dev server** on `http://localhost:5173` (with proxy to the backend)

### Demo it
1. Open `http://localhost:5173` in **two browser tabs** side by side
2. **Double-click** anywhere on the board to create a sticky note
3. Drag notes around — watch them move in the other tab instantly
4. Edit note text — see it sync in real time
5. Move your mouse — see the live cursor in the other tab
6. Close one tab, reopen it — the board state is restored

---

## 🏗 Architecture

```
┌─────────────┐     Socket.IO      ┌──────────────────┐
│  React App  │◄──────────────────►│  Express Server   │
│  (Tab 1)    │   note:create      │                  │
│             │   note:update      │  In-memory store  │
│  Live       │   note:delete      │  (notes + cursors)│
│  Cursors    │   cursor:move      │                  │
│  Sticky     │   state:sync       │  Conflict         │
│  Notes      │                    │  Resolution       │
└─────────────┘                    └──────────────────┘
       ▲                                    ▲
       │            Socket.IO               │
┌─────────────┐◄──────────────────►         │
│  React App  │                             │
│  (Tab 2)    │                             │
└─────────────┘
```

### Key files
| File | Purpose |
|------|---------|
| `server/index.js` | Express + Socket.IO server, event handling |
| `server/store.js` | In-memory state with field-level conflict resolution |
| `src/App.jsx` | Root component, socket connection, optimistic state |
| `src/components/Board.jsx` | Canvas with notes + remote cursors |
| `src/components/StickyNote.jsx` | Draggable, editable note with colors |
| `src/components/Cursor.jsx` | Remote user cursor with name tag |
| `src/components/Toolbar.jsx` | Color picker, connection status, user info |

---

## 💡 Design Decisions

1. **Socket.IO over raw WebSockets** — Automatic reconnection, acknowledgement callbacks, and `volatile` events for cursor positions (dropping a frame is fine, the next one corrects it).

2. **Server-side source of truth** — All notes live in server memory. On reconnect, the client receives a full `state:sync` event. This cleanly solves the "state survives refresh" requirement without needing localStorage.

3. **Field-level timestamps** — Rather than a single `updatedAt` on the whole note, each field (text, x, y, color) carries its own timestamp. This means dragging a note and editing its text simultaneously from two tabs both succeed without data loss.

4. **Volatile cursor events** — Cursor positions are sent with `socket.volatile.emit`, meaning the transport layer can drop frames if it's congested. The next position update self-corrects. This keeps bandwidth low.

---

## 📹 Video Walkthrough Points

For the 2–3 minute video, demonstrate:
1. Open two tabs side-by-side → show live cursors
2. Create a note in Tab 1 → appears in Tab 2 instantly
3. Drag a note → moves in both tabs
4. Edit text in one tab → shows in the other
5. Close Tab 2, reopen → state is restored
6. (Walk through the conflict resolution code in `server/store.js`)
