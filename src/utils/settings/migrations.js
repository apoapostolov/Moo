/**
 * One-off repairs to a profile that an older build set up. They run before the
 * first render, so no component can mount holding a value that is about to
 * change underneath it.
 */

// Only Show on Hover used to be on by default. A profile set up under that
// default still carries it, so the stored value is dropped once and the new
// default takes over. After the mark is written the checkbox is the only thing
// that decides, so a later choice is never overridden.
const HOVER_MARK = 'navbarHoverDefaultOff';

// The Mue library is no longer offered as an image source. A profile pointed at
// it is moved to Unsplash in both places it is recorded: the type the settings
// read and the API key the loader asks. Any queued image goes with it, so the
// page cannot show one last library picture from the prefetch.
const retireMueLibrary = () => {
  const type = localStorage.getItem('backgroundType');
  const api = localStorage.getItem('backgroundAPI');

  if (type !== 'api_mue' && type !== 'api' && api !== 'mue') return;

  if (type === 'api_mue' || type === 'api') localStorage.setItem('backgroundType', 'api_unsplash');
  if (api === 'mue') localStorage.setItem('backgroundAPI', 'unsplash');

  localStorage.removeItem('imageQueue');
};

/**
 * A switch that defaults to on has to be written down once, or the control shows
 * itself unticked while the clock already behaves as if it were ticked. Only a
 * missing value is filled in, so a choice made later is never overridden.
 */
const seedPercentageFallback = () => {
  if (localStorage.getItem('percentageFallback') === null) {
    localStorage.setItem('percentageFallback', 'true');
  }
};

/**
 * The same trap as the Progress switch: Image Info refuses to draw unless the
 * photo has a known location, and a profile that predates the control has no
 * stored answer for it, so the checkbox would read unticked while the card
 * already obeyed it.
 */
const seedPhotoInfoLocation = () => {
  if (localStorage.getItem('photoInfoRequiresLocation') === null) {
    localStorage.setItem('photoInfoRequiresLocation', 'true');
  }
};

const runMigrations = () => {
  retireMueLibrary();
  seedPercentageFallback();
  seedPhotoInfoLocation();

  if (!localStorage.getItem(HOVER_MARK)) {
    if (localStorage.getItem('navbarHover') === 'true') localStorage.removeItem('navbarHover');

    localStorage.setItem(HOVER_MARK, 'true');
  }
};

export default runMigrations;
