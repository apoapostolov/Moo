import variables from 'config/variables';

import { useState, memo } from 'react';
import { MdAddLink, MdClose } from 'react-icons/md';
import { Tooltip } from 'components/Elements';
import { Button } from 'components/Elements';

/**
 * Add and edit a quick link. The fields carry their own labels rather than
 * relying on placeholders, and their styling lives in quicklinks.scss under this
 * component's own classes: `.text-field-input` is scoped to the settings Text
 * field, so it did nothing here and the inputs rendered as raw browser boxes.
 */
function AddModal({ urlError, iconError, addLink, closeModal, edit, editData, editLink }) {
  const [name, setName] = useState(edit ? editData.name : '');
  const [url, setUrl] = useState(edit ? editData.url : '');
  const [icon, setIcon] = useState(edit ? editData.icon : '');

  const stripNewlines = (value) => value.replaceAll('\n', '').replaceAll('\r', '');

  // A quick link without a name or a URL cannot be saved, so the button says so
  // before the user finds out through an error line.
  const incomplete = !name.trim() || !url.trim();

  const submit = (event) => {
    event.preventDefault();

    if (edit) editLink(editData, name, url, icon);
    else addLink(name, url, icon);
  };

  return (
    <form className="addLinkModal" onSubmit={submit}>
      <div className="shareHeader">
        <span className="title">
          {edit
            ? variables.getMessage('widgets.quicklinks.edit')
            : variables.getMessage('widgets.quicklinks.new')}
        </span>
        <Tooltip title={variables.getMessage('modals.welcome.buttons.close')}>
          <div className="close" onClick={() => closeModal()}>
            <MdClose />
          </div>
        </Tooltip>
      </div>

      <div className="linkFields">
        <label className="linkField">
          <span>{variables.getMessage('widgets.quicklinks.name')}</span>
          <input
            type="text"
            autoFocus
            placeholder="Sofia news"
            value={name}
            onChange={(e) => setName(stripNewlines(e.target.value))}
          />
        </label>

        <label className="linkField">
          <span>{variables.getMessage('widgets.quicklinks.url')}</span>
          <input
            type="text"
            inputMode="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(stripNewlines(e.target.value))}
          />
        </label>

        <label className="linkField">
          <span>{variables.getMessage('widgets.quicklinks.icon')}</span>
          <input
            type="text"
            inputMode="url"
            placeholder="https://example.com/icon.png"
            value={icon}
            onChange={(e) => setIcon(stripNewlines(e.target.value))}
          />
          <small>Leave empty to use the icon the site already provides.</small>
        </label>
      </div>

      {(urlError || iconError) && (
        <p className="linkError">{[iconError, urlError].filter(Boolean).join(' ')}</p>
      )}

      <div className="addFooter">
        <button type="button" className="linkSecondary" onClick={() => closeModal()}>
          {variables.getMessage('modals.main.settings.buttons.cancel')}
        </button>
        <Button
          type="settings"
          onClick={submit}
          disabled={incomplete}
          icon={<MdAddLink />}
          label={
            edit
              ? variables.getMessage('modals.main.settings.sections.quicklinks.edit')
              : variables.getMessage('widgets.quicklinks.add')
          }
        />
      </div>
    </form>
  );
}

const MemoizedAddModal = memo(AddModal);
export { MemoizedAddModal as default, MemoizedAddModal as AddModal };
