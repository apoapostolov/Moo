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

/** Every label the account has, minus the category labels Gmail keeps separate. */
export const listLabels = async () => {
  const data = await googleFetch('/gmail/v1/users/me/labels');

  return (data?.labels ?? [])
    .filter((label) => !String(label.id).startsWith('CATEGORY_') && label.id !== 'CHAT')
    .map((label) => ({
      id: label.id,
      name: label.name,
      type: label.type ?? 'user',
      // Gmail answers system labels in capitals; the picker reads better in
      // title case, while the name itself stays as the API sent it.
      display:
        (label.type ?? 'user') === 'system'
          ? label.name.charAt(0) + label.name.slice(1).toLowerCase()
          : label.name,
    }))
    .sort((a, b) => a.display.localeCompare(b.display));
};

export const getUnreadCount = async () => {
  const label = await googleFetch('/gmail/v1/users/me/labels/INBOX');

  return label?.messagesUnread ?? 0;
};

/**
 * Gmail search does not take a label id. System folders have their own operator
 * and custom labels are matched by name, quoted when it contains a space.
 */
const SYSTEM_FOLDERS = {
  INBOX: 'in:inbox',
  SENT: 'in:sent',
  DRAFT: 'in:drafts',
  SPAM: 'in:spam',
  TRASH: 'in:trash',
  STARRED: 'is:starred',
  IMPORTANT: 'is:important',
};

const folderQuery = (folder) => {
  const id = typeof folder === 'string' ? folder : folder?.id;
  const name = typeof folder === 'string' ? folder : folder?.name || id;

  if (SYSTEM_FOLDERS[id]) return SYSTEM_FOLDERS[id];

  return `label:${/\s/.test(name) ? `"${name}"` : name}`;
};

const searchIds = async (query, maxResults) => {
  const list = await googleFetch(
    `/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
  );

  return (list?.messages ?? []).map((message) => message.id);
};

/**
 * One list call per source, then one metadata call per message: Gmail has no
 * browser-usable batch endpoint.
 *
 * A source is the user's query narrowed by an inbox category or a label. Gmail
 * has no way to search "everything except promotions", so the switched-off
 * categories are simply never asked for, and the answers are merged.
 */
export const listMessages = async ({
  query = 'is:unread',
  maxResults = 6,
  categories = [],
  categoryIds = [],
  folders = [],
} = {}) => {
  const search = query.trim() || 'is:unread';
  const everyCategory = categoryIds.length > 0 && categories.length >= categoryIds.length;

  const sources = [
    // Narrowing by category only pays off when some are switched off.
    ...(categories.length
      ? everyCategory
        ? [search]
        : categories.map((category) => `${search} category:${category}`)
      : []),
    ...folders.map((folder) => `${search} ${folderQuery(folder)}`),
  ];

  // Every category off and no folder chosen: there is nothing to ask for.
  if (!sources.length) return { messages: [], unreadCount: 0 };

  const pages = await Promise.all(
    sources.map((source) => searchIds(source, maxResults).catch(() => [])),
  );

  // Sources overlap often, so the same message can arrive twice.
  const ids = [...new Set(pages.flat())];

  if (!ids.length) return { messages: [], unreadCount: 0 };

  // A little slack over the limit, because the merged order only becomes exact
  // once the dates are known.
  const wanted = ids.slice(0, maxResults * 2);

  const [messages, unreadCount] = await Promise.all([
    Promise.all(
      wanted.map((id) =>
        googleFetch(`/gmail/v1/users/me/messages/${id}?format=metadata&${MESSAGE_HEADERS}`),
      ),
    ),
    getUnreadCount().catch(() => 0),
  ]);

  const sorted = messages
    .map(toMessage)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, maxResults);

  return { messages: sorted, unreadCount };
};

export const getMessageUrl = (message) =>
  `https://mail.google.com/mail/u/0/#inbox/${message.threadId ?? message.id}`;
