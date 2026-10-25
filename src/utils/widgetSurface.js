/**
 * Panels (the clock, weather, quick links and the photo information card) share
 * the `%basic` surface: a black panel you can just see through. Glass is the
 * alternative the Google widgets use, where the wallpaper shows through a much
 * lighter scrim, so each of these sections gets its own switch.
 *
 * The value is stored per widget, not globally, because the weather panel over a
 * bright sky and an information card over a dark photo want different answers.
 */
const SURFACE_SETTINGS = {
  time: 'surfaceTime',
  weather: 'surfaceWeather',
  quicklinks: 'surfaceQuicklinks',
  background: 'surfaceBackground',
};

function getSurface(setting) {
  return localStorage.getItem(SURFACE_SETTINGS[setting] || setting) === 'glass'
    ? 'glassSurface'
    : '';
}

export { SURFACE_SETTINGS, getSurface };
