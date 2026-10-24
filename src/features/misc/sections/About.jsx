import variables from 'config/variables';
import { PureComponent } from 'react';
import { MdEmail, MdContactPage } from 'react-icons/md';
import { FaDiscord } from 'react-icons/fa';
import { SiX } from 'react-icons/si';

import { Button } from 'components/Elements';

class About extends PureComponent {
  constructor() {
    super();
    this.state = {
      update: variables.getMessage('modals.main.settings.sections.about.version.checking_update'),
      loading: variables.getMessage('modals.main.loading'),
    };
    this.controller = new AbortController();
  }

  async getGitHubData() {
    let versionData;

    try {
      versionData = await (
        await fetch(
          variables.constants.GITHUB_URL +
            '/repos/' +
            variables.constants.ORG_NAME +
            '/' +
            variables.constants.REPO_NAME +
            '/releases',
          { signal: this.controller.signal },
        )
      ).json();
    } catch {
      if (this.controller.signal.aborted === true) {
        return;
      }

      return this.setState({
        update: variables.getMessage('modals.main.settings.sections.about.version.error.title'),
        loading: variables.getMessage(
          'modals.main.settings.sections.about.version.error.description',
        ),
      });
    }

    if (this.controller.signal.aborted === true) {
      return;
    }

    if (!versionData || !Array.isArray(versionData) || versionData.length === 0) {
      this.setState({ update: variables.getMessage('modals.main.settings.sections.about.version.no_update'), loading: null });
      return;
    }

    const newVersion = versionData[0].tag_name;

    let update = variables.getMessage('modals.main.settings.sections.about.version.no_update');
    if (
      Number(variables.constants.VERSION.replaceAll('.', '')) <
      Number(newVersion.replaceAll('.', ''))
    ) {
      update = `${variables.getMessage(
        'modals.main.settings.sections.about.version.update_available',
      )}: ${newVersion}`;
    }

    this.setState({
      update,
      loading: null,
    });
  }

  componentDidMount() {
    if (navigator.onLine === false || localStorage.getItem('offlineMode') === 'true') {
      this.setState({
        update: variables.getMessage('modals.main.marketplace.offline.description'),
        loading: variables.getMessage('modals.main.marketplace.offline.description'),
      });
      return;
    }

    this.getGitHubData();
  }

  componentWillUnmount() {
    // stop making requests
    this.controller.abort();
  }

  render() {
    return (
      <div className="modalInfoPage">
        <div className="settingsRow" style={{ justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexFlow: 'column', gap: '5px' }}>
            <img
              draggable={false}
              className="aboutLogo"
              src={'src/assets/icons/mue_about.png'}
              alt="Logo"
            />
            <div className="aboutText">
              <span className="title">Moo</span>
              <span className="subtitle">
                {variables.getMessage('modals.main.settings.sections.about.version.title')}{' '}
                {variables.constants.VERSION}
              </span>
              <span className="subtitle">({this.state.update})</span>
            </div>
            <div>
              <span className="subtitle">
                Copyright 2018-
                {new Date().getFullYear()}{' '}
                <a
                  className="link"
                  href={
                    'https://github.com/' +
                    variables.constants.ORG_NAME +
                    '/' +
                    variables.constants.REPO_NAME +
                    '/graphs/contributors'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  The Moo Authors
                </a>
              </span>
            </div>
            <span className="subtitle">Licensed under the BSD-3-Clause License</span>
          </div>
        </div>

        <div className="settingsRow" style={{ flexFlow: 'column', alignItems: 'flex-start' }}>
          <span className="title" style={{ marginBottom: '1em' }}>
            {variables.getMessage('modals.main.settings.sections.about.contact_us')}
          </span>
          <div className="aboutContact">
            <Button
              type="linkButton"
              href="https://muetab.com/contact"
              icon={<MdContactPage />}
              label={variables.getMessage('modals.main.settings.sections.about.form_button')}
            />
            <Button
              type="linkIconButton"
              href={'mailto:' + variables.constants.EMAIL}
              icon={<MdEmail />}
              tooltipTitle="Email"
            />
            <Button
              type="linkIconButton"
              href={'https://x.com/' + variables.constants.TWITTER_HANDLE}
              icon={<SiX />}
              tooltipTitle="X (Twitter)"
            />
            <Button
              type="linkIconButton"
              href={'https://discord.gg/' + variables.constants.DISCORD_SERVER}
              icon={<FaDiscord />}
              tooltipTitle="Discord"
            />
          </div>
        </div>

        <div className="settingsRow" style={{ flexFlow: 'column', alignItems: 'flex-start' }}>
          <span className="title">
            {variables.getMessage('modals.main.settings.sections.about.resources_used.title')}
          </span>
          <span className="subtitle">
            <a
              href="https://www.pexels.com"
              className="link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Pexels
            </a>
            ,{' '}
            <a
              href="https://unsplash.com"
              className="link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Unsplash
            </a>{' '}
            ({variables.getMessage('modals.main.settings.sections.about.resources_used.bg_images')})
          </span>
        </div>
      </div>
    );
  }
}

export { About as default, About };
