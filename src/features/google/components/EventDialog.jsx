import { useState } from 'react';

import Dialog from './Dialog';
import {
  createEvent,
  deleteEvent,
  fromLocalInput,
  toLocalInput,
  updateEvent,
} from '../services/calendar';

const blankEvent = () => {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);

  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  return {
    title: '',
    description: '',
    location: '',
    start: toLocalInput(start.toISOString()),
    end: toLocalInput(end.toISOString()),
    allDay: false,
    calendarId: '',
  };
};

/**
 * One dialog for both creating and editing: an event with an id is edited, one
 * without is created. Deleting lives here too, since that is where the event is
 * known.
 */
const EventDialog = ({
  event,
  calendars = [],
  defaultCalendarId = 'primary',
  onClose,
  onSaved,
  onDeleted,
}) => {
  const isEditing = Boolean(event?.id);
  const [form, setForm] = useState(() =>
    isEditing
      ? {
          title: event.title,
          description: event.description,
          location: event.location,
          start: toLocalInput(event.start),
          end: toLocalInput(event.end),
          allDay: event.allDay,
          calendarId: event.calendarId || defaultCalendarId,
        }
      : { ...blankEvent(), calendarId: defaultCalendarId },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const update = (key) => (changeEvent) =>
    setForm((current) => ({ ...current, [key]: changeEvent.target.value }));

  const save = async (submitEvent) => {
    submitEvent.preventDefault();

    if (!form.title.trim()) {
      setError('A title is needed.');

      return;
    }

    setBusy(true);
    setError('');

    const payload = {
      ...form,
      title: form.title.trim(),
      start: form.allDay ? `${form.start.slice(0, 10)}T00:00:00` : fromLocalInput(form.start),
      end: form.allDay ? `${form.end.slice(0, 10)}T00:00:00` : fromLocalInput(form.end),
    };

    try {
      const saved = isEditing
        ? await updateEvent(event.id, payload)
        : await createEvent(payload);

      onSaved(saved);
      onClose();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError('');

    try {
      await deleteEvent(event.id, event.calendarId || defaultCalendarId);
      onDeleted(event.id);
      onClose();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      title={isEditing ? 'Edit event' : 'New event'}
      onClose={onClose}
      footer={
        <>
          {isEditing && (
            <button type="button" className="gwButton danger" onClick={remove} disabled={busy}>
              Delete
            </button>
          )}
          <span className="gwSpacer" />
          <button type="button" className="gwButton" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="eventForm" className="gwButton primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="eventForm" className="gwForm" onSubmit={save}>
        {calendars.length > 1 && (
          <label>
            Calendar
            <select value={form.calendarId} onChange={update('calendarId')}>
              {calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.summary}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Title
          <input value={form.title} onChange={update('title')} placeholder="Dentist" autoFocus />
        </label>

        <label className="gwInline">
          <input
            type="checkbox"
            checked={form.allDay}
            onChange={(changeEvent) =>
              setForm((current) => ({ ...current, allDay: changeEvent.target.checked }))
            }
          />
          All day
        </label>

        <div className="gwRow">
          <label>
            Starts
            <input
              type={form.allDay ? 'date' : 'datetime-local'}
              value={form.allDay ? form.start.slice(0, 10) : form.start}
              onChange={update('start')}
            />
          </label>
          <label>
            Ends
            <input
              type={form.allDay ? 'date' : 'datetime-local'}
              value={form.allDay ? form.end.slice(0, 10) : form.end}
              onChange={update('end')}
            />
          </label>
        </div>

        <label>
          Location
          <input value={form.location} onChange={update('location')} placeholder="Optional" />
        </label>

        <label>
          Notes
          <textarea value={form.description} onChange={update('description')} rows={3} />
        </label>

        {error && <p className="gwError">{error}</p>}
      </form>
    </Dialog>
  );
};

export default EventDialog;
