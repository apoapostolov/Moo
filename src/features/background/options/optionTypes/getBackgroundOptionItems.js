import variables from 'config/variables';

export const API_BACKGROUND_TYPES = ['api', 'api_mue', 'api_unsplash', 'api_coverr'];

export function isApiBackgroundType(type) {
  return API_BACKGROUND_TYPES.includes(type);
}

/**
 * Derives which image API a background type maps to.
 */
export function getApiForBackgroundType(type) {
  if (type === 'api_unsplash') return 'unsplash';
  if (type === 'api_mue') return 'mue';
  if (type === 'api_coverr') return 'coverr';
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
      value: 'api_mue',
      text: variables.getMessage('modals.main.settings.sections.background.type.mue_library'),
    },
    {
      value: 'api_coverr',
      text: variables.getMessage('modals.main.settings.sections.background.type.coverr'),
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