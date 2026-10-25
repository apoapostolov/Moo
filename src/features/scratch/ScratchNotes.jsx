import { useCallback, useEffect, useRef, useState } from 'react';

import EventBus from 'utils/eventbus';
import Markdown from './Markdown';

import './scratchNotes.scss';

/**
 * Scratch notes are paper on the new tab page: a double click on empty space
 * drops one, it lies a little crooked, and it can be dragged, written in and
 * removed. They live in localStorage, so a note outlives the tab.
 */

const STORE = 'scratchNotesData';
const FLAG = 'scratchNotes';
const NOTE_WIDTH = 240;
// A note is always slightly crooked, so the tilt reads as paper and not as a
// mistake. Kept under four degrees so the words stay easy to read.
const MIN_TILT = 1.2;
const MAX_TILT = 3.6;
// How much a fast drag adds to the tilt before it is clamped.
const DRAG_TILT = 6;
const MOVE_THRESHOLD = 4;
const ARM_TIMEOUT = 4000;

// Anything that is already something: a control, a widget, a dialog, another
// note. A double click there does not mean "give me paper".
const NOT_BACKGROUND =
  '.scratchNote, #widgets, #navbar, .navbar, .modal, dialog, .ReactModal__Overlay, label, button, a, input, textarea, select, [contenteditable="true"], [role="button"], .Toastify, .reminder-info';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const readNotes = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE) || '[]');

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((note) => note && typeof note === 'object' && Number.isFinite(note.x))
      .map((note) => ({
        id: String(note.id || `n${Math.random().toString(36).slice(2)}`),
        x: note.x,
        y: Number.isFinite(note.y) ? note.y : 40,
        text: typeof note.text === 'string' ? note.text : '',
        angle: Number.isFinite(note.angle) ? note.angle : 1.5,
        z: Number.isFinite(note.z) ? note.z : 1,
      }));
  } catch {
    return [];
  }
};

const saveNotes = (notes) => localStorage.setItem(STORE, JSON.stringify(notes));

