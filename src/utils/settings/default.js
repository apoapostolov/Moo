import defaultSettings from 'utils/data/default_settings.json';

/**
 * It sets the default settings for the extension
 * @param reset - boolean
 */
export function setDefaultSettings(reset) {
  localStorage.clear();
  defaultSettings.forEach((element) => localStorage.setItem(element.name, element.value));

  if (reset) {
    localStorage.setItem('showWelcome', false);
  }

  // finally we set this to true so it doesn't run the function on every load
  localStorage.setItem('firstRun', true);
}
