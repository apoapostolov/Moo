import variables from 'config/variables';
import { Dropdown, Text, ChipSelect } from 'components/Form/Settings';
import { Row, Content, Action } from 'components/Layout/Settings/Item';
import { APIQualityOptions } from '../optionTypes';

const clearImageQueue = () => localStorage.removeItem('imageQueue');

const loadingItems = [
  { value: 'loading', text: variables.getMessage('modals.main.loading') },
  { value: 'loading', text: variables.getMessage('modals.main.loading') },
];

const APISettings = ({ backgroundAPI, backgroundCategories, unsplashTopics }) => {
  const loading = backgroundCategories[0] === variables.getMessage('modals.main.loading');

  const categoriesControl = (options) =>
    loading ? (
      <Dropdown
        label={variables.getMessage('modals.main.settings.sections.background.category')}
        name="apiCategories"
        items={loadingItems}
      />
    ) : (
      <ChipSelect
        key="apiCategories"
        label={variables.getMessage('modals.main.settings.sections.background.categories')}
        options={options}
        name="apiCategories"
        onChange={clearImageQueue}
      />
    );

  // Unsplash topics replace the four fixed collections the categories mapped to.
  const topicsControl = Array.isArray(unsplashTopics) ? (
    <ChipSelect
      key="unsplashTopics"
      label={variables.getMessage('modals.main.settings.sections.background.unsplash.topics')}
      options={unsplashTopics}
      name="unsplashTopics"
      storageKey="unsplashTopics"
      onChange={clearImageQueue}
    />
  ) : (
    <Dropdown
      label={variables.getMessage('modals.main.settings.sections.background.unsplash.topics')}
      name="unsplashTopics"
      items={loadingItems}
    />
  );

  const qualityControl = (
    <Dropdown
      label={variables.getMessage('modals.main.settings.sections.background.source.quality.title')}
      name="apiQuality"
      element=".other"
      items={APIQualityOptions}
      onChange={clearImageQueue}
    />
  );

  if (backgroundAPI === 'unsplash') {
    return (
      <Row final={true}>
        <Content
          title={variables.getMessage(
            'modals.main.settings.sections.background.unsplash.section_title',
          )}
          subtitle={variables.getMessage(
            'modals.main.settings.sections.background.unsplash.section_subtitle',
          )}
        />
        <Action>
          {topicsControl}
          <Text
            title={variables.getMessage('modals.main.settings.sections.background.unsplash.id')}
            subtitle={variables.getMessage(
              'modals.main.settings.sections.background.unsplash.id_subtitle',
            )}
            placeholder="e.g. 123456, 654321"
            name="unsplashCollections"
            category="background"
            element="#backgroundImage"
            onChange={clearImageQueue}
          />
          {qualityControl}
        </Action>
      </Row>
    );
  }

  return (
    <Row final={true}>
      <Content
        title={variables.getMessage(
          'modals.main.settings.sections.background.mue_library.title',
        )}
        subtitle={variables.getMessage(
          'modals.main.settings.sections.background.mue_library.subtitle',
        )}
      />
      <Action>
        {categoriesControl(backgroundCategories)}
        {qualityControl}
      </Action>
    </Row>
  );
};

export default APISettings;