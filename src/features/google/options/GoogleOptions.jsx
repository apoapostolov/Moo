import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { MdOpenInNew } from 'react-icons/md';

import { Row, Content, Action } from 'components/Layout/Settings/Item';
import { Text } from 'components/Form/Settings';

import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { getRedirectUri, SCOPES } from '../auth';
import { ensureDefaults } from '../settings';
import GoogleWidgetSettings from './WidgetSettings';
import { describeError } from '../components/ConnectPrompt';

import '../google.scss';

const SERVICE_LABELS = {
  'https://www.googleapis.com/auth/gmail.readonly': 'Mail, read only',
  'https://www.googleapis.com/auth/calendar.events': 'Calendar events, read and write',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly': 'Calendar list, to pick which calendars show',
  'https://www.googleapis.com/auth/tasks': 'Tasks, read and write',
};

const CREDENTIALS_URL = 'https://console.cloud.google.com/apis/credentials';

/**
 * Google needs an app of your own before it will answer anything, so the order
 * here is the order you work through: register the app, paste the credentials,
 * then connect. Connect stays locked until both credentials are in, because
 * pressing it earlier can only end in an error.
 */
const Step = ({ number }) => <span className="googleStepNumber">{number}</span>;

const GoogleOptions = () => {
  const { auth, loading, error, connectAccount, disconnectAccount } = useGoogleAuth();
  const [busy, setBusy] = useState(false);
  const [redirectUri, setRedirectUri] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    try {
      setRedirectUri(getRedirectUri());
    } catch {
      setRedirectUri('');
    }

    setClientId(localStorage.getItem('googleClientId') || '');
    setClientSecret(localStorage.getItem('googleClientSecret') || '');
    ensureDefaults();
  }, []);

  const ready = Boolean(clientId.trim() && clientSecret.trim());

  const connectNow = useCallback(async () => {
    setBusy(true);

    try {
      const next = await connectAccount();
      toast(`Google connected${next?.email ? ` as ${next.email}` : ''}`);

      // The widgets only wake up when they are told something changed.
      window.location.reload();
    } catch {
      // Reported through `error` below.
    } finally {
      setBusy(false);
    }
  }, [connectAccount]);

  const disconnectNow = useCallback(async () => {
    setBusy(true);

    try {
      await disconnectAccount();
      toast('Google disconnected');
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }, [disconnectAccount]);

  return (
    <>
      <Row>
        <Content
          title={
            <>
              <Step number="1" />
              Register Moo in Google Cloud
            </>
          }
          subtitle="Nothing works before this step. Google only answers apps it knows about, so make one in your own Cloud project: create a project, turn on the Gmail, Calendar and Tasks APIs, then create an OAuth client of type Desktop app."
        />
        <Action>
          <a
            className="gwButton googleOpenLink"
            href={CREDENTIALS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Google Cloud <MdOpenInNew />
          </a>
        </Action>
      </Row>

      <Row>
        <Content
          title="Paste this Redirect URI when Google asks"
          subtitle="Google rejects invented addresses. This one belongs to this installation, so copy it exactly as it is."
        />
        <Action>
          <code className="googleRedirect">{redirectUri || 'only visible inside the extension'}</code>
        </Action>
      </Row>

      <Row>
        <Content
          title="Scopes Moo will ask for"
          subtitle="The permissions the app requests from your account. Nothing is read before you connect."
        />
        <Action>
          <ul className="googleScopeList">
            {SCOPES.filter((scope) => SERVICE_LABELS[scope]).map((scope) => (
              <li key={scope}>{SERVICE_LABELS[scope]}</li>
            ))}
          </ul>
        </Action>
      </Row>

      <Row>
        <Content
          title={
            <>
              <Step number="2" />
              Paste the client ID and secret
            </>
          }
          subtitle="Both come from the OAuth client you created in step 1. They stay in this browser profile."
        />
        <Action>
          <Text
            name="googleClientId"
            title="Client ID"
            placeholder="…apps.googleusercontent.com"
            onChange={setClientId}
          />
          <Text
            name="googleClientSecret"
            title="Client secret"
            placeholder="GOCSPX-…"
            onChange={setClientSecret}
          />
        </Action>
      </Row>

      <Row final={true}>
        <Content
          title={
            <>
              <Step number="3" />
              Connect
            </>
          }
          subtitle={
            loading
              ? 'Checking…'
              : auth
                ? `Connected${auth.email ? ` as ${auth.email}` : ''}. Disconnect only forgets the tokens in this browser; your Google account is untouched.`
                : ready
                  ? 'Google opens its own page in a small window and you approve the three permissions there.'
                  : 'Locked until step 2 is done. With no client ID and secret there is nothing for Google to talk to.'
          }
        />
        <Action>
          <button
            type="button"
            className="gwButton"
            onClick={auth ? disconnectNow : connectNow}
            disabled={busy || loading || (!auth && !ready)}
          >
            {auth ? 'Disconnect' : busy ? 'Waiting for Google…' : 'Connect Google'}
          </button>
        </Action>
      </Row>

      {error && (
        <Row>
          <Content title="Last error" subtitle={describeError(error)} />
        </Row>
      )}

      {auth && <GoogleWidgetSettings />}
    </>
  );
};

export default GoogleOptions;
