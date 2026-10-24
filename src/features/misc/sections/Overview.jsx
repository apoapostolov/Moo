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
import Message from './overview_skeletons/Message';
import Weather from './overview_skeletons/Weather';

import EventBus from 'utils/eventbus';

const widget_name = {
  time: variables.getMessage('modals.main.settings.sections.time.title'),
  weather: variables.getMessage('modals.main.settings.sections.weather.title'),
  weatherline: variables.getMessage('modals.main.settings.sections.weather.title') + ' (1 line)',
  quicklinks: variables.getMessage('modals.main.settings.sections.quicklinks.title'),
  date: variables.getMessage('modals.main.settings.sections.date.title'),
  message: variables.getMessage('modals.main.settings.sections.message.title'),
};

const settingKeyFor = (value) => {
  switch (value) {
    case 'quicklinks':
      return 'quicklinksenabled';
    case 'weather':
    case 'weatherline':
      return 'weatherEnabled';
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
      {widget_name[id]}
      <span {...listeners} style={{ marginLeft: 'auto', cursor: 'grab' }}>
        <MdOutlineDragIndicator />
      </span>
    </li>
  );
};

const Overview = () => {
  const [items, setItems] = useState(
    () =>
      JSON.parse(localStorage.getItem('order')) || [
        'time',
        'weather',
        'date',
        'quicklinks',
        'message',
      ],
  );
  const [enabledState, setEnabledState] = useState(() => ({
    time: localStorage.getItem('time') === 'true',
    date: localStorage.getItem('date') === 'true',
    quicklinks: localStorage.getItem('quicklinksenabled') === 'true',
    message: localStorage.getItem('message') === 'true',
    weatherEnabled: localStorage.getItem('weatherEnabled') === 'true',
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
    return enabledState[key] ?? (localStorage.getItem(key) === 'true');
  };

  const reset = () => {
    const defaultOrder = ['time', 'weather', 'date', 'quicklinks', 'message'];
    localStorage.setItem('order', JSON.stringify(defaultOrder));
    setItems(defaultOrder);
    toast(variables.getMessage('toasts.reset'));
  };

  const getTab = (value) => {
    switch (value) {
      case 'time':
        return <Clock />;
      case 'weather':
        return <Weather />;
      case 'weatherline':
        return <Weather />;
      case 'quicklinks':
        return <QuickLinks />;
      case 'date':
        return <Date />;
      case 'message':
        return <Message />;
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
