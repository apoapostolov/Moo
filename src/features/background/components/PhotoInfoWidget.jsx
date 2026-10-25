import { memo } from 'react';

import PhotoInformation from './PhotoInformation';
import { useCurrentPhoto } from '../photoStore';

import '../scss/_photoinformation.scss';

/**
 * Image Info as a widget: the same credit card the background used to pin to
 * its own corner, now placeable in any of the three zones.
 *
 * PhotoInformation already answers for the Display setting that shows and hides
 * it, so this only decides whether there is a photo to credit at all.
 */
/**
 * Some pictures come with nowhere to point: Pexels, Pixabay and video sources
 * carry no location at all. With the setting on, a credit with no place on it
 * is not drawn, so the card is either a place you can learn or nothing.
 */
const hasLocation = (info) => Boolean(info?.location && info.location !== 'N/A');

function PhotoInfoWidget() {
  const { photoInfo, api, url } = useCurrentPhoto();

  if (!photoInfo?.credit || photoInfo.hidden) return null;

  const wantsLocation = localStorage.getItem('photoInfoRequiresLocation') !== 'false';

  if (wantsLocation && !hasLocation(photoInfo)) return null;

  return <PhotoInformation info={photoInfo} api={api} url={url} />;
}

export default memo(PhotoInfoWidget);
