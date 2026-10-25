import { googleFetch } from '../api';

const CALENDAR = '/calendar/v3/calendars/primary/events';

const toEvent = (event) => ({
  id: event.id,
  title: event.summary || '(no title)',
  description: event.description ?? '',
  location: event.location ?? '',
  // All-day events carry `date` instead of `dateTime`.
  allDay: Boolean(event.start?.date),
  start: event.start?.dateTime ?? event.start?.date ?? '',
  end: event.end?.dateTime ?? event.end?.date ?? '',
  htmlLink: event.htmlLink ?? '',
});

export const listEvents = async ({ timeMin, timeMax, maxResults = 10 }) => {
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin,
    timeMax,
    maxResults: String(maxResults),
  });

  const data = await googleFetch(`${CALENDAR}?${params}`);

  return (data?.items ?? []).map(toEvent);
};

export const createEvent = async ({ title, description, location, start, end, allDay }) => {
  const bounds = allDay
    ? { start: { date: start.slice(0, 10) }, end: { date: end.slice(0, 10) } }
    : { start: { dateTime: start }, end: { dateTime: end } };

  const event = await googleFetch(CALENDAR, {
    method: 'POST',
    body: JSON.stringify({ summary: title, description, location, ...bounds }),
  });

  return toEvent(event);
};

export const updateEvent = async (id, { title, description, location, start, end, allDay }) => {
  const bounds = allDay
    ? { start: { date: start.slice(0, 10) }, end: { date: end.slice(0, 10) } }
    : { start: { dateTime: start }, end: { dateTime: end } };

  const event = await googleFetch(`${CALENDAR}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ summary: title, description, location, ...bounds }),
  });

  return toEvent(event);
};

export const deleteEvent = async (id) => {
  await googleFetch(`${CALENDAR}/${encodeURIComponent(id)}`, { method: 'DELETE' });
};

/**
 * A day is offered as a fixed window from midnight, so the widget does not need
 * the timezone offset of every event.
 */
export const dayBounds = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
};

/** `datetime-local` wants the local wall clock without a zone suffix. */
export const toLocalInput = (value) => {
  if (!value) return '';

  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

export const fromLocalInput = (value) => (value ? new Date(value).toISOString() : '');
