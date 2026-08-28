# CollabBoard

This is a real time collaborative sticky note board I built for the MLSA technical task 4.1 (Live Sync Mini App). The basic idea is that you open the app in two browser tabs, and anything you do in one tab shows up in the other tab instantly. Create a note, drag it somewhere, type in it, change its color, delete it. The other tab mirrors it all in real time. You can even see the other tab mouse cursor moving around with a little colored arrow and a name tag.

I went with React for the frontend and Socket.IO on an Express backend for the real time communication. Socket.IO is basically WebSockets but with some nice extras like automatic reconnection and acknowledgement callbacks, which made the conflict resolution part a lot easier to implement. The whole thing runs on Node 18.

## How it actually works

When you open a tab, the client connects to the Socket.IO server and gets back the full board state (all existing notes and who else is connected). From that point on, every action you take gets applied to your local screen right away. That is the optimistic UI part, so it feels snappy and there is no lag while waiting for the server. Then it gets sent to the server. The server stores the update and broadcasts it to every other connected tab.

Cursor positions work a little differently. They are sent as volatile events, which means Socket.IO is allowed to drop them if the connection is busy. That is fine because cursor positions update so frequently that a dropped frame just gets corrected by the next one a few milliseconds later. This keeps things lightweight.

The state survives refresh part was actually pretty simple to solve. Since the server holds all the notes in memory and sends the full state whenever a client connects, closing a tab and reopening it just triggers a fresh connection and you get everything back. No localStorage tricks needed.

## The simultaneous editing problem

This was the trickiest part. If two people drag the same note at the exact same time, or one person is editing the text while another is dragging it, you need to make sure one person changes do not just silently overwrite the other person changes.

I solved it with field level last write wins. Instead of having one single last updated timestamp on the whole note, each individual field tracks its own timestamp. Text, x position, y position, and color all have their own timestamp. So when two tabs are doing different things to the same note (like one is dragging it while the other is typing in it), those updates touch different fields and both go through cleanly without any data loss. When two tabs happen to change the exact same field at the same moment, the server compares timestamps and keeps the newer one. The tab whose edit got rejected sees a quick red glow on the note so you know a conflict was resolved. All this logic lives in server/store.js if you want to look at it.

## How to run it

You just need Node 18 or newer installed. That is all. No Redis, no database, no Docker.

```
npm install
npm run dev
```

This starts two things. The Express and Socket.IO server runs on port 3001, and the Vite dev server runs on port 5173 which proxies API requests to the backend. Open http://localhost:5173 in two browser tabs side by side and start playing around. Double click anywhere on the board to create a sticky note.

If you want to run the production build instead:
```
npm run build
npm start
```
Then open http://localhost:3001 directly.

## What is in the repo

The server/index.js file is the Express server that handles Socket.IO connections, assigns each user a random color and animal name, and relays all events between tabs.
The server/store.js file is the in memory store for notes with the field level timestamp conflict resolution logic.
The src/App.jsx file is the main React component that manages socket connection, note state, and optimistic updates.
The src/components/Board.jsx file is the board itself, which renders all the notes and remote cursors.
The src/components/StickyNote.jsx file is the individual sticky note with drag and drop, inline text editing, color picker, and delete.
The src/components/Cursor.jsx file shows other users cursors as colored SVG arrows with name labels.
The src/components/Toolbar.jsx file is the top bar with connection indicator, online user count, and color selector for new notes.

## Things I would do differently with more time

Right now everything is stored in memory on the server, so if the server restarts the whole board is gone. In a real app I would persist notes to a database, maybe even something simple like SQLite. I would also want to debounce the text editing events because currently every single keystroke fires off a socket message, which works fine for a demo with two tabs but would not scale well. Adding undo redo support would have been cool too, and maybe letting users set their own display name instead of getting a random one assigned.
