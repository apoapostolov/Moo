# Moo changelog

## 1.0.0 — 25 October 2026

Moo is a Firefox-only fork of [Mue](https://muetab.com), the new tab extension by The Mue Authors. It keeps the backgrounds, the weather and the widgets, drops the store and the account extras, and adds what this setup was missing.

### Added

- Unsplash topics: pick from the live topic list instead of four fixed collections.
- Coverr: free looping video clips as a background source, with an optional search.
- Pixabay and Pexels video clips, each using your own free API key.
- Live channels: 24/7 ambient streams (WildEarth, ZenLIFE, Love Nature, Red Bull TV) played behind the clock.
- Google widgets: mail, calendar and tasks, each with its own sign-in, and dialogs to create, edit or delete appointments and to add, rename, complete or delete tasks. Off by default, and they use your own Google OAuth client.
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

### Removed

- Marketplace and Library.
- Quotes and greetings.
- Achievements.
- Search.
- The message form, and the support, contributors, supporters, photographers and curators sections in About.
