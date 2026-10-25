import { useCallback, useEffect, useState } from 'react';

import EventBus from 'utils/eventbus';
import { getSurface } from 'utils/widgetSurface';

import { useGoogleAuth } from './hooks/useGoogleAuth';
import { getMessageUrl, listMessages } from './services/gmail';
import { MAIL_CATEGORIES, getMailSettings, refreshMs } from './settings';
import ConnectPrompt, { describeError } from './components/ConnectPrompt';

import './google.scss';

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
  const [settings, setSettings] = useState(getMailSettings);
  const [state, setState] = useState({ messages: [], unreadCount: 0 });
  const [fetchError, setFetchError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const current = getMailSettings();
    setSettings(current);
    setBusy(true);
    setFetchError('');

    try {
      setState(
        await listMessages({
          query: current.query,
          maxResults: current.maxMessages,
          categories: current.categories,
          categoryIds: MAIL_CATEGORIES.map((category) => category.id),
          folders: current.folders,
        }),
      );
    } catch (loadError) {
      setFetchError(loadError.message);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!auth) return undefined;

    load();

    const timer = setInterval(load, refreshMs(settings.refreshMinutes));

    const onRefresh = (category) => {
      if (!category || category === 'google' || category === 'mail') load();
    };

    EventBus.on('refresh', onRefresh);

    return () => {
      clearInterval(timer);
      EventBus.off('refresh', onRefresh);
    };
  }, [auth, load, settings.refreshMinutes]);

  if (loading) return null;

  if (!auth) {
    return <ConnectPrompt label="Mail" onConnect={connectAccount} error={error} />;
  }

  const title = settings.query.trim() || 'is:unread';

  return (
    <div className={`googleWidget ${getSurface('mail')}`}>
      <header className="gwHead">
        <span className="gwLabel">Mail</span>
        {settings.badge === 'count' && <span className="gwBadge">{state.unreadCount}</span>}
        {settings.badge === 'dot' && state.unreadCount > 0 && <span className="gwBadge dot" />}
        <button
          type="button"
          className="gwIconButton"
          onClick={load}
          disabled={busy}
          aria-label="Refresh mail"
          title={title}
        >
          ↻
        </button>
      </header>

      {fetchError && <p className="gwError">{describeError(fetchError)}</p>}

      {!fetchError && !state.messages.length && (
        <p className="gwEmpty">
          {!settings.categories.length
            ? 'Every category is switched off in settings.'
            : title === 'is:unread'
              ? 'Inbox is clear.'
              : 'Nothing matches.'}
        </p>
      )}

      <ul className="gwList">
        {state.messages.map((message) => {
          const lead = settings.primary === 'subject' ? message.subject : message.from;
          const second = settings.primary === 'subject' ? message.from : message.subject;

          return (
            <li key={message.id}>
              <a
                className="gwItem"
                href={getMessageUrl(message)}
                target="_blank"
                rel="noopener noreferrer"
                title={message.snippet}
              >
                <span className="gwItemTop">
                  <span className="gwItemTitle">{lead}</span>
                  <span className="gwItemMeta">{formatTime(message.date)}</span>
                </span>
                <span className="gwItemSub">{second}</span>
                {settings.showSnippet && message.snippet && (
                  <span className="gwItemSub snippet">{message.snippet}</span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default GoogleMail;
