import { useCallback, useEffect, useState } from 'react';

import { useGoogleAuth } from './hooks/useGoogleAuth';
import { dayBounds, listEvents } from './services/calendar';
import ConnectPrompt, { describeError } from './components/ConnectPrompt';
import EventDialog from './components/EventDialog';

import './google.scss';

const REFRESH_MS = 5 * 60 * 1000;

const dayLabel = (value) => {
  const date = new Date(value);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

  return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
};

const timeLabel = (event) =>
  event.allDay
    ? 'All day'
    : new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** Upcoming events for the next seven days, each opening the edit dialog. */
const GoogleCalendar = () => {
  const { auth, loading, error, connectAccount } = useGoogleAuth();
  const [events, setEvents] = useState([]);
  const [fetchError, setFetchError] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setFetchError('');

    try {
      setEvents(await listEvents({ ...dayBounds(), maxResults: 12 }));
    } catch (loadError) {
      setFetchError(loadError.message);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!auth) return undefined;

    load();

    const timer = setInterval(load, REFRESH_MS);

    return () => clearInterval(timer);
  }, [auth, load]);

  const onSaved = useCallback((saved) => {
    setEvents((current) => {
      const exists = current.some((event) => event.id === saved.id);

      return exists ? current.map((event) => (event.id === saved.id ? saved : event)) : [...current, saved];
    });
  }, []);

  const onDeleted = useCallback((id) => {
    setEvents((current) => current.filter((event) => event.id !== id));
  }, []);

  if (loading) return null;

  if (!auth) {
    return <ConnectPrompt label="Calendar" onConnect={connectAccount} error={error} />;
  }

  const byDay = events.reduce((groups, event) => {
    const key = new Date(event.start).toDateString();

    groups[key] = groups[key] ?? [];
    groups[key].push(event);

    return groups;
  }, {});

  return (
    <div className="googleWidget">
      <header className="gwHead">
        <span className="gwLabel">Calendar</span>
        <button
          type="button"
          className="gwIconButton"
          onClick={() => setEditing({})}
          aria-label="New event"
          title="New event"
        >
          +
        </button>
      </header>

      {fetchError && <p className="gwError">{describeError(fetchError)}</p>}

      {!fetchError && !events.length && <p className="gwEmpty">Nothing scheduled this week.</p>}

      {Object.entries(byDay).map(([day, dayEvents]) => (
        <div className="gwDay" key={day}>
          <span className="gwDayLabel">{dayLabel(dayEvents[0].start)}</span>
          <ul className="gwList">
            {dayEvents.map((event) => (
              <li key={event.id}>
                <button type="button" className="gwItem" onClick={() => setEditing(event)}>
                  <span className="gwItemTop">
                    <span className="gwItemTitle">{event.title}</span>
                    <span className="gwItemMeta">{timeLabel(event)}</span>
                  </span>
                  {event.location && <span className="gwItemSub">{event.location}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {editing && (
        <EventDialog
          event={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      )}

      {busy && !events.length && <p className="gwEmpty">Loading…</p>}
    </div>
  );
};

export default GoogleCalendar;
