import variables from 'config/variables';

export const API_BACKGROUND_TYPES = [
  'api',
  'api_mue',
  'api_unsplash',
  'api_coverr',
  'api_live',
  'api_pixabay',
  'api_pexels',
];

export function isApiBackgroundType(type) {
  return API_BACKGROUND_TYPES.includes(type);
}

/**
 * Derives which image or video API a background type maps to.
 */
export function getApiForBackgroundType(type) {
  if (type === 'api_unsplash') return 'unsplash';
  if (type === 'api_mue') return 'mue';
  if (type === 'api_coverr') return 'coverr';
  if (type === 'api_live') return 'live';
  if (type === 'api_pixabay') return 'pixabay';
  if (type === 'api_pexels') return 'pexels';
  return localStorage.getItem('backgroundAPI') === 'mue' ? 'mue' : 'unsplash';
}

/**
 * Normalises the legacy `api` type into its explicit Mue/Unsplash variant.
 */
export function normalizeBackgroundType(type) {
  if (type !== 'api') return type;
  return getApiForBackgroundType('api') === 'unsplash' ? 'api_unsplash' : 'api_mue';
}

export function getBackgroundOptionItems(marketplaceEnabled) {
  // Unsplash is the default, Coverr follows it as the keyless video source, and
  // the rest of the services are ordered by monthly visits: Pixabay, then
  // Pexels. The Mue library is our own source, so it closes the service list.
  return [
    marketplaceEnabled && {
      value: 'photo_pack',
      text: variables.getMessage('modals.main.marketplace.title'),
    },
    {
      value: 'api_unsplash',
      text: variables.getMessage('modals.main.settings.sections.background.type.unsplash'),
    },
    {
      value: 'api_coverr',
      text: variables.getMessage('modals.main.settings.sections.background.type.coverr'),
    },
    {
      value: 'api_live',
      text: variables.getMessage('modals.main.settings.sections.background.type.live'),
    },
    {
      value: 'api_pixabay',
      text: variables.getMessage('modals.main.settings.sections.background.type.pixabay'),
    },
    {
      value: 'api_pexels',
      text: variables.getMessage('modals.main.settings.sections.background.type.pexels'),
    },
    {
      value: 'api_mue',
      text: variables.getMessage('modals.main.settings.sections.background.type.mue_library'),
    },
    {
      value: 'custom',
      text: variables.getMessage('modals.main.settings.sections.background.type.custom_image'),
    },
    {
      value: 'colour',
      text: variables.getMessage('modals.main.settings.sections.background.type.custom_colour'),
    },
    {
      value: 'random_colour',
      text: variables.getMessage('modals.main.settings.sections.background.type.random_colour'),
    },
    {
      value: 'random_gradient',
      text: variables.getMessage('modals.main.settings.sections.background.type.random_gradient'),
    },
  ];
}