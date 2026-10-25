import { googleFetch } from '../api';

const MESSAGE_HEADERS = ['Subject', 'From', 'Date'].map((name) => `metadataHeaders=${name}`).join('&');

const headerValue = (message, name) =>
  message.payload?.headers?.find((header) => header.name === name)?.value ?? '';

const toMessage = (message) => ({
  id: message.id,
  threadId: message.threadId,
  subject: headerValue(message, 'Subject') || '(no subject)',
  from: headerValue(message, 'From').replace(/\s*<.*>$/, '') || '(no sender)',
  date: headerValue(message, 'Date'),
  snippet: message.snippet ?? '',
  unread: (message.labelIds ?? []).includes('UNREAD'),
  labels: message.labelIds ?? [],
});

export const getUnreadCount = async () => {
  const label = await googleFetch('/gmail/v1/users/me/labels/INBOX');

  return label?.messagesUnread ?? 0;
};

/**
 * One list call, then one metadata call per message: Gmail has no browser-usable
 * batch endpoint. The query is whatever the user set, so this covers unread,
 * a label, a search, or anything else Gmail's search syntax understands.
 */
export const listMessages = async ({ query = 'is:unread', maxResults = 6 } = {}) => {
  const search = query.trim() || 'is:unread';
  const list = await googleFetch(
    `/gmail/v1/users/me/messages?q=${encodeURIComponent(search)}&maxResults=${maxResults}`,
  );

  const ids = (list?.messages ?? []).map((message) => message.id);

  if (!ids.length) return { messages: [], unreadCount: 0 };

  const [messages, unreadCount] = await Promise.all([
    Promise.all(
      ids.map((id) =>
        googleFetch(`/gmail/v1/users/me/messages/${id}?format=metadata&${MESSAGE_HEADERS}`),
      ),
    ),
    getUnreadCount().catch(() => 0),
  ]);

  return { messages: messages.map(toMessage), unreadCount };
};

export const getMessageUrl = (message) =>
  `https://mail.google.com/mail/u/0/#inbox/${message.threadId ?? message.id}`;
