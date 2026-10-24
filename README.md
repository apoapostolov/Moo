# Moo

<p align="center">A fast, open and free-to-use new tab page for Firefox — a Firefox-focused fork of <a href="https://github.com/mue/mue">Mue</a>.</p>

<p align="center"><a href="https://github.com/apoapostolov/Moo">github.com/apoapostolov/Moo</a></p>

<div align="center">

[![Firefox](./assets/firefox.svg)](https://addons.mozilla.org/en-GB/firefox/addon/mue/)

</div>

## Why Moo?

- Firefox-focused build (Manifest V3, `browser_specific_settings.gecko`)
- Beautiful and Minimalist Design
- Customisable Layout
- Widgets (such as weather, notes, bookmarks and more)
- Privacy-Focused - does not track your browsing activity
- Open Source under the BSD-3 License

## Installation

Build the Firefox extension locally and sideload it:

1. `bun install`
2. `bun run build`
3. In Firefox, open `about:debugging` -> This Firefox -> Load Temporary Add-on -> select `build/firefox/manifest.json`

## Development

Install dependencies with `bun install`, then:

- `bun run dev[:host]` - start development server
- `bun run build` - build production copy for Firefox
- `bun run lint[:fix]` - run linter
- `bun run pretty` - run prettier

### Contributing

This is a personal fork. Upstream project: [mue/mue](https://github.com/mue/mue).

## Attribution

Forked from [Mue](https://github.com/mue/mue) (BSD-3-Clause). Stock photos: [Pexels](https://pexels.com), [Unsplash](https://unsplash.com). Welcome modal images: [Undraw](https://undraw.co).
