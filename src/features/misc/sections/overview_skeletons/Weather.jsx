import { memo } from 'react';

function WeatherSkeleton() {
  return <span className="weather">Weather</span>;
}

export default memo(WeatherSkeleton);
