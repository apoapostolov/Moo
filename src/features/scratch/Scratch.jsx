import { useCallback, useEffect, useRef, useState } from 'react';

import EventBus from 'utils/eventbus';
import Markdown from './Markdown';
import {
  NOTE_WIDTH,
  TILT_EASE,
  MOVE_THRESHOLD,
  IMAGE_MAX_EDGE,
  IMAGE_QUALITY,
  IMAGE_MIN_WIDTH,
  IMAGE_MAX_WIDTH,
  clamp,
  settleAngle,
  randomTilt,
  dragTarget,
} from './shared';

import './scratchNotes.scss';
import './scratchImages.scss';

/**
 * Scratch paper on the new tab page: a double click drops a written note, a
 * paste drops a picture. Both lie a little crooked, both are dragged the same
 * way, and both are lifted above whatever they are pulled over.
 *
 * They share one layer, because a note and a picture that overlap have to agree
 * on which of them is on top — and two layers could not.
 */

const NOTES_STORE = 'scratchNotesData';
const IMAGES_STORE = 'scratchImagesData';
const NOTES_FLAG = 'scratchNotes';
const IMAGES_FLAG = 'scratchImages';
const TOP_Z = 'scratchTopZ';
const ARM_TIMEOUT = 4000;
// A pasted picture is stored whole, so the store has a ceiling: past it the
// oldest picture steps aside instead of the write failing.
const IMAGE_BUDGET = 4.2 * 1024 * 1024;

const NOT_BACKGROUND =
  '.scratchNote, .scratchImage, #widgets, #navbar, .navbar, .modal, dialog, .ReactModal__Overlay, label, button, a, input, textarea, select, [contenteditable="true"], [role="button"], .Toastify, .reminder-info';

const TYPING =
  'input, textarea, [contenteditable="true"], [contenteditable=""], [role="textbox"]';

const nextZ = () => {
  const top = Number(localStorage.getItem(TOP_Z) || 0) + 1;

  localStorage.setItem(TOP_Z, String(top));

  return top;
};

const readNotes = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(NOTES_STORE) || '[]');

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

const readImages = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(IMAGES_STORE) || '[]');

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((image) => image && typeof image.src === 'string' && Number.isFinite(image.x))
      .map((image) => ({
        id: String(image.id || `i${Math.random().toString(36).slice(2)}`),
        x: image.x,
        y: Number.isFinite(image.y) ? image.y : 60,
        width: Number.isFinite(image.width) ? image.width : NOTE_WIDTH,
        ratio: Number.isFinite(image.ratio) && image.ratio > 0 ? image.ratio : 1,
        angle: Number.isFinite(image.angle) ? image.angle : 1.5,
        z: Number.isFinite(image.z) ? image.z : 1,
        src: image.src,
      }));
  } catch {
    return [];
  }
};

const saveNotes = (notes) => localStorage.setItem(NOTES_STORE, JSON.stringify(notes));

/**
 * A picture is far larger than a note, so the write can run out of room. The
 * oldest picture pays for the new one; if even that is not enough the paste is
 * dropped rather than throwing inside the paste handler.
 */
const saveImages = (images) => {
  const keep = [...images];

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const payload = JSON.stringify(keep);
    // The budget is checked before the write, so a store that is already too
    // full shrinks even when the browser would have accepted the string.
    const fits = payload.length <= IMAGE_BUDGET;

    if (fits) {
      try {
        localStorage.setItem(IMAGES_STORE, payload);

        return keep;
      } catch {
        // A full origin refuses the write outright; fall through and drop one.
      }
    }

    if (keep.length <= 1) break;

    keep.shift();
  }

  throw new Error('There is no room left for another picture.');
};

const loadImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('That image could not be read.'));
    image.src = url;
  });

/**
 * A screenshot straight off the clipboard can be several megabytes. It is drawn
 * once into a smaller canvas and stored as WebP, which keeps the note-sized
 * picture in the hundreds of kilobytes.
 */
const prepareImage = async (file) => {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, IMAGE_MAX_EDGE / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');

    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext('2d');

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return {
      src: canvas.toDataURL('image/webp', IMAGE_QUALITY),
      ratio: image.width / Math.max(1, image.height),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

// The clipboard only accepts PNG in Firefox, and a pasted JPEG has to be
// re-encoded before it can be handed back to the system.
const toPngBlob = async (src) => {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');

  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext('2d').drawImage(image, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('no blob'))), 'image/png');
  });
};

