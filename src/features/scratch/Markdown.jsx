import { marked } from 'marked';

/**
 * A small markdown renderer for the scratch notes.
 *
 * It walks marked's tokens and builds React elements instead of handing HTML to
 * the page. A note is a paste target as well as a typing target, and this page
 * holds extension privileges, so no string of markup ever becomes DOM: raw HTML
 * in a note is shown as text, images are dropped rather than fetched, and links
 * are limited to schemes that cannot run script.
 */

const SAFE_SCHEME = /^(https?:|mailto:)/i;

const safeHref = (href) => {
  const value = String(href || '').trim();

  // A relative link on a new tab page has nowhere to go, so only real addresses
  // and mail links survive.
  return SAFE_SCHEME.test(value) ? value : null;
};

const inline = (tokens = []) =>
  tokens.map((token, index) => {
    const key = `${token.type}-${index}`;

    switch (token.type) {
      case 'strong':
        return <strong key={key}>{inline(token.tokens)}</strong>;
      case 'em':
        return <em key={key}>{inline(token.tokens)}</em>;
      case 'del':
        return <del key={key}>{inline(token.tokens)}</del>;
      case 'codespan':
        return <code key={key}>{token.text}</code>;
      case 'br':
        return <br key={key} />;
      case 'link': {
        const href = safeHref(token.href);

        return href ? (
          <a key={key} href={href} target="_blank" rel="noreferrer noopener">
            {inline(token.tokens)}
          </a>
        ) : (
          <span key={key}>{inline(token.tokens)}</span>
        );
      }
      // An image in a note would load a stranger's server from the new tab page,
      // so its alt text is all that appears.
      case 'image':
        return <span key={key}>{token.text}</span>;
      case 'text':
        return token.tokens ? <span key={key}>{inline(token.tokens)}</span> : token.text;
      case 'escape':
        return token.text;
      // Anything marked treats as raw HTML is text here, never markup.
      case 'html':
        return <span key={key}>{token.text}</span>;
      default:
        return token.text ?? token.raw ?? null;
    }
  });

const blocks = (tokens = []) =>
  tokens.map((token, index) => {
    const key = `${token.type}-${index}`;

    switch (token.type) {
      case 'space':
        return null;
      case 'heading': {
        // The level a note writes is the level it gets: clamping #### and #####
        // to h3 gave every heading past the third the same size.
        const Tag = `h${Math.min(6, Math.max(1, token.depth || 1))}`;

        return <Tag key={key}>{inline(token.tokens)}</Tag>;
      }
      case 'paragraph':
        return <p key={key}>{inline(token.tokens)}</p>;
      case 'list': {
        const Tag = token.ordered ? 'ol' : 'ul';

        return (
          <Tag key={key} start={token.ordered && token.start !== 1 ? token.start : undefined}>
            {token.items.map((item, itemIndex) => (
              <li key={`${key}-${itemIndex}`}>{blocks(item.tokens || [])}</li>
            ))}
          </Tag>
        );
      }
      case 'blockquote':
        return <blockquote key={key}>{blocks(token.tokens)}</blockquote>;
      case 'code':
        return (
          <pre key={key}>
            <code>{token.text}</code>
          </pre>
        );
      case 'hr':
        return <hr key={key} />;
      // Tables are more than a sticky note needs; the text is kept verbatim.
      case 'table':
      case 'html':
        return (
          <p key={key} className="scratchNoteRaw">
            {token.raw}
          </p>
        );
      // A tight list hands its items over as bare text tokens rather than
      // paragraphs, and those still carry inline markup.
      default:
        return token.tokens?.length ? (
          <p key={key}>{inline(token.tokens)}</p>
        ) : (
          <p key={key} className="scratchNoteRaw">
            {token.raw ?? token.text}
          </p>
        );
    }
  });

const Markdown = ({ text }) => <>{blocks(marked.lexer(text || ''))}</>;

export { Markdown as default, Markdown };
