import BackgroundImage from './components/BackgroundImage';
import BackgroundVideo from './components/BackgroundVideo';

import { useBackgroundState } from './hooks/useBackgroundState';
import { useBackgroundLoader } from './hooks/useBackgroundLoader';
import { useBackgroundRenderer, useBackgroundFilters, useBackgroundOverlayFilters } from './hooks/useBackgroundRenderer';
import { useBackgroundEvents } from './hooks/useBackgroundEvents';

import { useEffect } from 'react';
import EventBus from 'utils/eventbus';

import './scss/index.scss';

/**
 * Background component - Manages and displays backgrounds
 * Supports: API images, custom images, colors, gradients, videos, and photo packs
 */
export default function Background() {
  const { backgroundData, updateBackground, resetBackground } = useBackgroundState();
  const { refreshBackground } = useBackgroundLoader(updateBackground, resetBackground);
  const filterStyle = useBackgroundFilters();
  const overlayFilterStyle = useBackgroundOverlayFilters();

  useBackgroundRenderer(backgroundData);
  useBackgroundEvents(backgroundData, refreshBackground);

  useEffect(() => {
    const apply = () => {
      const enabled = localStorage.getItem('bgpanzoom') === 'true';
      document.body.classList.toggle('bg-animated', enabled);
    };
    apply();
    const onRefresh = (data) => {
      if (data === 'background' || data === 'bgpanzoom') apply();
    };
    EventBus.on('refresh', onRefresh);
    return () => EventBus.off('refresh', onRefresh);
  }, []);

  return (
    <>
      {backgroundData.video ? (
        <BackgroundVideo url={backgroundData.url} filterStyle={filterStyle} />
      ) : (
        <BackgroundImage
          photoInfo={backgroundData.photoInfo}
          currentAPI={backgroundData.currentAPI}
          url={backgroundData.url}
        />
      )}
      <div id="backgroundFilterOverlay" style={overlayFilterStyle} />
    </>
  );
}
