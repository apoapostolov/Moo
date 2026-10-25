import { useCallback, useEffect, useState } from 'react';

import { useGoogleAuth } from './hooks/useGoogleAuth';
import { getMessageUrl, listUnreadMessages } from './services/gmail';
import ConnectPrompt, { describeError } from './components/ConnectPrompt';

import './google.scss';

const REFRESH_MS = 5 * 60 * 1000;

const formatTime = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

const GoogleMail = () => {
  const { auth, loading, error, connectAccount } = useGoogleAuth();
  const [state, setState] = useState({ messages: [], unreadCount: 0 });
  const [fetchError, setFetchError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setFetchError('');

    try {
      setState(await listUnreadMessages(6));
    } catch (loadError) {
      setFetchError(loadError.message);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!auth) return undefined;

    load();

    const timer = setInterval(load, REFRESH_MS);

    return () => clearInterval(timer);
  }, [auth, load]);

  if (loading) return null;

  if (!auth) {
    return <ConnectPrompt label="Mail" onConnect={connectAccount} error={error} />;
  }

  return (
    <div className="googleWidget">
      <header className="gwHead">
        <span className="gwLabel">Mail</span>
        <span className="gwBadge">{state.unreadCount}</span>
        <button
          type="button"
          className="gwIconButton"
          onClick={load}
          disabled={busy}
          aria-label="Refresh mail"
          title="Refresh"
        >
          ↻
        </button>
      </header>

      {fetchError && <p className="gwError">{describeError(fetchError)}</p>}

      {!fetchError && !state.messages.length && <p className="gwEmpty">Inbox is clear.</p>}

      <ul className="gwList">
        {state.messages.map((message) => (
          <li key={message.id}>
            <a
              className="gwItem"
              href={getMessageUrl(message)}
              target="_blank"
              rel="noopener noreferrer"
              title={message.snippet}
            >
              <span className="gwItemTop">
                <span className="gwItemTitle">{message.from || message.subject}</span>
                <span className="gwItemMeta">{formatTime(message.date)}</span>
              </span>
              <span className="gwItemSub">{message.subject}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GoogleMail;
