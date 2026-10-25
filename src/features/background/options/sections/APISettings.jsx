import variables from 'config/variables';
import { Dropdown, Text, ChipSelect } from 'components/Form/Settings';
import { Row, Content, Action } from 'components/Layout/Settings/Item';
import { APIQualityOptions } from '../optionTypes';

const clearImageQueue = () => localStorage.removeItem('imageQueue');

const APISettings = ({ backgroundAPI, backgroundCategories }) => {
  const loading = backgroundCategories[0] === variables.getMessage('modals.main.loading');

  // Mue returns categories with image counts; Unsplash has no counts to show.
  const unsplashCategories = backgroundCategories.map((category) => {
    const copy = { ...category };
    delete copy.count;
    return copy;
  });

  const categoriesControl = (options) =>
    loading ? (
      <Dropdown
        label={variables.getMessage('modals.main.settings.sections.background.category')}
        name="apiCategories"
        items={[
          { value: 'loading', text: variables.getMessage('modals.main.loading') },
          { value: 'loading', text: variables.getMessage('modals.main.loading') },
        ]}
      />
    ) : (
      <ChipSelect
        label={variables.getMessage('modals.main.settings.sections.background.categories')}
        options={options}
        name="apiCategories"
        onChange={clearImageQueue}
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
          {categoriesControl(unsplashCategories)}
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