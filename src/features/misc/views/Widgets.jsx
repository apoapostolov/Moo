import { useState, useEffect, Fragment, Suspense, lazy, useMemo } from 'react';

import Clock from '../../time/Clock';
import QuickLinks from '../../quicklinks/QuickLinks';
import Date from '../../time/Date';
import AIAsk from '../../aiask/AIAsk';
import { WidgetsLayout } from 'components/Layout';
import { readOrder, readPlacement, groupByZone, isWidgetEnabled } from 'utils/widgets';

import EventBus from 'utils/eventbus';

// weather is lazy loaded due to the size of the weather icons module
// since we're using react-icons this might not be accurate,
// however, when we used the original module https://bundlephobia.com/package/weather-icons-react@1.2.0
// as seen here it is ridiculously large
const Weather = lazy(() => import('../../weather/Weather'));
const QuickWeather = lazy(() => import('../../weather/QuickWeather'));
const GoogleMail = lazy(() => import('../../google/GoogleMail'));
const GoogleCalendar = lazy(() => import('../../google/GoogleCalendar'));
const GoogleTasks = lazy(() => import('../../google/GoogleTasks'));
const PhotoInfoWidget = lazy(() => import('../../background/components/PhotoInfoWidget'));

/**
 * The page is three zones: a rail down each side and the middle column the
 * widgets have always used. Which zone a widget sits in is the user's choice in
 * Overview; all this does is draw each one where it was put.
 */
const Widgets = () => {
  const online = localStorage.getItem('offlineMode') === 'false';
  const [layout, setLayout] = useState(() => ({
    order: readOrder(),
    placement: readPlacement(),
  }));
  const [welcome, setWelcome] = useState(localStorage.getItem('showWelcome'));

  const enabled = (id) => isWidgetEnabled(id);

  // widgets we can re-order, by id
  const widgets = useMemo(
    () => ({
      time: enabled('time') && <Clock />,
      date: enabled('date') && <Date />,
      quicklinks: enabled('quicklinks') && online ? <QuickLinks /> : null,
      aiask: enabled('aiask') ? <AIAsk /> : null,
      weather: enabled('weather') && online ? <Weather /> : null,
      quickweather: enabled('quickweather') && online ? <QuickWeather /> : null,
      mail: enabled('mail') ? <GoogleMail /> : null,
      calendar: enabled('calendar') ? <GoogleCalendar /> : null,
      tasks: enabled('tasks') ? <GoogleTasks /> : null,
      photoinfo: enabled('photoinfo') ? <PhotoInfoWidget /> : null,
    }),
    [layout], // Re-create widgets when the order or placement changes
  );

  useEffect(() => {
    const handleRefresh = (data) => {
      switch (data) {
        case 'widgets':
          return setLayout({ order: readOrder(), placement: readPlacement() });
        case 'widgetsWelcome':
          setWelcome(localStorage.getItem('showWelcome'));
          localStorage.setItem('showWelcome', true);
          window.onbeforeunload = () => {
            localStorage.clear();
          };
          break;
        case 'widgetsWelcomeDone':
          setWelcome(localStorage.getItem('showWelcome'));
          window.onbeforeunload = null;
          break;
        default:
          break;
      }
    };

    EventBus.on('refresh', handleRefresh);
    return () => {
      EventBus.off('refresh', handleRefresh);
    };
  }, []);

  const groups = groupByZone(layout.order, layout.placement);

  const draw = (ids) =>
    ids.map((id) => {
      const widget = widgets[id];

      if (!widget) return null;

      return <Fragment key={id}>{widget}</Fragment>;
    });

  // don't show when welcome is there
  return welcome !== 'false' ? (
    <WidgetsLayout />
  ) : (
    <Suspense fallback={<></>}>
      <div className="widgetRail widgetRail-left">{draw(groups.left)}</div>
      <WidgetsLayout>{draw(groups.center)}</WidgetsLayout>
      <div className="widgetRail widgetRail-right">{draw(groups.right)}</div>
    </Suspense>
  );
};

export { Widgets as default, Widgets };
