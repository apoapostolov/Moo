import variables from 'config/variables';

import { Switch } from 'components/Form/Settings';
import { Header, Row, Content, Action, Group } from 'components/Layout/Settings';

// The same shape the Google page uses for a labelled group inside a page.
const Section = ({ title, subtitle }) => (
  <Row>
    <Content title={title} subtitle={subtitle} />
  </Row>
);

/**
 * Everything that is not a widget of its own. Scratch notes and pictures live
 * here because they are a way of using the page rather than a thing on it; the
 * signature colour belongs to Appearance, next to the theme it tints.
 */
const MiscOptions = () => {
  const MISC_SECTION = 'modals.main.settings.sections.misc';

  return (
    <>
      <Header title={variables.getMessage(`${MISC_SECTION}.title`)} />

      <Group>
        <Section
          title={variables.getMessage(`${MISC_SECTION}.scratch.title`)}
          subtitle={variables.getMessage(`${MISC_SECTION}.scratch.subtitle`)}
        />
        <Row>
          <Content
            title={variables.getMessage(`${MISC_SECTION}.scratch_notes.title`)}
            subtitle={variables.getMessage(`${MISC_SECTION}.scratch_notes.subtitle`)}
          />
          <Action>
            <Switch
              name="scratchNotes"
              category="other"
              text={variables.getMessage('modals.main.settings.enabled')}
            />
          </Action>
        </Row>

        <Row>
          <Content
            title={variables.getMessage(`${MISC_SECTION}.scratch_images.title`)}
            subtitle={variables.getMessage(`${MISC_SECTION}.scratch_images.subtitle`)}
          />
          <Action>
            <Switch
              name="scratchImages"
              category="other"
              text={variables.getMessage('modals.main.settings.enabled')}
            />
          </Action>
        </Row>
      </Group>
    </>
  );
};

export { MiscOptions as default, MiscOptions };
