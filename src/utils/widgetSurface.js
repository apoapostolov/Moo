/**
 * Panels (weather, quick links and the photo information card) share the
 * `%basic` surface: a black panel you can just see through. Glass lets the
 * wallpaper show through a much lighter scrim instead, so each section carries
 * its own switch.
 *
 * The value is stored per widget, not globally, because the weather panel over a
 * bright sky and an information card over a dark photo want different answers.
 *
 * The clock is not in this list on purpose: it draws straight onto the
 * wallpaper, so there is no panel to paint.
 */
const SURFACE_SETTINGS = {
  weather: 'surfaceWeather',
  quicklinks: 'surfaceQuicklinks',
  background: 'surfaceBackground',
  mail: 'surfaceMail',
  calendar: 'surfaceCalendar',
  tasks: 'surfaceTasks',
};

function getSurface(setting) {
  return localStorage.getItem(SURFACE_SETTINGS[setting] || setting) === 'glass'
    ? 'glassSurface'
    : '';
}

export { SURFACE_SETTINGS, getSurface };
