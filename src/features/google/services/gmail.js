import { googleFetch } from '../api';

const MESSAGE_HEADERS = ['Subject', 'From', 'Date'].map((name) => `metadataHeaders=${name}`).join('&');

const headerValue = (message, name) =>
  message.payload?.headers?.find((header) => header.name === name)?.value ?? '';

const toMessage = (message) => ({
  id: message.id,
  threadId: message.threadId,
  subject: headerValue(message, 'Subject') || '(no subject)',
  from: headerValue(message, 'From').replace(/\s*<.*>$/, ''),
  date: headerValue(message, 'Date'),
  snippet: message.snippet ?? '',
  unread: (message.labelIds ?? []).includes('UNREAD'),
});

export const getUnreadCount = async () => {
  const label = await googleFetch('/gmail/v1/users/me/labels/INBOX');

  return label?.messagesUnread ?? 0;
};

/**
 * Gmail has no batch endpoint usable from a browser without a server, so the
 * list call is followed by one metadata request per message. The widget only
 * asks for a handful, which keeps that cheap.
 */
export const listUnreadMessages = async (maxResults = 6) => {
  const list = await googleFetch(
    `/gmail/v1/users/me/messages?q=${encodeURIComponent('is:unread')}&maxResults=${maxResults}`,
  );

  const ids = (list?.messages ?? []).map((message) => message.id);

  if (!ids.length) return { messages: [], unreadCount: 0 };

  const [messages, unreadCount] = await Promise.all([
    Promise.all(
      ids.map((id) => googleFetch(`/gmail/v1/users/me/messages/${id}?format=metadata&${MESSAGE_HEADERS}`)),
    ),
    getUnreadCount().catch(() => ids.length),
  ]);

  return { messages: messages.map(toMessage), unreadCount };
};

export const getMessageUrl = (message) =>
  `https://mail.google.com/mail/u/0/#inbox/${message.threadId ?? message.id}`;
