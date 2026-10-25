import { readRecent, rememberClip, pickUnseen } from './videoHistory';

// Coverr's site API. It is not a documented public API, so every response is
// treated as untrusted: premium clips and vertical clips are skipped, and the
// caller falls back to the offline image when nothing usable comes back.
const COVERR_URL = 'https://coverr.co/api/videos';
const RECENT_KEY = 'coverrRecent';
const PAGES = 40;
const ATTEMPTS = 4;

const usableClip = (hit) =>
  Boolean(hit?.urls?.mp4) && hit.is_premium !== true && hit.is_vertical !== true;

const clipKey = (hit) => (usableClip(hit) ? hit.slug : null);

/**
 * Fetches one random looping video clip. Coverr has no exclude parameter, so a
 * few pages are tried until one carries a clip that is not already on screen.
 */
export async function fetchCoverrVideo() {
  const query = (localStorage.getItem('coverrQuery') || '').trim();
  const recent = readRecent(RECENT_KEY);

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const params = new URLSearchParams({
      page: String(1 + Math.floor(Math.random() * PAGES)),
      urls: 'true',
    });

    if (query) {
      params.set('query', query);
    }

    try {
      const response = await fetch(`${COVERR_URL}?${params.toString()}`);

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      // The last attempt accepts a repeat: an older clip beats a blank fallback.
      const clip = pickUnseen(
        Array.isArray(data?.hits) ? data.hits : [],
        attempt === ATTEMPTS - 1 ? [] : recent,
        clipKey,
      );

      if (!clip) {
        continue;
      }

      rememberClip(RECENT_KEY, clip.slug);

      return {
        url: clip.urls.mp4,
        video: true,
        loop: true,
        muted: true,
        type: 'api',
        currentAPI: 'coverr',
        photoInfo: {
          hidden: false,
          id: clip.slug,
          api: 'coverr',
          credit: (clip.title || 'Coverr').trim(),
          location: null,
          camera: null,
          colour: null,
          blur_hash: clip.blur_hash ?? null,
          duration: clip.duration,
        },
      };
    } catch {
      // Try another page.
    }
  }

  return null;
}
