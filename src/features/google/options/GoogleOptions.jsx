import { useCallback, useEffect, useState } from 'react';
import variables from 'config/variables';
import { toast } from 'react-toastify';

import { Row, Content, Action } from 'components/Layout/Settings/Item';
import { Text } from 'components/Form/Settings';

import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { getRedirectUri, SCOPES } from '../auth';
import { describeError } from '../components/ConnectPrompt';

const SERVICE_LABELS = {
  'https://www.googleapis.com/auth/gmail.readonly': 'Mail, read only',
  'https://www.googleapis.com/auth/calendar.events': 'Calendar events, read and write',
  'https://www.googleapis.com/auth/tasks': 'Tasks, read and write',
};

const GoogleOptions = () => {
  const { auth, loading, error, connectAccount, disconnectAccount } = useGoogleAuth();
  const [busy, setBusy] = useState(false);
  const [redirectUri, setRedirectUri] = useState('');

  useEffect(() => {
    try {
      setRedirectUri(getRedirectUri());
    } catch {
      setRedirectUri('');
    }
  }, []);

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
          title="Google account"
          subtitle={
            loading
              ? 'Checking…'
              : auth
                ? `Connected${auth.email ? ` as ${auth.email}` : ''}`
                : 'Not connected. Moo asks Google for your mail, calendar and tasks with your own OAuth client.'
          }
        />
        <Action>
          <button
            type="button"
            className="gwButton"
            onClick={auth ? disconnectNow : connectNow}
            disabled={busy || loading}
          >
            {auth ? 'Disconnect' : busy ? 'Waiting for Google…' : 'Connect'}
          </button>
        </Action>
      </Row>

      {error && (
        <Row>
          <Content title="Last error" subtitle={describeError(error)} />
        </Row>
      )}

      <Row>
        <Content
          title="Client ID"
          subtitle="OAuth client of type Desktop app, created in your own Google Cloud project."
        />
        <Action>
          <Text name="googleClientId" placeholder="…apps.googleusercontent.com" />
        </Action>
      </Row>

      <Row>
        <Content
          title="Client secret"
          subtitle="Stored in this browser profile only. It never leaves your machine."
        />
        <Action>
          <Text name="googleClientSecret" placeholder="GOCSPX-…" />
        </Action>
      </Row>

      <Row final={true}>
        <Content
          title="Scopes requested"
          subtitle={`Redirect URI Google must accept: ${redirectUri || 'unavailable'}`}
        />
        <Action>
          <ul className="googleScopeList">
            {SCOPES.filter((scope) => SERVICE_LABELS[scope]).map((scope) => (
              <li key={scope}>{SERVICE_LABELS[scope]}</li>
            ))}
          </ul>
        </Action>
      </Row>
    </>
  );
};

export default GoogleOptions;
