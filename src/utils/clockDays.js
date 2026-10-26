/**
 * The Progress clock answers for the days it is switched on for. On the others
 * the clock falls back to whatever the person picked, which is Digital until
 * they say otherwise.
 *
 * Weekdays are the values `Date#getDay` uses, so 0 is Sunday and 1 is Monday.
 */
export const WEEKDAYS = [
  { value: 1, label: 'MON' },
  { value: 2, label: 'TUE' },
  { value: 3, label: 'WED' },
  { value: 4, label: 'THU' },
  { value: 5, label: 'FRI' },
  { value: 6, label: 'SAT' },
  { value: 0, label: 'SUN' },
];

// The working week, which is what "progress" means for most people.
export const DEFAULT_PERCENTAGE_DAYS = [1, 2, 3, 4, 5];

export function readPercentageDays() {
  let stored = null;

  try {
    stored = JSON.parse(localStorage.getItem('percentageDays'));
  } catch {
    stored = null;
  }

  if (!Array.isArray(stored)) return DEFAULT_PERCENTAGE_DAYS;

  return stored.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
}

export function savePercentageDays(days) {
  localStorage.setItem('percentageDays', JSON.stringify(days));
}

export function isPercentageDay(date = new Date()) {
  return readPercentageDays().includes(date.getDay());
}

/**
 * Whether the days above have a say at all. On by default: the Progress clock
 * answers for its days and the others get the clock below, which is what the
 * widget did before the switch existed. Switched off, the Progress clock is the
 * clock for every day and the days are only a record of the week.
 */
export function readPercentageFallback() {
  return localStorage.getItem('percentageFallback') !== 'false';
}

/**
 * The clock shown when the Progress clock is not on duty for today. Progress
 * itself is not offered here: it is the thing being switched off.
 */
export function offClockType() {
  const stored = localStorage.getItem('percentageOffType');

  return stored && stored !== 'percentageComplete' ? stored : 'digital';
}

/**
 * The type the clock should actually draw right now.
 */
export function resolveTimeType() {
  const stored = localStorage.getItem('timeType');

  if (stored === 'percentageComplete' && readPercentageFallback() && !isPercentageDay()) {
    return offClockType();
  }

  return stored;
}
