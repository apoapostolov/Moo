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
// The lean follows the hand over this much pointer travel rather than from one
// report to the next. A single frame's delta is mostly mouse jitter: one pixel
// in eight milliseconds reads as a full-speed flick, which is what made small
// corrections snap the paper from edge to edge.
const TILT_WINDOW = 90;
// Speeds below this do not lean the paper at all, so nudging it into place
// leaves it as straight as it was.
const TILT_DEADZONE = 0.05;
// At this speed the lean is at its limit.
const TILT_FULL_SPEED = 0.55;
// How long the lean takes to close on its target.
const TILT_TAU = 90;
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
 * The lean a given speed asks for, in degrees. Speed is in pixels per
 * millisecond, so a fast flick and a slow crawl lean by different amounts
 * instead of by whatever the frame rate happened to be.
 *
 * The ramp is squared rather than linear: the first pixels of a movement lean
 * the paper by almost nothing, and only a real flick reaches the full lean. A
 * straight line from zero would still startle at walking pace.
 */
const dragTarget = (speed) => {
  const magnitude = Math.abs(speed);

  if (magnitude <= TILT_DEADZONE) return 0;

  const ramp = Math.min(1, (magnitude - TILT_DEADZONE) / (TILT_FULL_SPEED - TILT_DEADZONE));

  return Math.sign(speed) * ramp * ramp * DRAG_TILT;
};

/**
 * Speed over the last TILT_WINDOW of pointer travel, in pixels per millisecond.
 * The samples are the drag's own history; the oldest one at least a window away
 * is the anchor. A drag younger than the window is measured over its whole
 * length, which keeps the first moments honest instead of inventing a speed.
 */
const windowedSpeed = (samples, now) => {
  const newest = samples[samples.length - 1];
  let anchor = samples[0];

  for (let index = samples.length - 1; index >= 0; index--) {
    if (newest.t - samples[index].t >= TILT_WINDOW) {
      anchor = samples[index];
      break;
    }
  }

  const span = Math.max(16, newest.t - anchor.t);

  return (newest.x - anchor.x) / span;
};

/**
 * One step of an ease that behaves the same at any pointer rate: the share of
 * the distance covered grows with the time since the last step, so a 60 Hz mouse
 * and a 144 Hz mouse lean alike. `dt` is in milliseconds.
 */
const easeToward = (current, target, dt) =>
  current + (target - current) * (1 - Math.exp(-Math.max(1, dt) / TILT_TAU));

export {
  NOTE_WIDTH,
  MIN_TILT,
  MAX_TILT,
  DRAG_TILT,
  TILT_WINDOW,
  TILT_DEADZONE,
  TILT_FULL_SPEED,
  TILT_TAU,
  MOVE_THRESHOLD,
  IMAGE_MAX_EDGE,
  IMAGE_QUALITY,
  IMAGE_MIN_WIDTH,
  IMAGE_MAX_WIDTH,
  clamp,
  settleAngle,
  randomTilt,
  dragTarget,
  windowedSpeed,
  easeToward,
};
