import variables from 'config/variables';

const CHANGELOG = [
  {
    version: '1.0.0',
    date: '2026-10-24',
    changes: [
      'Forked from Moo and rebranded to Moo (Firefox only).',
      'Removed Marketplace and Library.',
      'Removed quotes and greetings functionality.',
      'Removed the achievement system.',
      'Removed search functionality (deprecated in 7.2).',
      'Settings UI rebranded to Moo.',
      'Default settings based on the user\'s existing Moo configuration.',
      'Added Bulgarian (bg) language locale.',
      'Reworked extension icon with a cow glyph.',
      'Removed support, contributors, supporters, photographers and curators sections from About.',
    ],
  },
];

const Changelog = () => {
  return (
    <div style={{ padding: '16px', overflowY: 'auto', height: '100%' }}>
      {CHANGELOG.map((entry) => (
        <div key={entry.version} style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 4px 0' }}>
            {entry.version}{' '}
            <span style={{ fontSize: '0.7em', color: '#888', fontWeight: 'normal' }}>
              ({entry.date})
            </span>
          </h2>
          <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
            {entry.changes.map((change, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>
                {change}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export { Changelog as default, Changelog };
