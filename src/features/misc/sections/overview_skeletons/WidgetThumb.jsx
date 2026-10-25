import { memo } from 'react';

/**
 * A widget as the preview draws it: a thumbnail card with a single entry, bars
 * where the text would be and dots where the real card carries its glyph.
 *
 * These are the widgets that cannot be cloned into the settings panel — the
 * three that talk to Google, the weather card and the photo credit — so their
 * shape is drawn instead. Nothing here is a label: the order list already names
 * every widget beside the preview.
 */
const LAYOUT = {
  mail: { icon: 'dot', lines: ['wide', 'medium'] },
  calendar: { icon: 'square', lines: ['medium', 'wide'] },
  tasks: { icon: 'check', lines: ['wide'] },
  photoinfo: { icon: null, lines: ['medium', 'short'] },
};

function WidgetThumb({ type, label }) {
  const layout = LAYOUT[type];

  if (!layout) return null;

  return (
    <div className={`gwSkeleton gwSkeleton-${type}`} role="img" aria-label={label || type}>
      <div className="gwSkeletonHead">
        <span className="gwSkeletonDot" />
        <span className="gwSkeletonBar gwSkeletonBar-short" />
        <span className="gwSkeletonDot gwSkeletonDot-small" />
      </div>
      <div className="gwSkeletonEntry">
        {layout.icon ? <span className={`gwSkeletonIcon gwSkeletonIcon-${layout.icon}`} /> : null}
        <span className="gwSkeletonLines">
          {layout.lines.map((line) => (
            <span className={`gwSkeletonBar gwSkeletonBar-${line}`} key={line} />
          ))}
        </span>
      </div>
    </div>
  );
}

export default memo(WidgetThumb);
