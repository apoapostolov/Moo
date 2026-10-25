import variables from 'config/variables';

// `api_mue` and the bare legacy `api` are still recognised so an older profile
// keeps its image settings panel, but neither reaches the Mue library any more:
// both are answered by Unsplash.
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
  if (type === 'api_coverr') return 'coverr';
  if (type === 'api_live') return 'live';
  if (type === 'api_pixabay') return 'pixabay';
  if (type === 'api_pexels') return 'pexels';
  // Unsplash is the only image source now, and it answers every remaining case.
  return 'unsplash';
}

/**
 * Normalises the legacy `api` type into its explicit Mue/Unsplash variant.
 */
export function normalizeBackgroundType(type) {
  if (type !== 'api' && type !== 'api_mue') return type;
  return 'api_unsplash';
}

export function getBackgroundOptionItems(marketplaceEnabled) {
  // Unsplash is the default, Coverr follows it as the keyless video source, and
  // the rest of the services are ordered by monthly visits: Pixabay, then
  // Pexels.
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