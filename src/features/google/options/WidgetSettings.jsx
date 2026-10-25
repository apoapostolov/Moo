import { Fragment, useCallback, useEffect, useState } from 'react';

import {
  MdInbox,
  MdPeople,
  MdLocalOffer,
  MdNotifications,
  MdForum,
  MdFolder,
} from 'react-icons/md';

import EventBus from 'utils/eventbus';

import { Row, Content, Action } from 'components/Layout/Settings/Item';
import { Checkbox, Dropdown, Text } from 'components/Form/Settings';

import { listCalendars } from '../services/calendar';
import { listLabels } from '../services/gmail';
import { listTaskLists } from '../services/tasks';
import {
  CALENDAR_RANGES,
  MAIL_CATEGORIES,
  MAIL_QUERIES,
  REFRESH_OPTIONS,
  TASK_SORTS,
  readCalendarIds,
  readMailCategories,
  readMailFolders,
} from '../settings';

const CATEGORY_ICONS = {
  primary: MdInbox,
  social: MdPeople,
  promotions: MdLocalOffer,
  updates: MdNotifications,
  forums: MdForum,
};

const options = (list) => list.map((entry) => ({ value: entry.value, text: entry.label }));

const MAX_EVENTS = [
  { value: '5', label: '5 events' },
  { value: '8', label: '8 events' },
  { value: '12', label: '12 events' },
  { value: '20', label: '20 events' },
  { value: '50', label: '50 events' },
];

const MAX_ITEMS = [
  { value: '5', label: '5 items' },
  { value: '10', label: '10 items' },
  { value: '20', label: '20 items' },
  { value: '50', label: '50 items' },
];

const MAX_MAIL = [
  { value: '3', label: '3 messages' },
  { value: '6', label: '6 messages' },
  { value: '10', label: '10 messages' },
  { value: '20', label: '20 messages' },
];

const Section = ({ title, subtitle, children }) => (
  <Row>
    <Content title={title} subtitle={subtitle} />
    <Action>{children}</Action>
  </Row>
);

/**
 * Calendars are a checkbox list rather than a picker, because a picker that only
 * holds one value cannot express "work and family but not birthdays".
 */
const CalendarPicker = () => {
  const [calendars, setCalendars] = useState([]);
  const [selected, setSelected] = useState(readCalendarIds);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    listCalendars()
      .then(setCalendars)
      .catch(() => setFailed(true));
  }, []);

  const toggle = (id) => {
    const next = selected.includes(id)
      ? selected.filter((entry) => entry !== id)
      : [...selected, id];

    setSelected(next);
    localStorage.setItem('googleCalendarIds', JSON.stringify(next));
    // The widgets listen for this category through the same bus the rest of the
    // settings screen uses.
    EventBus.emit('refresh', 'google');
  };

  if (failed) {
    return (
      <p className="gwEmpty">
        Calendars could not be listed. Disconnect and connect again so Moo can read the calendar
        list, then reload this page.
      </p>
    );
  }

  if (!calendars.length) return <p className="gwEmpty">Reading your calendars…</p>;

  return (
    <div className="gwCalendarPicker">
      {calendars.map((calendar) => (
        <label key={calendar.id} className="gwCalendarOption">
          <input
            type="checkbox"
            checked={selected.includes(calendar.id)}
            onChange={() => toggle(calendar.id)}
          />
          <span className="gwDot" style={calendar.color ? { background: calendar.color } : {}} />
          {calendar.summary}
          {calendar.primary && <span className="gwMuted">primary</span>}
        </label>
      ))}
      <span className="gwMuted">
        {selected.length ? 'Only the ticked calendars are shown.' : 'Nothing ticked: only the primary calendar is shown.'}
      </span>
    </div>
  );
};

