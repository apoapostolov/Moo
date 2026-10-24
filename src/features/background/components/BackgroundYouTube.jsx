import { memo, useMemo } from 'react';

/**
 * Build a YouTube embed URL from a user-provided URL.
 * Supports single videos and playlists (shuffled).
 */
function buildEmbedUrl(input) {
  if (!input) return null;
  const raw = input.trim();
  let videoId = null;
  let playlistId = null;

  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    if (url.hostname.includes('youtu.be')) {
      videoId = url.pathname.replace('/', '');
    } else if (url.searchParams.has('v')) {
      videoId = url.searchParams.get('v');
    }
    if (url.searchParams.has('list')) {
      playlistId = url.searchParams.get('list');
    }
    // playlist-only URL: /playlist?list=...
    if (!videoId && url.pathname.includes('playlist')) {
      playlistId = url.searchParams.get('list');
    }
  } catch {
    // Maybe a bare ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) videoId = raw;
    else if (raw.startsWith('PL') || raw.startsWith('UU') || raw.startsWith('FL')) playlistId = raw;
  }

  const params = 'autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&loop=1';

  if (playlistId && !videoId) {
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&shuffle=1&${params}`;
  }
  if (videoId) {
    const listParam = playlistId ? `&list=${playlistId}` : '';
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params}${listParam}`;
  }
  return null;
}

function BackgroundYouTube({ url }) {
  const embedUrl = useMemo(() => buildEmbedUrl(url), [url]);
  if (!embedUrl) return null;

  return (
    <iframe
      id="backgroundYouTube"
      src={embedUrl}
      title="Videoscape"
      frameBorder="0"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        zIndex: -3,
        pointerEvents: 'none',
      }}
    />
  );
}

export default memo(BackgroundYouTube);