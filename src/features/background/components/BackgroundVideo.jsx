import { memo, useEffect, useMemo, useRef } from 'react';

/**
 * BackgroundVideo renders looping clips and live HLS channels.
 *
 * A live stream needs a player: Firefox has no native HLS support, so hls.js is
 * imported only when a live background is actually used, which keeps it out of
 * the bundle everyone else loads.
 */
function BackgroundVideo({ url, filterStyle, loop, muted, hls, live, maxHeight }) {
  const videoRef = useRef(null);
  const storedMute = useMemo(() => localStorage.getItem('backgroundVideoMute') === 'true', []);
  const storedLoop = useMemo(() => localStorage.getItem('backgroundVideoLoop') === 'true', []);

  // A looping source always plays muted and repeats: an unmuted video is blocked
  // by the browser's autoplay rules, which would leave a black background.
  const isMuted = muted ?? storedMute;
  const shouldLoop = loop ?? (live ? false : storedLoop);

  useEffect(() => {
    if (!hls || !url) return undefined;

    const video = videoRef.current;
    let player = null;
    let cancelled = false;

    (async () => {
      const { default: Hls } = await import('hls.js');
      if (cancelled || !video) return;

      if (!Hls.isSupported()) {
        video.src = url;
        return;
      }

      player = new Hls({
        // A blob worker would have to clear the extension CSP, and a single
        // background stream does not need one.
        enableWorker: false,
        maxBufferLength: 10,
        backBufferLength: 5,
      });

      player.loadSource(url);
      player.attachMedia(video);

      // Pick a rendition explicitly. The player sizes the element before layout,
      // so letting hls.js choose by element size lands on the 360p level.
      player.on(Hls.Events.MANIFEST_PARSED, () => {
        const limit = maxHeight || 1080;
        let best = -1;
        let bestHeight = 0;

        player.levels.forEach((level, index) => {
          const height = level.height || 0;
          if (height && height <= limit && height >= bestHeight) {
            best = index;
            bestHeight = height;
          }
        });

        if (best >= 0) player.currentLevel = best;
      });

      player.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) console.warn('Live background failed:', data.type, data.details);
      });
    })();

    return () => {
      cancelled = true;
      if (player) player.destroy();
    };
  }, [url, hls]);

  // A live stream keeps downloading while the tab is hidden; park it instead.
  useEffect(() => {
    if (!live) return undefined;

    const onVisibility = () => {
      const video = videoRef.current;
      if (!video) return;

      if (document.hidden) video.pause();
      else video.play().catch(() => {});
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [live]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted={isMuted}
      loop={shouldLoop}
      playsInline
      style={filterStyle}
      id="backgroundVideo"
    >
      {!hls && <source src={url} />}
    </video>
  );
}

export default memo(BackgroundVideo);