const ScratchNotes = () => {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(FLAG) === 'true');
  const [notes, setNotes] = useState(readNotes);
  const [editingId, setEditingId] = useState(null);
  const [armedId, setArmedId] = useState(null);
  const [drag, setDrag] = useState(null);

  // Kept as a number, so the note touched last is the one on top.
  const topZ = useRef(notes.reduce((highest, note) => Math.max(highest, note.z), 0));
  const dragRef = useRef(null);
  const disarmTimer = useRef(null);
  const inputs = useRef({});

  useEffect(() => {
    const reread = () => setEnabled(localStorage.getItem(FLAG) === 'true');

    EventBus.on('refresh', reread);
    EventBus.on('toggle', reread);

    return () => {
      EventBus.off('refresh', reread);
      EventBus.off('toggle', reread);
    };
  }, []);

  const commit = useCallback((next) => {
    setNotes(next);
    saveNotes(next);
  }, []);

  const bringToFront = useCallback((id) => {
    topZ.current += 1;

    const z = topZ.current;

    setNotes((current) => {
      const next = current.map((note) => (note.id === id ? { ...note, z } : note));

      saveNotes(next);

      return next;
    });
  }, []);

  const createNote = useCallback(
    (clientX, clientY) => {
      topZ.current += 1;

      const note = {
        id: `n${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        x: clamp(clientX - 28, 8, Math.max(8, window.innerWidth - NOTE_WIDTH - 8)),
        y: clamp(clientY - 16, 8, Math.max(8, window.innerHeight - 120)),
        text: '',
        angle: (MIN_TILT + Math.random() * (MAX_TILT - MIN_TILT)) * (Math.random() < 0.5 ? -1 : 1),
        z: topZ.current,
      };

      commit([...notes, note]);
      setEditingId(note.id);
    },
    [commit, notes],
  );

  // The page is the trigger, so the listener sits on the document and turns down
  // anything that already owns its clicks.
  useEffect(() => {
    if (!enabled) return undefined;

    const onDoubleClick = (event) => {
      if (event.target.closest?.(NOT_BACKGROUND)) return;
      if (document.querySelector('dialog[open], .ReactModal__Overlay--after-open')) return;

      createNote(event.clientX, event.clientY);
    };

    document.addEventListener('dblclick', onDoubleClick);

    return () => document.removeEventListener('dblclick', onDoubleClick);
  }, [createNote, enabled]);

  // A note never ends up somewhere it cannot be reached: a window shrunk under
  // it, or a position saved on a wider screen, is pulled back into view.
  useEffect(() => {
    if (!enabled) return undefined;

    const fit = () =>
      setNotes((current) =>
        current.map((note) => ({
          ...note,
          x: clamp(note.x, 8, Math.max(8, window.innerWidth - 80)),
          y: clamp(note.y, 8, Math.max(8, window.innerHeight - 60)),
        })),
      );

    fit();
    window.addEventListener('resize', fit);

    return () => window.removeEventListener('resize', fit);
  }, [enabled]);

  const startDrag = (event, note) => {
    if (event.button !== 0) return;
    if (event.target.closest('.scratchNoteClose')) return;
    // While a note is being written in, the pointer belongs to the text.
    if (editingId === note.id) return;

    event.currentTarget.setPointerCapture?.(event.pointerId);

    dragRef.current = {
      id: note.id,
      startX: event.clientX,
      startY: event.clientY,
      baseX: note.x,
      baseY: note.y,
      lastX: event.clientX,
      moved: false,
    };

    bringToFront(note.id);
    setArmedId(null);
  };

  const moveDrag = (event) => {
    const current = dragRef.current;

    if (!current) return;

    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;

    if (!current.moved && Math.hypot(dx, dy) < MOVE_THRESHOLD) return;

    current.moved = true;

    // The note leans into the pull and stands back up when the hand slows down.
    const speed = event.clientX - current.lastX;

    current.lastX = event.clientX;

    setDrag({ id: current.id, dx, dy, tilt: clamp(speed * 1.4, -DRAG_TILT, DRAG_TILT) });
  };

  const endDrag = (event) => {
    const current = dragRef.current;

    dragRef.current = null;
    setDrag(null);

    if (!current) return;

    if (!current.moved) {
      setEditingId(current.id);

      return;
    }

    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;

    commit(
      notes.map((note) =>
        note.id === current.id
          ? {
              ...note,
              x: clamp(current.baseX + dx, 4, Math.max(4, window.innerWidth - 60)),
              y: clamp(current.baseY + dy, 4, Math.max(4, window.innerHeight - 40)),
            }
          : note,
      ),
    );
  };

  const finishEditing = (note) => {
    setEditingId(null);

    // A note nobody wrote anything in is not worth keeping.
    if (!note.text.trim()) commit(notes.filter((entry) => entry.id !== note.id));
    else commit(notes);
  };

  const changeText = (id, text) => {
    setNotes((current) => current.map((note) => (note.id === id ? { ...note, text } : note)));

    const input = inputs.current[id];

    if (input) {
      input.style.height = 'auto';
      input.style.height = `${input.scrollHeight}px`;
    }
  };

  const armClose = (id) => {
    if (armedId === id) {
      setArmedId(null);
      setEditingId((current) => (current === id ? null : current));
      commit(notes.filter((note) => note.id !== id));

      return;
    }

    setArmedId(id);
    window.clearTimeout(disarmTimer.current);
    disarmTimer.current = window.setTimeout(() => setArmedId(null), ARM_TIMEOUT);
  };

  useEffect(() => () => window.clearTimeout(disarmTimer.current), []);

  if (!enabled) return null;

  return (
    <div className="scratchLayer">
      {notes.map((note) => {
        const editing = editingId === note.id;
        const active = drag?.id === note.id;
        const angle = note.angle + (active ? drag.tilt : 0);

        return (
          <div
            key={note.id}
            className={`scratchNote${editing ? ' editing' : ''}${active ? ' dragging' : ''}`}
            style={{
              left: note.x + (active ? drag.dx : 0),
              top: note.y + (active ? drag.dy : 0),
              zIndex: note.z,
              transform: `rotate(${angle.toFixed(2)}deg)`,
            }}
            onPointerDown={(event) => startDrag(event, note)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <button
              type="button"
              className={`scratchNoteClose${armedId === note.id ? ' armed' : ''}`}
              onClick={() => armClose(note.id)}
              title={armedId === note.id ? 'Click again to remove' : 'Remove note'}
              aria-label={armedId === note.id ? 'Click again to remove the note' : 'Remove note'}
            >
              ×
            </button>
            {editing ? (
              <textarea
                ref={(element) => {
                  inputs.current[note.id] = element;
                }}
                className="scratchNoteInput"
                value={note.text}
                placeholder="Write here. Markdown works."
                autoFocus
                onChange={(event) => changeText(note.id, event.target.value)}
                onBlur={() => finishEditing(note)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') event.currentTarget.blur();
                }}
              />
            ) : (
              <div className="scratchNoteBody">
                <Markdown text={note.text} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export { ScratchNotes as default, ScratchNotes };
