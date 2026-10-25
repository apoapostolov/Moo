import { memo, useMemo } from 'react';

/**
 * BackgroundVideo component for rendering video backgrounds
 */
function BackgroundVideo({ url, filterStyle, loop, muted }) {
  const storedMute = useMemo(() => localStorage.getItem('backgroundVideoMute') === 'true', []);
  const storedLoop = useMemo(() => localStorage.getItem('backgroundVideoLoop') === 'true', []);

  // A looping source always plays muted and repeats: an unmuted video is blocked
  // by the browser's autoplay rules, which would leave a black background.
  const isMuted = muted ?? storedMute;
  const shouldLoop = loop ?? storedLoop;

  return (
    <video
      autoPlay
      muted={isMuted}
      loop={shouldLoop}
      style={filterStyle}
      id="backgroundVideo"
    >
      <source src={url} />
    </video>
  );
}

export default memo(BackgroundVideo);
