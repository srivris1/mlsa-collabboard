import { randomUUID } from 'crypto';

class Store {
  constructor() {
    this.notes = new Map();
    this.cursors = new Map();
  }

  createNote(data) {
    const now = Date.now();
    const note = {
      id: data.id || randomUUID(),
      text: data.text || '',
      x: data.x ?? 100,
      y: data.y ?? 100,
      color: data.color || '#fef08a',
      createdBy: data.createdBy,
      createdAt: now,
      // Field-level timestamps for conflict resolution (LWW per field)
      fieldTimestamps: {
        text: now,
        x: now,
        y: now,
        color: now,
      },
    };
    this.notes.set(note.id, note);
    return { ...note };
  }

  /**
   * Update a note with field-level Last-Write-Wins conflict resolution.
   *
   * Each field (text, x, y, color) carries its own timestamp. When two tabs
   * edit different fields of the same note simultaneously, both edits merge
   * cleanly. When they edit the *same* field, the later timestamp wins and
   * we report a conflict so the UI can flash a visual indicator.
   */
  updateNote(id, fields, timestamp) {
    const note = this.notes.get(id);
    if (!note) return { note: null, conflict: false };

    let hasConflict = false;
    const ts = timestamp || Date.now();

    for (const [key, value] of Object.entries(fields)) {
      if (key in note.fieldTimestamps) {
        if (ts >= note.fieldTimestamps[key]) {
          // This write is newer — accept it
          note[key] = value;
          note.fieldTimestamps[key] = ts;
        } else {
          // This write is stale — reject it, keep current value
          hasConflict = true;
        }
      }
    }

    this.notes.set(id, note);
    return { note: { ...note }, conflict: hasConflict };
  }

  deleteNote(id) {
    this.notes.delete(id);
  }

  getAllNotes() {
    return Array.from(this.notes.values()).map((n) => ({ ...n }));
  }

  setCursor(socketId, data) {
    this.cursors.set(socketId, data);
  }

  removeCursor(socketId) {
    this.cursors.delete(socketId);
  }

  getAllCursors() {
    const cursors = {};
    for (const [id, data] of this.cursors) {
      cursors[id] = data;
    }
    return cursors;
  }
}

export const store = new Store();
