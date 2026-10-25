import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { getMessage } from '../services/gmail';
import { describeError } from './ConnectPrompt';

/** Hovering the same row twice should not mean a second trip to Gmail. */
const cache = new Map();

const formatDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * The whole message, floating next to the row it belongs to.
 *
 * It is a manual popover, so the browser puts it in the top layer: the card it
 * belongs to carries a backdrop-filter and would otherwise paint over anything
 * this close to it, and the card also clips its own contents.
 */
const MailPreview = ({ message, anchor, onEnter, onLeave }) => {
  const panel = useRef(null);
  const [state, setState] = useState(() =>
    cache.has(message.id)
      ? { loading: false, data: cache.get(message.id), error: '' }
      : { loading: true, data: null, error: '' },
  );

  useEffect(() => {
    const node = panel.current;

    if (!node) return undefined;

    if (typeof node.showPopover === 'function') {
      if (!node.matches(':popover-open')) node.showPopover();
    } else {
      node.setAttribute('open', '');
    }

    return () => {
      if (typeof node.hidePopover === 'function' && node.matches(':popover-open')) {
        node.hidePopover();
      }
    };
  }, []);

  useEffect(() => {
    if (cache.has(message.id)) return undefined;

    let alive = true;

    getMessage(message.id)
      .then((data) => {
        cache.set(message.id, data);

        if (alive) setState({ loading: false, data, error: '' });
      })
      .catch((error) => {
        if (alive) setState({ loading: false, data: null, error: describeError(error.message) });
      });

    return () => {
      alive = false;
    };
  }, [message.id]);

  const width = Math.min(430, window.innerWidth - 48);
  const card = anchor.getBoundingClientRect();

  // Beside the card when there is room, otherwise over the row it came from.
  const roomRight = window.innerWidth - card.right;

  const left =
    roomRight > width + 24
      ? card.right + 12
      : Math.max(16, Math.min(card.left + 12, window.innerWidth - width - 16));

  const top = Math.max(16, Math.min(card.top - 8, window.innerHeight - 320));

  return createPortal(
    <div
      ref={panel}
      popover="manual"
      className="gwPreview"
      style={{ left: `${left}px`, top: `${top}px`, width: `${width}px` }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="gwPreviewHead">
        <span className="gwPreviewFrom">{state.data?.from || message.from}</span>
        <span className="gwPreviewDate">{formatDate(state.data?.date || message.date)}</span>
      </div>

      <p className="gwPreviewSubject">{state.data?.subject || message.subject}</p>

      <div className="gwPreviewBody">
        {state.loading && <p className="gwPreviewNote">Reading the message…</p>}
        {!state.loading && state.error && <p className="gwPreviewNote">{state.error}</p>}
        {!state.loading && !state.error && (state.data?.body || '(no text, only markup)')}
      </div>

      <div className="gwPreviewFoot">
        {state.data?.to && <span>to {state.data.to}</span>}
        {state.data?.attachments > 0 && (
          <span>
            {state.data.attachments} attachment{state.data.attachments === 1 ? '' : 's'}
          </span>
        )}
        <span className="gwPreviewHint">click the row to open in Gmail</span>
      </div>
    </div>,
    document.body,
  );
};

export default MailPreview;
