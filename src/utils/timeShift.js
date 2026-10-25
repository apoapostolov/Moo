const MINUTES_IN_DAY = 24 * 60;

/**
 * Reads the way people actually type a time: 9, 9:30, 09:30, 9am, 9:30 pm, 17,
 * 17:00. Returns minutes since midnight, or null when the text means nothing,
 * so a typo falls back to the plain whole-day count instead of drawing a
 * percentage from a guess.
 */
export function parseClockInput(raw) {
  if (raw === null || raw === undefined) return null;

  const text = String(raw).trim().toLowerCase().replace(/\s+/g, '');

  if (!text) return null;

  const match = text.match(/^(\d{1,2})(?:[:.](\d{2}))?(am|pm|a|p)?$/);

  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const suffix = match[3];

  if (minutes > 59) return null;

  if (suffix) {
    if (hours < 1 || hours > 12) return null;

    const isPm = suffix.startsWith('p');

    if (hours === 12) hours = isPm ? 12 : 0;
    else if (isPm) hours += 12;
  } else if (hours > 24 || (hours === 24 && minutes > 0)) {
    return null;
  }

  return hours * 60 + minutes;
}

/**
 * A window from the start of the day to the end of the shift. Either field can
 * be empty, and a shift that ends before it starts runs over midnight.
 */
export function shiftWindow(startRaw, endRaw) {
  const start = parseClockInput(startRaw);
  const end = parseClockInput(endRaw);
  const from = start === null ? 0 : start;
  let to = end === null ? MINUTES_IN_DAY : end;

  if (to <= from) to += MINUTES_IN_DAY;

  return { from, to };
}

/**
 * How far through the shift the given moment is, between 0 and 1.
 *
 * After midnight the tail of a shift that runs past midnight still belongs to
 * it, so those minutes are counted from yesterday. Any other time outside the
 * window is simply 0% before it and 100% after it.
 */
export function shiftFraction(now, startRaw, endRaw) {
  const { from, to } = shiftWindow(startRaw, endRaw);
  let minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

  if (to > MINUTES_IN_DAY && minutes < to - MINUTES_IN_DAY) minutes += MINUTES_IN_DAY;

  return Math.min(1, Math.max(0, (minutes - from) / (to - from)));
}
