import variables from 'config/variables';

import { Dropdown } from 'components/Form/Settings';
import { Row, Content, Action } from 'components/Layout/Settings/Item';

const SECTION = 'modals.main.settings.surface';

/**
 * The panel style switch. Sections that hold a widget pass their own setting
 * name and refresh category, so changing the style repaints that widget only.
 * A `title` override lets one section carry a row per widget, where repeating
 * the shared "Panel style" heading three times would read as a glitch.
 */
function WidgetSurface({ setting, category = 'all', title, subtitle, final }) {
  return (
    <Row final={final}>
      <Content
        title={title ?? variables.getMessage(`${SECTION}.title`)}
        subtitle={subtitle ?? variables.getMessage(`${SECTION}.subtitle`)}
      />
      <Action>
        <Dropdown
          name={setting}
          category={category}
          items={[
            { value: 'classic', text: variables.getMessage(`${SECTION}.classic`) },
            { value: 'glass', text: variables.getMessage(`${SECTION}.glass`) },
          ]}
        />
      </Action>
    </Row>
  );
}

export { WidgetSurface as default, WidgetSurface };
