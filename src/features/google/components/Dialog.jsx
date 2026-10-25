import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Small dialog shell for the widget CRUD forms. It closes on Escape and on a
 * click outside the panel, which is what a new tab page needs since it has no
 * surrounding modal to lean on.
 *
 * It renders into the body rather than inside the card. The card carries a
 * backdrop-filter, and that turns it into the containing block for fixed
 * children: the overlay would size itself to the widget and the dialog would
 * open wherever the card happens to sit on the page.
 */
const Dialog = ({ title, onClose, children, footer }) => {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="gwOverlay" onMouseDown={onClose} role="presentation">
      <div
        className="gwDialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="gwDialogHead">
          <h3>{title}</h3>
          <button type="button" className="gwIconButton" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="gwDialogBody">{children}</div>
        {footer && <footer className="gwDialogFoot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
};

export default Dialog;