const Scratch = () => {
  const [notesOn, setNotesOn] = useState(() => localStorage.getItem(NOTES_FLAG) === 'true');
  const [imagesOn, setImagesOn] = useState(() => localStorage.getItem(IMAGES_FLAG) === 'true');
  const [notes, setNotes] = useState(readNotes);
  const [images, setImages] = useState(readImages);
  const [editingId, setEditingId] = useState(null);
  const [armedId, setArmedId] = useState(null);
  const [drag, setDrag] = useState(null);
  const [imageDrag, setImageDrag] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [copyFailed, setCopyFailed] = useState(null);

  const dragRef = useRef(null);
  const imageDragRef = useRef(null);
  const tiltRef = useRef(0);
  const disarmTimer = useRef(null);
  const copyTimer = useRef(null);
  const inputs = useRef({});
  // Where the hand last was. A paste with no pointer over the page yet falls
  // back to the middle of the window rather than a corner.
  const pointer = useRef(null);

  useEffect(() => {
    const reread = () => {
      setNotesOn(localStorage.getItem(NOTES_FLAG) === 'true');
      setImagesOn(localStorage.getItem(IMAGES_FLAG) === 'true');
    };

    EventBus.on('refresh', reread);
    EventBus.on('toggle', reread);

    return () => {
      EventBus.off('refresh', reread);
      EventBus.off('toggle', reread);
    };
  }, []);

  const commitNotes = useCallback((next) => {
    setNotes(next);
    saveNotes(next);
  }, []);

  const commitImages = useCallback((next) => {
    try {
      setImages(saveImages(next));
    } catch {
      // Out of room even after dropping the oldest picture: keep the change on
      // screen rather than losing what the hand just did.
      setImages([...next]);
    }
  }, []);

  const lift = useCallback(
    (id, kind) => {
      const z = nextZ();

      if (kind === 'image') {
        setImages((current) => {
          const next = current.map((image) => (image.id === id ? { ...image, z } : image));

          saveImages(next);

          return next;
        });

        return;
      }

      setNotes((current) => {
        const next = current.map((note) => (note.id === id ? { ...note, z } : note));

        saveNotes(next);

        return next;
      });
    },
    [],
  );

  /* ------------------------------------------------------------------ notes */

  const createNote = useCallback(
    (clientX, clientY) => {
      const note = {
        id: `n${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        x: clamp(clientX - 28, 8, Math.max(8, window.innerWidth - NOTE_WIDTH - 8)),
        y: clamp(clientY - 16, 8, Math.max(8, window.innerHeight - 120)),
        text: '',
        angle: randomTilt(),
        z: nextZ(),
      };

      commitNotes([...notes, note]);
      setEditingId(note.id);
    },
    [commitNotes, notes],
  );

  useEffect(() => {
    if (!notesOn) return undefined;

    const onDoubleClick = (event) => {
      if (event.target.closest?.(NOT_BACKGROUND)) return;
      if (document.querySelector('dialog[open], .ReactModal__Overlay--after-open')) return;

      createNote(event.clientX, event.clientY);
    };

    document.addEventListener('dblclick', onDoubleClick);

    return () => document.removeEventListener('dblclick', onDoubleClick);
  }, [createNote, notesOn]);

  const startDrag = (event, note) => {
    if (event.button !== 0) return;
    if (event.target.closest('.scratchNoteClose')) return;
    if (editingId === note.id) return;

    event.currentTarget.setPointerCapture?.(event.pointerId);

    tiltRef.current = 0;

    dragRef.current = {
      id: note.id,
      startX: event.clientX,
      startY: event.clientY,
      baseX: note.x,
      baseY: note.y,
      lastX: event.clientX,
      lastTime: event.timeStamp || performance.now(),
      moved: false,
    };

    lift(note.id, 'note');
    setArmedId(null);
  };

  const moveDrag = (event) => {
    const current = dragRef.current;

    if (!current) return;

    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;

    if (!current.moved && Math.hypot(dx, dy) < MOVE_THRESHOLD) return;

    current.moved = true;

    const now = event.timeStamp || performance.now();
    const elapsed = Math.max(8, now - current.lastTime);
    const speed = (event.clientX - current.lastX) / elapsed;

    current.lastX = event.clientX;
    current.lastTime = now;

    tiltRef.current += (dragTarget(speed) - tiltRef.current) * TILT_EASE;

    setDrag({ id: current.id, dx, dy, tilt: tiltRef.current });
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

    commitNotes(
      notes.map((note) =>
        note.id === current.id
          ? {
              ...note,
              x: clamp(current.baseX + dx, 4, Math.max(4, window.innerWidth - 60)),
              y: clamp(current.baseY + dy, 4, Math.max(4, window.innerHeight - 40)),
              angle: settleAngle(note.angle + tiltRef.current),
            }
          : note,
      ),
    );
  };

  const finishEditing = (note) => {
    setEditingId(null);

    if (!note.text.trim()) commitNotes(notes.filter((entry) => entry.id !== note.id));
    else commitNotes(notes);
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
      commitNotes(notes.filter((note) => note.id !== id));

      return;
    }

    setArmedId(id);
    window.clearTimeout(disarmTimer.current);
    disarmTimer.current = window.setTimeout(() => setArmedId(null), ARM_TIMEOUT);
  };

  /* ----------------------------------------------------------------- images */

  const addImage = useCallback(
    async (file) => {
      const { src, ratio } = await prepareImage(file);
      const at = pointer.current ?? {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
      // A wide picture and a tall one both start at the width of a note, so the
      // first thing you see is a small card, not a wall.
      const width = NOTE_WIDTH;
      const height = width / ratio;

      const image = {
        id: `i${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        x: clamp(at.x - width / 2, 8, Math.max(8, window.innerWidth - width - 8)),
        y: clamp(at.y - height / 2, 8, Math.max(8, window.innerHeight - height - 8)),
        width,
        ratio,
        angle: randomTilt(),
        z: nextZ(),
        src,
      };

      setImages((current) => {
        const next = [...current, image];

        return saveImages(next);
      });
    },
    [],
  );

  useEffect(() => {
    const track = (event) => {
      pointer.current = { x: event.clientX, y: event.clientY };
    };

    window.addEventListener('pointermove', track, { passive: true });

    return () => window.removeEventListener('pointermove', track);
  }, []);

  // Pasting a picture on the page makes a picture. A paste inside a field is
  // still that field's paste.
  useEffect(() => {
    if (!imagesOn) return undefined;

    const onPaste = (event) => {
      if (event.target?.closest?.(TYPING)) return;

      const items = [...(event.clipboardData?.items || [])];
      const picture = items.find((item) => item.kind === 'file' && item.type.startsWith('image/'));

      if (!picture) return;

      const file = picture.getAsFile();

      if (!file) return;

      event.preventDefault();
      addImage(file).catch(() => {});
    };

    document.addEventListener('paste', onPaste);

    return () => document.removeEventListener('paste', onPaste);
  }, [addImage, imagesOn]);

  const startImageDrag = (event, image) => {
    if (event.button !== 0) return;
    if (event.target.closest('.scratchImageButton, .scratchImageResize')) return;

    event.currentTarget.setPointerCapture?.(event.pointerId);

    tiltRef.current = 0;

    imageDragRef.current = {
      mode: 'move',
      id: image.id,
      startX: event.clientX,
      startY: event.clientY,
      baseX: image.x,
      baseY: image.y,
      startWidth: image.width,
      lastX: event.clientX,
      lastTime: event.timeStamp || performance.now(),
      moved: false,
    };

    lift(image.id, 'image');
  };

  const moveImageDrag = (event) => {
    const current = imageDragRef.current;

    if (!current) return;

    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;

    if (current.mode === 'resize') {
      const width = clamp(current.startWidth + dx, IMAGE_MIN_WIDTH, IMAGE_MAX_WIDTH);

      setImageDrag({ id: current.id, mode: 'resize', dx: 0, dy: 0, width });

      return;
    }

    if (!current.moved && Math.hypot(dx, dy) < MOVE_THRESHOLD) return;

    current.moved = true;

    const now = event.timeStamp || performance.now();
    const elapsed = Math.max(8, now - current.lastTime);
    const speed = (event.clientX - current.lastX) / elapsed;

    current.lastX = event.clientX;
    current.lastTime = now;

    tiltRef.current += (dragTarget(speed) - tiltRef.current) * TILT_EASE;

    setImageDrag({ id: current.id, mode: 'move', dx, dy, tilt: tiltRef.current });
  };

  const endImageDrag = (event) => {
    const current = imageDragRef.current;

    imageDragRef.current = null;
    setImageDrag(null);

    if (!current) return;

    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;

    if (current.mode === 'resize') {
      const width = clamp(current.startWidth + dx, IMAGE_MIN_WIDTH, IMAGE_MAX_WIDTH);

      commitImages(
        images.map((image) =>
          image.id === current.id
            ? {
                ...image,
                width,
                x: clamp(image.x, 4, Math.max(4, window.innerWidth - 60)),
                y: clamp(image.y, 4, Math.max(4, window.innerHeight - 40)),
              }
            : image,
        ),
      );

      return;
    }

    if (!current.moved) return;

    commitImages(
      images.map((image) =>
        image.id === current.id
          ? {
              ...image,
              x: clamp(current.baseX + dx, 4, Math.max(4, window.innerWidth - 60)),
              y: clamp(current.baseY + dy, 4, Math.max(4, window.innerHeight - 40)),
              angle: settleAngle(image.angle + tiltRef.current),
            }
          : image,
      ),
    );
  };

  const startResize = (event, image) => {
    if (event.button !== 0) return;

    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    imageDragRef.current = {
      mode: 'resize',
      id: image.id,
      startX: event.clientX,
      startY: event.clientY,
      baseX: image.x,
      baseY: image.y,
      startWidth: image.width,
      lastX: event.clientX,
      lastTime: event.timeStamp || performance.now(),
      moved: true,
    };

    lift(image.id, 'image');
  };

  const removeImage = (id) => commitImages(images.filter((image) => image.id !== id));

  const copyImage = async (image) => {
    window.clearTimeout(copyTimer.current);
    setCopyFailed(null);

    try {
      const png = await toPngBlob(image.src);

      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        throw new Error('This browser will not take an image on the clipboard.');
      }

      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);

      setCopiedId(image.id);
      copyTimer.current = window.setTimeout(() => setCopiedId(null), 1300);
    } catch {
      // Better a plain refusal than a tick over a copy that never happened.
      setCopiedId(null);
      setCopyFailed(image.id);
      copyTimer.current = window.setTimeout(() => setCopyFailed(null), 2400);
    }
  };

  const downloadImage = (image) => {
    const extension = image.src.startsWith('data:image/png') ? 'png' : 'webp';
    const link = document.createElement('a');

    link.href = image.src;
    link.download = `moo-scratch-${image.id}.${extension}`;
    link.click();
  };

  /* ------------------------------------------------------------------- both */

  useEffect(() => {
    if (!notesOn && !imagesOn) return undefined;

    const fit = () => {
      setNotes((current) =>
        current.map((note) => ({
          ...note,
          x: clamp(note.x, 8, Math.max(8, window.innerWidth - 80)),
          y: clamp(note.y, 8, Math.max(8, window.innerHeight - 60)),
        })),
      );
      setImages((current) =>
        current.map((image) => ({
          ...image,
          x: clamp(image.x, 8, Math.max(8, window.innerWidth - 80)),
          y: clamp(image.y, 8, Math.max(8, window.innerHeight - 60)),
        })),
      );
    };

    fit();
    window.addEventListener('resize', fit);

    return () => window.removeEventListener('resize', fit);
  }, [imagesOn, notesOn]);

  useEffect(() => () => window.clearTimeout(disarmTimer.current), []);

  if (!notesOn && !imagesOn) return null;

  return (
    <div className="scratchLayer">
      {notesOn &&
        notes.map((note) => {
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

      {imagesOn &&
        images.map((image) => {
          const active = imageDrag?.id === image.id;
          const width = active && imageDrag.mode === 'resize' ? imageDrag.width : image.width;
          const angle = image.angle + (active && imageDrag.tilt ? imageDrag.tilt : 0);

          return (
            <div
              key={image.id}
              className={`scratchImage${active ? ' dragging' : ''}`}
              style={{
                left: image.x + (active && imageDrag.mode === 'move' ? imageDrag.dx : 0),
                top: image.y + (active && imageDrag.mode === 'move' ? imageDrag.dy : 0),
                width,
                aspectRatio: image.ratio,
                zIndex: image.z,
                transform: `rotate(${angle.toFixed(2)}deg)`,
              }}
              onPointerDown={(event) => startImageDrag(event, image)}
              onPointerMove={moveImageDrag}
              onPointerUp={endImageDrag}
              onPointerCancel={endImageDrag}
            >
              <img src={image.src} alt="Pasted on the page" draggable={false} />
              <button
                type="button"
                className={`scratchImageButton scratchImageCopy${
                  copyFailed === image.id ? ' refused' : ''
                }`}
                title={
                  copyFailed === image.id
                    ? 'The clipboard refused this picture'
                    : 'Copy to the clipboard'
                }
                aria-label="Copy this picture"
                onClick={() => copyImage(image)}
              >
                {copiedId === image.id ? '✓' : copyFailed === image.id ? '!' : '⧉'}
              </button>
              <button
                type="button"
                className="scratchImageButton scratchImageClose"
                title="Remove"
                aria-label="Remove this picture"
                onClick={() => removeImage(image.id)}
              >
                ×
              </button>
              <button
                type="button"
                className="scratchImageButton scratchImageDownload"
                title="Save to a file"
                aria-label="Download this picture"
                onClick={() => downloadImage(image)}
              >
                ↓
              </button>
              <span
                className="scratchImageResize"
                role="button"
                tabIndex={0}
                title="Drag to resize"
                aria-label="Resize this picture"
                onPointerDown={(event) => startResize(event, image)}
                onPointerMove={moveImageDrag}
                onPointerUp={endImageDrag}
                onPointerCancel={endImageDrag}
              />
            </div>
          );
        })}
    </div>
  );
};

export { Scratch as default, Scratch };