/** One reusable tick list for the mail categories and the labels. */
const OptionTicks = ({ options, selected, onToggle, empty }) => {
  if (!options.length) return <p className="gwEmpty">{empty}</p>;

  return (
    <div className="gwOptionList">
      {options.map((option) => {
        const Icon = option.icon;

        return (
          <label key={option.id} className="gwOption">
            <input
              type="checkbox"
              checked={selected.includes(option.id)}
              onChange={() => onToggle(option.id)}
            />
            {Icon && <Icon className="gwOptionIcon" />}
            <span className="gwOptionName">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
};

const CategoryPicker = () => {
  const [selected, setSelected] = useState(readMailCategories);

  const toggle = (id) => {
    const next = selected.includes(id)
      ? selected.filter((entry) => entry !== id)
      : [...selected, id];

    setSelected(next);
    localStorage.setItem('googleMailCategories', JSON.stringify(next));
    EventBus.emit('refresh', 'google');
  };

  return (
    <OptionTicks
      options={MAIL_CATEGORIES.map((category) => ({
        ...category,
        icon: CATEGORY_ICONS[category.id],
      }))}
      selected={selected}
      onToggle={toggle}
      empty="No categories."
    />
  );
};

const FolderPicker = () => {
  const [labels, setLabels] = useState([]);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState(readMailFolders);

  useEffect(() => {
    listLabels()
      .then(setLabels)
      .catch(() => setFailed(true));
  }, []);

  const selectedIds = selected.map((folder) => (typeof folder === 'string' ? folder : folder.id));

  const toggle = (label) => {
    const next = selectedIds.includes(label.id)
      ? selected.filter((folder) => (typeof folder === 'string' ? folder : folder.id) !== label.id)
      : [...selected, { id: label.id, name: label.name }];

    setSelected(next);
    localStorage.setItem('googleMailFolders', JSON.stringify(next));
    EventBus.emit('refresh', 'google');
  };

  if (failed) {
    return <p className="gwEmpty">Folders could not be read. Reconnect Google and open this page again.</p>;
  }

  return (
    <OptionTicks
      options={labels.map((label) => ({ id: label.id, label: label.display, icon: MdFolder }))}
      selected={selectedIds}
      onToggle={(id) => toggle(labels.find((label) => label.id === id))}
      empty="Reading your folders…"
    />
  );
};

const TaskListPicker = () => {
  const [lists, setLists] = useState([]);

  useEffect(() => {
    listTaskLists()
      .then(setLists)
      .catch(() => setLists([]));
  }, []);

  if (lists.length < 2) {
    return <span className="gwMuted">{lists[0]?.title ?? 'Your default task list'}</span>;
  }

  return (
    <Dropdown
      name="googleTasksList"
      category="google"
      items={lists.map((list) => ({ value: list.id, text: list.title }))}
    />
  );
};

/** Everything that only makes sense once an account is connected. */
export const GoogleWidgetSettings = () => {

  const [tab, setTab] = useState('mail');

  const tabs = [
    { id: 'mail', label: 'Mail widget' },
    { id: 'calendar', label: 'Calendar widget' },
    { id: 'tasks', label: 'Tasks widget' },
  ];

  const render = useCallback(() => {
    if (tab === 'calendar') {
      return (
        <Fragment key={tab}>
          <Row>
            <Content
              title="Calendars shown"
              subtitle="Which calendars feed the calendar widget."
            />
            <Action>
              <CalendarPicker />
            </Action>
          </Row>
          <Section title="Range" subtitle="How far ahead the widget looks.">
            <Dropdown name="googleCalendarRange" category="google" items={options(CALENDAR_RANGES)} />
          </Section>
          <Section title="Events shown" subtitle="Upper limit for the whole range.">
            <Dropdown name="googleCalendarMax" category="google" items={options(MAX_EVENTS)} />
          </Section>
          <Section title="Event details" subtitle="What each line carries.">
            <Checkbox name="googleCalendarLocation" text="Location" category="google" />
            <Checkbox name="googleCalendarNotes" text="Notes" category="google" />
            <Checkbox name="googleCalendarDeclined" text="Declined events" category="google" />
            <Checkbox name="googleCalendarHideAllDay" text="Hide all-day events" category="google" />
          </Section>
          <Section title="Layout" subtitle="How the agenda is drawn.">
            <Checkbox name="googleCalendarGroup" text="Group by day" category="google" />
            <Checkbox name="googleCalendar24Hour" text="24-hour times" category="google" />
          </Section>
          <Section title="Refresh" subtitle="How often Google is asked again.">
            <Dropdown name="googleCalendarRefresh" category="google" items={options(REFRESH_OPTIONS)} />
          </Section>
        </Fragment>
      );
    }

    if (tab === 'tasks') {
      return (
        <Fragment key={tab}>
          <Row>
            <Content title="Task list" subtitle="Which list the widget reads and writes." />
            <Action>
              <TaskListPicker />
            </Action>
          </Row>
          <Section title="Sorting" subtitle="Order of the tasks that pass the filters.">
            <Dropdown name="googleTasksSort" category="google" items={options(TASK_SORTS)} />
            <Checkbox name="googleTasksGroup" text="Group by due date" category="google" />
          </Section>
          <Section title="Filtering" subtitle="What is left out of the list.">
            <Checkbox name="googleTasksCompleted" text="Show completed tasks" category="google" />
            <Checkbox name="googleTasksHideUndated" text="Hide tasks without a date" category="google" />
          </Section>
          <Section title="Details" subtitle="What each row shows.">
            <Checkbox name="googleTasksNotes" text="Notes" category="google" />
            <Dropdown name="googleTasksMax" category="google" items={options(MAX_ITEMS)} />
          </Section>
          <Section title="Refresh" subtitle="How often Google is asked again.">
            <Dropdown name="googleTasksRefresh" category="google" items={options(REFRESH_OPTIONS)} />
          </Section>
        </Fragment>
      );
    }

    return (
      <Fragment key={tab}>
        <Row>
          <Content
            title="Inbox categories"
            subtitle="Unticked categories are never fetched into the widget, so a promotions flood cannot push real mail out of it."
          />
          <Action>
            <CategoryPicker />
          </Action>
        </Row>
        <Row>
          <Content
            title="Folders and labels"
            subtitle="Also pull messages from these Gmail folders and labels. Nothing ticked leaves the widget on the categories above."
          />
          <Action>
            <FolderPicker />
          </Action>
        </Row>
        <Section title="Filter" subtitle="Which messages the widget lists.">
          <Dropdown name="googleMailQuery" category="google" items={options(MAIL_QUERIES)} />
        </Section>
        <Row>
          <Content
            title="Custom search"
            subtitle="Any Gmail search wins over the filter above, for example from:ana@example.com or has:attachment is:unread."
          />
          <Action>
            <Text name="googleMailCustomQuery" title="Gmail search" placeholder="from:ana@example.com" />
          </Action>
        </Row>
        <Section title="Messages shown" subtitle="Upper limit per refresh.">
          <Dropdown name="googleMailMax" category="google" items={options(MAX_MAIL)} />
        </Section>
        <Section title="First line" subtitle="Which field leads each message.">
          <Dropdown
            name="googleMailPrimary"
            category="google"
            items={[
              { value: 'sender', text: 'Sender first' },
              { value: 'subject', text: 'Subject first' },
            ]}
          />
        </Section>
        <Section title="Detail" subtitle="Extra text and the unread indicator.">
          <Checkbox name="googleMailSnippet" text="Preview text" category="google" />
          <Dropdown
            name="googleMailBadge"
            category="google"
            items={[
              { value: 'count', text: 'Unread count' },
              { value: 'dot', text: 'Unread dot' },
              { value: 'hidden', text: 'No indicator' },
            ]}
          />
        </Section>
        <Section title="Refresh" subtitle="How often Google is asked again.">
          <Dropdown name="googleMailRefresh" category="google" items={options(REFRESH_OPTIONS)} />
        </Section>
      </Fragment>
    );
  }, [tab]);

  return (
    <>
      <Row>
        <Content
          title="Widget settings"
          subtitle="Connected. These controls change what the three widgets show."
        />
        <Action>
          <div className="gwTabs">
            {tabs.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`gwTab${tab === entry.id ? ' active' : ''}`}
                onClick={() => setTab(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </Action>
      </Row>

      {render()}
    </>
  );
};

export default GoogleWidgetSettings;
