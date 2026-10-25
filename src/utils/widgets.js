import variables from 'config/variables';

/**
 * Every widget the page can show, in one list. The settings panel and the page
 * both read it, so a widget cannot be offered in one place and be missing from
 * the other.
 *
 * `zone` is where the widget sits in the new tab page when the profile has not
 * said otherwise: the two cards that used to be pinned to the corners keep
 * their corners, and everything else stays in the middle column.
 */
export const WIDGETS = [
  {
    id: 'time',
    label: () => variables.getMessage('modals.main.settings.sections.time.title'),
    setting: 'time',
    fullWidth: true,
  },
  {
    // The full card, not the one-line reading. Named so the two weather widgets
    // are told apart in the order list.
    id: 'weather',
    label: () => 'Weather Full',
    setting: 'weatherEnabled',
    zone: 'right',
  },
  {
    id: 'date',
    label: () => variables.getMessage('modals.main.settings.sections.date.title'),
    setting: 'date',
    fullWidth: true,
  },
  {
    id: 'quickweather',
    label: () => 'Weather Now',
    setting: 'quickWeatherEnabled',
    onByDefault: true,
    fullWidth: true,
  },
  {
    // The query line: a question typed on the new tab page goes to an AI
    // service, Google's AI Mode by default.
    id: 'aiask',
    label: () => 'AI Ask',
    setting: 'aiAskEnabled',
    onByDefault: true,
    fullWidth: true,
  },
  {
    id: 'quicklinks',
    label: () => variables.getMessage('modals.main.settings.sections.quicklinks.title'),
    setting: 'quicklinksenabled',
  },
  {
    id: 'mail',
    label: () => 'Mail',
    setting: 'googleMailEnabled',
  },
  {
    id: 'calendar',
    label: () => 'Calendar',
    setting: 'googleCalendarEnabled',
  },
  {
    id: 'tasks',
    label: () => 'Tasks',
    setting: 'googleTasksEnabled',
  },
  {
    // The photographer credit card the background used to pin to its own corner.
    // It shares the Display setting that has always shown and hidden it.
    id: 'photoinfo',
    label: () => 'Image Info',
    setting: 'photoInformation',
    zone: 'left',
  },
];

export const ZONES = ['left', 'center', 'right'];

export const WIDGET_IDS = WIDGETS.map((widget) => widget.id);

export const DEFAULT_ORDER = ['time', 'weather', 'date', 'quickweather', 'quicklinks', 'aiask'];

export const widgetById = (id) => WIDGETS.find((widget) => widget.id === id);

/**
 * The clock, the date, the one-line weather and the query line are lines of the
 * page rather than cards on it: they read across the whole middle column and are
 * never put in one of its halves. Only cards are arranged in two columns.
 */
export const isFullWidth = (id) => Boolean(widgetById(id)?.fullWidth);

const defaultZone = (widget) => widget.zone || 'center';

/**
 * The order a profile should be read at: legacy names repaired, unknown entries
 * dropped, and every widget known to this build present so it can be switched
 * on from Overview.
 */
export function readOrder() {
  let stored = null;

  try {
    stored = JSON.parse(localStorage.getItem('order'));
  } catch {
    stored = null;
  }

  let base = Array.isArray(stored) ? stored : DEFAULT_ORDER;

  base = base.map((id) => (id === 'weatherline' ? 'quickweather' : id));
  base = base.filter((id, index, all) => WIDGET_IDS.includes(id) && all.indexOf(id) === index);

  if (!base.includes('quickweather') && base.includes('weather')) {
    base.splice(base.indexOf('weather') + 1, 0, 'quickweather');
  }

  WIDGET_IDS.forEach((id) => {
    if (!base.includes(id)) base.push(id);
  });

  return base;
}

export function saveOrder(order) {
  localStorage.setItem('order', JSON.stringify(order));
}

/**
 * Which zone each widget sits in. A profile with no stored placement keeps the
 * corners it has always used, so nothing moves on upgrade.
 */
export function readPlacement() {
  let stored = {};

  try {
    stored = JSON.parse(localStorage.getItem('widgetPlacement')) || {};
  } catch {
    stored = {};
  }

  const placement = {};

  WIDGETS.forEach((widget) => {
    const zone = stored[widget.id];

    placement[widget.id] = ZONES.includes(zone) ? zone : defaultZone(widget);
  });

  return placement;
}

export function savePlacement(placement) {
  localStorage.setItem('widgetPlacement', JSON.stringify(placement));
}

/**
 * The order split into the three zones, each keeping the widget order within it.
 */
export function groupByZone(order, placement) {
  const groups = { left: [], center: [], right: [] };

  order.forEach((id) => {
    const zone = placement[id] || 'center';

    (groups[zone] || groups.center).push(id);
  });

  return groups;
}

export function placementFromGroups(groups) {
  const placement = {};

  ZONES.forEach((zone) => {
    groups[zone].forEach((id) => {
      placement[id] = zone;
    });
  });

  return placement;
}

/**
 * The middle column can be split in two. The second column is stored as the list
 * of widgets that sit in it; everything else in the centre stays in the first,
 * so a profile that has never split the column stores nothing and the page
 * draws a single column exactly as it always has.
 */
export function readSecondLane() {
  try {
    const stored = JSON.parse(localStorage.getItem('widgetSecondLane'));

    return Array.isArray(stored) ? stored.filter((id) => WIDGET_IDS.includes(id)) : [];
  } catch {
    return [];
  }
}

export function saveSecondLane(ids) {
  localStorage.setItem('widgetSecondLane', JSON.stringify(ids));
}

/**
 * A widget with no stored value takes its own default: Weather Now is on for
 * everyone, and the rest are off until switched on.
 */
export function isWidgetEnabled(id) {
  const widget = widgetById(id);

  if (!widget) return false;

  const stored = localStorage.getItem(widget.setting);

  if (stored === null) return Boolean(widget.onByDefault);

  return stored === 'true';
}
