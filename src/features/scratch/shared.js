/**
 * Scratch paper has rules that both the written notes and the pasted pictures
 * obey: how wide a fresh one is, how far it may lean, how far the pointer has to
 * travel before a click counts as a drag. They live here so the two features
 * cannot drift apart.
 */

const NOTE_WIDTH = 240;
// A note is always slightly crooked, so the tilt reads as paper and not as a
// mistake. Kept under four degrees so the words stay easy to read.
const MIN_TILT = 1.2;
const MAX_TILT = 3.6;
// How much a fast drag adds to the tilt before it is clamped.
const DRAG_TILT = 6;
// How much of the distance to the wanted lean is covered on each pointer move.
const TILT_EASE = 0.2;
const MOVE_THRESHOLD = 4;

// Byte limits for a stored picture: a paste is re-encoded rather than trusted,
// so a screenshot does not fill the whole storage the notes live in.
const IMAGE_MAX_EDGE = 1600;
const IMAGE_QUALITY = 0.86;
const IMAGE_MIN_WIDTH = 120;
const IMAGE_MAX_WIDTH = 900;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * A note the hand lets go of keeps the lean it was left with, but only within
 * the range that stays readable — and never perfectly straight, because paper
 * dropped on a desk is never perfectly straight.
 */
const settleAngle = (angle) => {
  const size = clamp(Math.abs(angle), MIN_TILT, MAX_TILT);

  return Number((angle < 0 ? -size : size).toFixed(2));
};

const randomTilt = () =>
  (MIN_TILT + Math.random() * (MAX_TILT - MIN_TILT)) * (Math.random() < 0.5 ? -1 : 1);

/**
 * Speed in pixels per millisecond, so a fast flick and a slow crawl lean by
 * different amounts instead of by whatever the frame rate happened to be.
 */
const dragTarget = (speed) => clamp(speed * 120, -DRAG_TILT, DRAG_TILT);

export {
  NOTE_WIDTH,
  MIN_TILT,
  MAX_TILT,
  DRAG_TILT,
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
};
