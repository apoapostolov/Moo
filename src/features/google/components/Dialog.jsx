import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Small dialog shell for the widget CRUD forms.
 *
 * It is a real <dialog> opened with showModal(), which puts it in the browser's
 * top layer. That is the only placement that is always above the page: these
 * cards carry a backdrop-filter, and a filtered card is composited in its own
 * layer, which can paint over an ordinary fixed overlay no matter what z-index
 * the overlay asks for. The top layer sits above every stacking context.
 *
 * It renders into the body rather than inside the card for the same reason: a
 * filtered ancestor is also the containing block for fixed children, so inside
 * the widget the dialog would open wherever the card happens to sit.
 */
const Dialog = ({ title, onClose, children, footer }) => {
  const panel = useRef(null);

  useEffect(() => {
    const node = panel.current;

    if (!node) return undefined;

    if (!node.open) {
      // showModal is what moves it to the top layer; the attribute is only a
      // fallback for a browser that refuses it.
      if (typeof node.showModal === 'function') node.showModal();
      else node.setAttribute('open', '');
    }

    return () => {
      if (node.open) node.close();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <dialog
      ref={panel}
      className="gwDialog"
      aria-label={title}
      onCancel={(event) => {
        // Escape is handled above, so the native close would race it.
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === panel.current) onClose();
      }}
    >
      <header className="gwDialogHead">
        <h3>{title}</h3>
        <button type="button" className="gwIconButton" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>
      <div className="gwDialogBody">{children}</div>
      {footer && <footer className="gwDialogFoot">{footer}</footer>}
    </dialog>,
    document.body,
  );
};

export default Dialog;
