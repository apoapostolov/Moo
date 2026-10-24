import { useState, useEffect, Fragment, Suspense, lazy, useMemo } from 'react';

import Clock from '../../time/Clock';
import QuickLinks from '../../quicklinks/QuickLinks';
import Date from '../../time/Date';
import { WidgetsLayout } from 'components/Layout';

import EventBus from 'utils/eventbus';

// weather is lazy loaded due to the size of the weather icons module
// since we're using react-icons this might not be accurate,
// however, when we used the original module https://bundlephobia.com/package/weather-icons-react@1.2.0
// as seen here it is ridiculously large
const Weather = lazy(() => import('../../weather/Weather'));

const Widgets = () => {
  const online = localStorage.getItem('offlineMode') === 'false';
  const [order, setOrder] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('order'));
    const base = stored || [
      'time',
      'weather',
      'date',
      'quickweather',
      'quicklinks',
    ];
    if (!base.includes('quickweather')) {
      base.splice(Math.min(2, base.length), 0, 'quickweather');
    }
    return base;
  });
  const [welcome, setWelcome] = useState(localStorage.getItem('showWelcome'));

  const enabled = (key) => {
    return localStorage.getItem(key) === 'true';
  };

  // widgets we can re-order
  const widgets = useMemo(
    () => ({
      time: enabled('time') && (
        <>
          <Clock />
          {enabled('weatherEnabled') && online ? <Weather compact /> : null}
        </>
      ),
      date: enabled('date') && <Date />,
      quicklinks: enabled('quicklinksenabled') && online ? <QuickLinks /> : null,
      weather: enabled('weatherEnabled') && online ? <Weather /> : null,
      quickweather: enabled('weatherEnabled') && online ? <Weather compact /> : null,
    }),
    [order], // Re-create widgets when order changes
  );

  useEffect(() => {
    const handleRefresh = (data) => {
      switch (data) {
        case 'widgets':
          return setOrder(JSON.parse(localStorage.getItem('order')));
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
      EventBus.off('refresh');
    };
  }, []);

  // don't show when welcome is there
  return welcome !== 'false' ? (
    <WidgetsLayout />
  ) : (
    <WidgetsLayout>
      <Suspense fallback={<></>}>
        {order.map((element, key) => {
          const widget = widgets[element];
          if (!widget) return null;
          return <Fragment key={key}>{widget}</Fragment>;
        })}
        {enabled('weatherEnabled') && online ? <Weather /> : null}
      </Suspense>
    </WidgetsLayout>
  );
};

export { Widgets as default, Widgets };
