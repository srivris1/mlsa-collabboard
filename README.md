# CollabBoard

CollabBoard is a shared sticky-note board I built for the MLSA task (4.1 — Live-Sync Mini App). The idea is simple: open two browser tabs side by side and everything stays in sync — creating notes, dragging them around, editing text, even your mouse cursor shows up on the other tab. It uses React on the frontend and a small Express + Socket.IO server on the backend.

The real-time part works through Socket.IO. When you create or move a note, it gets applied to your screen immediately (optimistic update) and then sent to the server, which broadcasts it to everyone else. Cursor positions are sent as volatile events so if the network drops a frame it doesn't matter, the next cursor update fixes it. The server keeps all the notes in memory, so when you close a tab and reopen it you get the full board state back — nothing resets.

For the simultaneous editing problem (two tabs editing the same note at once), I used field-level last-write-wins. Each field on a note — text, x position, y position, color — has its own timestamp. So if one tab drags a note while another tab edits its text at the same time, both changes go through fine because they're touching different fields. If two tabs change the exact same field, the one with the later timestamp wins and the other tab gets a brief red flash to show a conflict was resolved. The logic for this is in `server/store.js`.

## Running it locally

Node 18+ required. Nothing else.

```
npm install
npm run dev
```

That starts the backend on port 3001 and Vite dev server on port 5173. Open http://localhost:5173 in two tabs side by side. Double-click the board to create notes, drag them around, type in them — you'll see everything sync across both tabs.

For production mode:
```
npm run build
npm start
```

## File structure

- `server/index.js` — Express server, Socket.IO event handling, user assignment
- `server/store.js` — in-memory note store with the field-level conflict resolution logic
- `src/App.jsx` — main React component, socket connection, optimistic state management
- `src/components/Board.jsx` — the board canvas, renders notes and remote cursors
- `src/components/StickyNote.jsx` — individual note with drag, edit, color change, delete
- `src/components/Cursor.jsx` — renders other users' cursors with colored arrows and name tags
- `src/components/Toolbar.jsx` — top bar showing connection status, online count, color picker

## Simultaneous edit handling

Field-level last-write-wins — each note field (text, x, y, color) carries its own timestamp. Same-field conflicts pick the newer write; different-field edits merge without data loss.

## What I'd improve

Everything is in memory right now so a server restart wipes the board. I'd add SQLite or something similar if this were a real app. I'd also want to debounce the text updates — right now every keystroke fires a socket event which works fine for a demo but would be wasteful at scale. Undo/redo would be nice too but I ran out of time.
