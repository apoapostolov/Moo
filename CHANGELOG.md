# Moo changelog

## 1.0.0 — 25 October 2026

Moo is a Firefox-only fork of [Mue](https://muetab.com), the new tab extension by The Mue Authors. It keeps the backgrounds, the weather and the widgets, drops the store and the account extras, and adds what this setup was missing.

### Added

- Unsplash topics: pick from the live topic list instead of four fixed collections.
- Coverr: free looping video clips as a background source, with an optional search.
- Pixabay and Pexels video clips, each using your own free API key.
- Live channels: 24/7 ambient streams (WildEarth, ZenLIFE, Love Nature, Red Bull TV) played behind the clock.
- Google widgets: mail, calendar and tasks, each with its own sign-in, and dialogs to create, edit or delete appointments and to add, rename, complete or delete tasks. Off by default, and they use your own Google OAuth client.
- A panel style switch in the weather, quick links and background information sections: Classic paints a dark panel, Glass lets the wallpaper show through.
- Google widgets gained their own settings once connected: which calendars feed the agenda and how far ahead it looks, what each event line carries, task list, sorting, grouping and filters, and the Gmail filter, custom search, preview text and unread indicator.
- Video backgrounds are queued ahead: the next clip is resolved and warmed, so a new tab starts on it at once.
- Unsplash and the Mue library are picked directly as sources, each with its own settings.
- Favouriting or downloading a library image now records it, so the trending picks improve as you use them.
- Animated background: a slow pan and zoom across the image. Off by default.
- Automatic background change on an interval you choose. Off by default.
- Background Information section, keeping the photo details and the location map apart from the display options.
- Quick Weather: a one-line weather widget under the clock, with its own toggle and a place in the widget order.
- Five-day forecast from Open-Meteo, replacing the single-day extra information.
- Show and hide toggles for each widget in Overview.
- Bulgarian language.

### Changed

- Firefox only, with its own add-on id so it installs next to Mue.
- The first run keeps the settings already in use in Mue.
- Background effects each get their own heading (blur, brightness, filter) instead of one shared block.
- Statistics fit on a single row with centred values.
- Only the current widget style remains; the old style switch is gone.
- Weather finds the location on its own at first launch, now that the search box is gone.
- Excluded images are actually skipped, and the background service is asked again when a request fails.
- Background sources are ordered by popularity, and only Coverr is marked as a video source, since Pixabay and Pexels fall back to an image without a key.
- The date lives inside the Time section now, after the clock options, with its own switch to show or hide it.

### Fixed

- The animated background can no longer pan past the edge of the image and show black strips.
- Weather spacing, and the min/max temperature alignment in the widget and the forecast.
- The weather widget no longer jumps in size while it loads: the placeholder matches the real layout.
- Hearts on library images were counted as missing likes.
- The quick link dialog had unlabelled fields rendered as raw browser inputs, and no backdrop behind it.
- The appointment and task dialogs sized themselves to their content and use the same panel as the weather and background information widgets.
- The analogue clock draws straight onto the wallpaper: no panel, no frost and no shadow behind the ring.
- Google widget rows keep to the card's own insets, the add button is a bare glyph, the task list name is plain text, and a ticked task stays in the list struck through instead of vanishing.
- The percentage clock can follow a work shift: set the start and end of your day (9 and 17, 9am and 5pm, or 9:30 and 17:30) and the percentage counts through the shift, not the whole 24 hours. Empty fields keep counting the whole day, and a shift that ends before it starts runs over midnight.
- Dropdowns near the bottom of a settings pane open upwards, so the panel style switch is never cut off by the window edge.
- The mail widget understands Gmail's inbox categories and can leave any of them out, with a tick list of Primary, Social, Promotions, Updates and Forums, plus your own folders and labels as extra sources. Mail now sits first in the Google widget settings.
- The widget order lists the Google widgets by their plain names, Mail, Calendar and Tasks, instead of prefixing each with Google.
- The calendar and folder tick lists line up with the other controls in Google settings instead of drifting to the right edge.
- The Mail, Calendar and Tasks cards each carry their own Classic or Glass panel switch at the bottom of the Google settings, so one card can go see-through while the others stay dark.
- The task list picker in the tasks card opens white on dark instead of near-black on dark grey, and the selects in the Google dialogs and settings follow the theme in their own lists.
- The Google setup steps say what to do in plain sentences instead of lecturing about what does not work yet.
- The widget settings in Google use one segmented Mail / Calendar / Tasks control instead of three small buttons, and nothing is shown until you pick one, so no widget's options look switched on by default.

### Removed

- Marketplace and Library.
- Quotes and greetings.
- Achievements.
- Search.
- The message form, and the support, contributors, supporters, photographers and curators sections in About.
