import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const [height, setHeight] = useState(0);
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

  // A panel cannot be placed before it knows its own size, and the size is only
  // known once the message has arrived. Measuring beats guessing: the preview
  // may be three lines or forty.
  useLayoutEffect(() => {
    const node = panel.current;

    if (!node) return undefined;

    const measure = () => setHeight(node.getBoundingClientRect().height);

    measure();

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;

    observer?.observe(node);
    window.addEventListener('resize', measure);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const width = Math.min(430, window.innerWidth - 48);
  const card = anchor.getBoundingClientRect();

  // Beside the card when there is room, otherwise over the row it came from.
  const roomRight = window.innerWidth - card.right;

  const left =
    roomRight > width + 24
      ? card.right + 12
      : Math.max(16, Math.min(card.left + 12, window.innerWidth - width - 16));

  // Tall messages stop at 62% of the window, and never at more than the window
  // can hold with a margin above and below.
  const maxHeight = Math.min(window.innerHeight * 0.62, window.innerHeight - 32);

  // Placed from the row while the whole panel fits below it. When it would hang
  // past the bottom edge the window wins: the panel is lifted until its last line
  // is on screen. Only a panel taller than the window itself, which max-height
  // has already capped, ends up at the top edge.
  const wanted = Math.max(16, card.top - 8);
  const overflow = wanted + height - (window.innerHeight - 16);
  const top = overflow > 0 ? Math.max(16, wanted - overflow) : wanted;

  return createPortal(
    <div
      ref={panel}
      popover="manual"
      className="gwPreview"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        maxHeight: `${maxHeight}px`,
        // Nothing is painted until the size is known, so the panel never shows
        // up in a place it is about to leave.
        visibility: height ? 'visible' : 'hidden',
      }}
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
      </div>
    </div>,
    document.body,
  );
};

export default MailPreview;
