const linkStyle = { color: 'var(--modal-link)', textDecoration: 'none' };

const CHANGELOG = [
  {
    version: '1.0.0',
    date: '25 October 2026',
    summary: (
      <>
        Moo is a Firefox-only fork of{' '}
        <a href="https://muetab.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>
          Mue
        </a>
        , the new tab extension by The Mue Authors. It keeps the backgrounds, the weather and the
        widgets, drops the store and the account extras, and adds what this setup was missing.
      </>
    ),
    groups: [
      {
        title: 'Added',
        items: [
          'Unsplash topics: pick from the live topic list instead of four fixed collections.',
          'Coverr: free looping video clips as a background source, with an optional search.',
          'Unsplash and Pexels (the Mue image library) are picked directly as sources, each with its own settings.',
          'Favouriting or downloading a library image now records it, so the trending picks improve as you use them.',
          'Animated background: a slow pan and zoom across the image. Off by default.',
          'Automatic background change on an interval you choose. Off by default.',
          'Background Information section, keeping the photo details and the location map apart from the display options.',
          'Quick Weather: a one-line weather widget under the clock, with its own toggle and a place in the widget order.',
          'Five-day forecast from Open-Meteo, replacing the single-day extra information.',
          'Show and hide toggles for each widget in Overview.',
          'Bulgarian language.',
        ],
      },
      {
        title: 'Changed',
        items: [
          'Firefox only, with its own add-on id so it installs next to Mue.',
          'The first run keeps the settings already in use in Mue.',
          'Background effects each get their own heading (blur, brightness, filter) instead of one shared block.',
          'Statistics fit on a single row with centred values.',
          'Only the current widget style remains; the old style switch is gone.',
          'Weather finds the location on its own at first launch, now that the search box is gone.',
          'Excluded images are actually skipped, and the background service is asked again when a request fails.',
        ],
      },
      {
        title: 'Fixed',
        items: [
          'The animated background can no longer pan past the edge of the image and show black strips.',
          'Weather spacing, and the min/max temperature alignment in the widget and the forecast.',
          'Hearts on library images were counted as missing likes.',
        ],
      },
      {
        title: 'Removed',
        items: [
          'Marketplace and Library.',
          'Quotes and greetings.',
          'Achievements.',
          'Search.',
          'The message form, and the support, contributors, supporters, photographers and curators sections in About.',
        ],
      },
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
            <span style={{ fontSize: '0.7em', opacity: 0.6, fontWeight: 'normal' }}>
              ({entry.date})
            </span>
          </h2>
          {entry.summary && (
            <p style={{ margin: '8px 0 0 0', lineHeight: 1.6, maxWidth: '75ch' }}>
              {entry.summary}
            </p>
          )}
          {entry.groups.map((group) => (
            <div key={group.title} style={{ marginTop: '16px' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1em', opacity: 0.85 }}>
                {group.title}
              </h3>
              <ul style={{ margin: '0 0 0 20px', padding: 0 }}>
                {group.items.map((item) => (
                  <li key={item} style={{ marginBottom: '4px', lineHeight: 1.5 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export { Changelog as default, Changelog };
