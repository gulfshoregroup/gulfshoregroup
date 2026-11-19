// Location without loading a heavy map on every listing: two clear links.
import { coord, fullAddress, type Listing } from '@/lib/seo/listing';
import s from './listing.module.css';

export function Location({ listing }: { listing: Listing }) {
  const lat = coord(listing.Latitude);
  const lng = coord(listing.Longitude);
  const q = lat !== null && lng !== null ? `${lat},${lng}` : fullAddress(listing);
  return (
    <div>
      <p>{fullAddress(listing)}</p>
      <div className={s.links}>
        {lat !== null && lng !== null && (
          <a className={`${s.btn} ${s.btnSecondary}`} href={`/Florida-Real-Estate-Search?view=map&lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}&zoom=16`}>
            Show on the map with nearby homes
          </a>
        )}
        <a
          className={`${s.btn} ${s.btnSecondary}`}
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Google Maps
        </a>
      </div>
    </div>
  );
}
