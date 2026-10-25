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

const runMigrations = () => {
  if (!localStorage.getItem(HOVER_MARK)) {
    if (localStorage.getItem('navbarHover') === 'true') localStorage.removeItem('navbarHover');

    localStorage.setItem(HOVER_MARK, 'true');
  }
};

export default runMigrations;
