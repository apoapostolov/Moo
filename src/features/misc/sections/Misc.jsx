import { useCallback, useEffect, useState } from 'react';

import variables from 'config/variables';
import EventBus from 'utils/eventbus';

import { Switch } from 'components/Form/Settings';
import { Header, Row, Content, Action, Group } from 'components/Layout/Settings';

import {
  SIGNATURE_PRESETS as PRESETS,
  readSignature,
  setSignature,
  sampleBackgroundSignature,
} from '../signature';

import './Misc.scss';

// The same shape the Google page uses for a labelled group inside a page.
const Section = ({ title, subtitle }) => (
  <Row>
    <Content title={title} subtitle={subtitle} />
  </Row>
);

/**
 * Everything that is not a widget of its own. Scratch notes and images live
 * here because they are a way of using the page rather than a thing on it, and
 * the signature colour lives here because it is about the mod, not a widget.
 */
const MiscOptions = () => {
  const MISC_SECTION = 'modals.main.settings.sections.misc';
  const [colour, setColour] = useState(readSignature);
  const [trouble, setTrouble] = useState('');
  const [sampling, setSampling] = useState(false);

  useEffect(() => {
    const reread = () => setColour(readSignature());

    EventBus.on('refresh', reread);

    return () => EventBus.off('refresh', reread);
  }, []);

  const choose = useCallback((hex) => {
    setTrouble('');
    setSignature(hex);
    setColour(hex);
  }, []);

  const takeFromBackground = useCallback(async () => {
    setTrouble('');
    setSampling(true);

    try {
      choose(await sampleBackgroundSignature());
    } catch (sampleError) {
      setTrouble(sampleError.message);
    } finally {
      setSampling(false);
    }
  }, [choose]);

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

      <Group>
        <Section
          title={variables.getMessage(`${MISC_SECTION}.signature.title`)}
          subtitle={variables.getMessage(`${MISC_SECTION}.signature.subtitle`)}
        />
        <Row>
          <Content
            title={variables.getMessage(`${MISC_SECTION}.signature.colour.title`)}
            subtitle={trouble || variables.getMessage(`${MISC_SECTION}.signature.colour.subtitle`)}
          />
          <Action>
            <div className="signaturePicker">
              {PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={`signatureSwatch${colour.toLowerCase() === preset.value ? ' active' : ''}`}
                  style={{ '--swatch': preset.value }}
                  title={preset.name}
                  aria-label={preset.name}
                  onClick={() => choose(preset.value)}
                />
              ))}
              <label className="signatureCustom" title="Any colour you like">
                <input
                  type="color"
                  value={colour}
                  aria-label="Pick any colour"
                  onChange={(event) => choose(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="signatureSample"
                disabled={sampling}
                onClick={takeFromBackground}
              >
                {sampling ? 'Reading…' : 'From the background'}
              </button>
            </div>
          </Action>
        </Row>
      </Group>
    </>
  );
};

export { MiscOptions as default, MiscOptions };
