function Row(props) {
  const classes = `${props.final ? 'settingsRow settingsNoBorder' : 'settingsRow'} ${props.inactive ? 'preferencesInactive' : ''}`;
  return <div className={classes}>{props.children}</div>;
}

function Content(props) {
  return (
    <div className="content">
      <span className="title">{props.title}</span>
      <span className="subtitle">{props.subtitle}</span>
    </div>
  );
}

function Action(props) {
  return <div className="action">{props.children}</div>;
}

/**
 * Rows that configure one thing. Inside a group no rule is drawn between rows
 * and the block closes with a single rule of its own, because a separator
 * between two halves of one setting says there is a seam where there is none.
 *
 * The last row in a group must not be `final`: that is what removes the closing
 * rule the group needs.
 */
function Group(props) {
  return <div className="settingsGroup">{props.children}</div>;
}

export { Row, Content, Action, Group };
