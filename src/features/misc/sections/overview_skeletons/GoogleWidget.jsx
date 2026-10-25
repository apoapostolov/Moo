import { memo } from 'react';

/**
 * A Google widget as the preview draws it: a card shaped like the real one, with
 * a single entry inside. Nothing here is a label for the widget; the name lives
 * in the order list beside the preview, so the box shows what the widget looks
 * like rather than spelling it out again.
 *
 * Text is drawn as bars and the widgets' glyphs as dots, which keeps the shape
 * recognisable at preview size instead of rendering five tiny words.
 */
const LAYOUT = {
  mail: { icon: 'dot', lines: ['wide', 'medium'] },
  calendar: { icon: 'square', lines: ['medium', 'wide'] },
  tasks: { icon: 'check', lines: ['wide'] },
};

function GoogleWidgetSkeleton({ type, label }) {
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
        <span className={`gwSkeletonIcon gwSkeletonIcon-${layout.icon}`} />
        <span className="gwSkeletonLines">
          {layout.lines.map((line) => (
            <span className={`gwSkeletonBar gwSkeletonBar-${line}`} key={line} />
          ))}
        </span>
      </div>
    </div>
  );
}

export default memo(GoogleWidgetSkeleton);
