import { useState, useEffect, useCallback } from 'react';
import { MdOutlineDragIndicator } from 'react-icons/md';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-toastify';

import variables from 'config/variables';
import Clock from './overview_skeletons/Clock';
import QuickLinks from './overview_skeletons/QuickLinks';
import Date from './overview_skeletons/Date';
import Weather from './overview_skeletons/Weather';
import QuickWeather from './overview_skeletons/QuickWeather';
import GoogleWidget from './overview_skeletons/GoogleWidget';

import EventBus from 'utils/eventbus';

const widget_name = {
  time: variables.getMessage('modals.main.settings.sections.time.title'),
  weather: variables.getMessage('modals.main.settings.sections.weather.title'),
  quickweather: 'Weather Now',
  quicklinks: variables.getMessage('modals.main.settings.sections.quicklinks.title'),
  date: variables.getMessage('modals.main.settings.sections.date.title'),
  // The widget's own header says Mail, Calendar or Tasks, so the order list
  // uses the same plain names instead of prefixing every one with Google.
  mail: 'Mail',
  calendar: 'Calendar',
  tasks: 'Tasks',
};

// Widgets added after a profile stored its order still have to show up here,
// otherwise they can never be switched on.
const KNOWN_WIDGETS = [
  'time',
  'weather',
  'date',
  'quickweather',
  'quicklinks',
  'mail',
  'calendar',
  'tasks',
];
const DEFAULT_ORDER = ['time', 'weather', 'date', 'quickweather', 'quicklinks'];

const settingKeyFor = (value) => {
  switch (value) {
    case 'quicklinks':
      return 'quicklinksenabled';
    case 'weather':
      return 'weatherEnabled';
    case 'quickweather':
      return 'quickWeatherEnabled';
    case 'mail':
      return 'googleMailEnabled';
    case 'calendar':
      return 'googleCalendarEnabled';
    case 'tasks':
      return 'googleTasksEnabled';
    default:
      return value;
  }
};

const SortableItem = ({ id, enabled, onToggle }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li ref={setNodeRef} style={style} {...attributes} className="sortableItem">
      <input
        type="checkbox"
        checked={enabled}
        onChange={() => onToggle(id)}
        style={{ marginRight: '8px' }}
      />
      <span style={{ flex: 1 }}>{widget_name[id]}</span>
      <span className="dragHandle" {...listeners}>
        <MdOutlineDragIndicator />
      </span>
    </li>
  );
};

const Overview = () => {
  const [items, setItems] = useState(
    () => {
      const stored = JSON.parse(localStorage.getItem('order'));
      let base = stored || DEFAULT_ORDER;
      base = base.map((x) => (x === 'weatherline' ? 'quickweather' : x));
      base = base.filter((x, i, a) => KNOWN_WIDGETS.includes(x) && a.indexOf(x) === i);
      if (!base.includes('quickweather') && base.includes('weather')) {
        base.splice(base.indexOf('weather') + 1, 0, 'quickweather');
      }
      KNOWN_WIDGETS.forEach((widget) => {
        if (!base.includes(widget)) base.push(widget);
      });
      return base;
    },
  );
  const [enabledState, setEnabledState] = useState(() => ({
    time: localStorage.getItem('time') === 'true',
    date: localStorage.getItem('date') === 'true',
    quicklinks: localStorage.getItem('quicklinksenabled') === 'true',
    weatherEnabled: localStorage.getItem('weatherEnabled') === 'true',
    googleMailEnabled: localStorage.getItem('googleMailEnabled') === 'true',
    googleCalendarEnabled: localStorage.getItem('googleCalendarEnabled') === 'true',
    googleTasksEnabled: localStorage.getItem('googleTasksEnabled') === 'true',
  }));
  const [news, setNews] = useState({
    title: '',
    date: '',
    description: '',
    link: '',
    linkText: '',
  });
  const [newsDone, setNewsDone] = useState(false);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleEnabled = (value) => {
    const key = settingKeyFor(value);
    const current = localStorage.getItem(key) === 'true';
    localStorage.setItem(key, String(!current));
    setEnabledState((prev) => ({ ...prev, [key]: !current }));
    variables.stats.postEvent('setting', 'Widget toggle');
    EventBus.emit('refresh', 'widgets');
  };

  const isEnabled = (value) => {
    const key = settingKeyFor(value);
    if (key === 'quickWeatherEnabled' && localStorage.getItem(key) === null) return true;
    return enabledState[key] ?? (localStorage.getItem(key) === 'true');
  };

  const reset = () => {
    localStorage.setItem('order', JSON.stringify(DEFAULT_ORDER));
    setItems(DEFAULT_ORDER);
    toast(variables.getMessage('toasts.reset'));
  };

  const getTab = (value) => {
    switch (value) {
      case 'time':
        return <Clock />;
      case 'weather':
        return <Weather />;
      case 'quickweather':
        return <QuickWeather />;
      case 'quicklinks':
        return <QuickLinks />;
      case 'date':
        return <Date />;
      case 'mail':
      case 'calendar':
      case 'tasks':
        // These three talk to Google, so the preview draws their shape instead of
        // cloning live data into the settings panel. The order list already names
        // the widget, so a name here would only repeat it.
        return <GoogleWidget type={value} label={widget_name[value]} />;
      default:
        return null;
    }
  };

  const getNews = useCallback(async () => {
    try {
      const response = await fetch(`${variables.constants.API_URL}/news`);
      const data = await response.json();
      data.date = new window.Date(data.date).toLocaleDateString(
        variables.languagecode.replace('_', '-'),
        { year: 'numeric', month: 'long', day: 'numeric' },
      );
      setNews(data);
      setNewsDone(true);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getNews();
  }, [getNews]);

  useEffect(() => {
    localStorage.setItem('order', JSON.stringify(items));
    variables.stats.postEvent('setting', 'Widget order');
    EventBus.emit('refresh', 'widgets');
  }, [items]);

  return (
    <>
      <span className="mainTitle">
        {variables.getMessage('modals.main.marketplace.product.overview')}
      </span>
      <div className="overviewGrid">
        <div>
          <span className="title">{variables.getMessage('modals.welcome.buttons.preview')}</span>
          <div className="tabPreview">
            <div className="previewItem" style={{ maxWidth: '50%' }}>
              {items.map((value, index) => {
                if (!isEnabled(value)) {
                  return null;
                }
                return (
                  <div className="previewItem" key={`item-${value}`}>
                    {getTab(value)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div>
          <span className="title">
            {variables.getMessage('modals.main.settings.sections.order.title')}
          </span>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              <ul className="sortableContainer">
                {items.map((value) => (
                  <SortableItem
                    key={value}
                    id={value}
                    enabled={isEnabled(value)}
                    onToggle={toggleEnabled}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </>
  );
};

export { Overview as default, Overview };
