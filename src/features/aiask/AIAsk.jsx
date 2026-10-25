import { useCallback, useEffect, useRef, useState } from 'react';
import { MdAutoAwesome } from 'react-icons/md';
import { SiOpenai } from 'react-icons/si';

import './aiask.scss';

/**
 * Ask a question straight from the new tab page.
 *
 * Both services are reached by address rather than by an API key, and nothing
 * leaves the page until Enter is pressed.
 *
 * Google is AI Mode, not the ordinary results page: `udm=50` is the parameter
 * that selects the conversational AI view (`udm=14` is the plain web view), and
 * google.com/ai itself redirects to a search carrying it. Without that
 * parameter this would be a normal Google search, which is not what was asked
 * for.
 *
 * ChatGPT takes a prefilled prompt from `?q=`, and `hints=search` is what makes
 * it run a web search instead of opening a plain chat. That pair is the address
 * the ChatGPT search extension registers as its search engine.
 */
const SERVICES = {
  google: {
    name: 'Google AI Mode',
    url: (query) => `https://www.google.com/search?udm=50&q=${encodeURIComponent(query)}`,
    Icon: MdAutoAwesome,
  },
  chatgpt: {
    name: 'ChatGPT',
    url: (query) => `https://chatgpt.com/?q=${encodeURIComponent(query)}&hints=search`,
    Icon: SiOpenai,
  },
};

const SERVICE_KEY = 'aiAskService';

const readService = () => {
  const stored = localStorage.getItem(SERVICE_KEY);

  return SERVICES[stored] ? stored : 'google';
};

const AIAsk = () => {
  const [service, setService] = useState(readService);
  const [query, setQuery] = useState('');
  const [picking, setPicking] = useState(false);
  const input = useRef(null);
  const box = useRef(null);

  /**
   * The point of the widget is that you can type the moment the page appears,
   * so it takes the keyboard itself. It gives it back rather than takes it
   * again: only an idle page is claimed, never a dialog or a note being written.
   */
  useEffect(() => {
    const claim = () => {
      const active = document.activeElement;

      if (active && active !== document.body && active !== input.current) return;
      if (document.querySelector('.modalBackground')) return;

      input.current?.focus({ preventScroll: true });
    };

    claim();
    window.addEventListener('focus', claim);

    return () => window.removeEventListener('focus', claim);
  }, []);

  // The menu closes on the next click anywhere else, or on Escape.
  useEffect(() => {
    if (!picking) return undefined;

    const close = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type === 'pointerdown' && box.current?.contains(event.target)) return;

      setPicking(false);
    };

    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);

    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [picking]);

  const submit = (event) => {
    event.preventDefault();

    const asked = query.trim();

    if (!asked) {
      input.current?.focus();

      return;
    }

    window.location.assign(SERVICES[service].url(asked));
  };

  const choose = useCallback((key) => {
    localStorage.setItem(SERVICE_KEY, key);
    setService(key);
    setPicking(false);
    input.current?.focus();
  }, []);

  const { Icon, name } = SERVICES[service];

  return (
    <form className="aiAsk" onSubmit={submit} ref={box}>
      <input
        ref={input}
        className="aiAskInput"
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Ask anything"
        aria-label={`Ask ${name}`}
        autoComplete="off"
        spellCheck="false"
      />
      <button
        type="button"
        className="aiAskService"
        onClick={() => setPicking((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={picking}
        aria-label={name}
        title={name}
      >
        <Icon />
      </button>
      {picking && (
        <div className="aiAskMenu" role="menu">
          {Object.entries(SERVICES).map(([key, item]) => (
            <button
              key={key}
              type="button"
              role="menuitemradio"
              aria-checked={key === service}
              className={key === service ? 'aiAskOption aiAskOptionOn' : 'aiAskOption'}
              onClick={() => choose(key)}
            >
              <item.Icon />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
};

export { AIAsk as default, AIAsk };
