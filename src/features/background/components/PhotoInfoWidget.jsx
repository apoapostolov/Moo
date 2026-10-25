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
function PhotoInfoWidget() {
  const { photoInfo, api, url } = useCurrentPhoto();

  if (!photoInfo?.credit || photoInfo.hidden) return null;

  return <PhotoInformation info={photoInfo} api={api} url={url} />;
}

export default memo(PhotoInfoWidget);
