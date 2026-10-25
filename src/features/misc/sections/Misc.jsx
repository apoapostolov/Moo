import variables from 'config/variables';

import { Switch } from 'components/Form/Settings';
import { Header, Row, Content, Action } from 'components/Layout/Settings';

/**
 * Everything that is not a widget of its own. Scratch notes live here because
 * they are a way of using the page rather than a thing on it.
 */
const MiscOptions = () => {
  const MISC_SECTION = 'modals.main.settings.sections.misc';

  return (
    <>
      <Header title={variables.getMessage(`${MISC_SECTION}.title`)} />
      <Row final={true}>
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
    </>
  );
};

export { MiscOptions as default, MiscOptions };
