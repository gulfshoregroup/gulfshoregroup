// Similar homes: same type, same community first, within ±30% of the price.
import Link from 'next/link';
import { cloudinaryUrl } from '@/lib/images';
import {
  cityName, cityPath, factsLine, fmtMoney, listingPath, num, photoAlt, streetLine, typeLabel, type Listing,
} from '@/lib/seo/listing';
import s from './listing.module.css';

export function SimilarHomes({ listing, homes }: { listing: Listing; homes: Listing[] }) {
  return (
    <>
      {homes.length > 0 ? (
        <div className={s.cards}>
          {homes.map((h) => {
            const price = num(h.ListPrice);
            const photo = h.Photos?.[0];
            return (
              <Link key={h.ListingId} href={listingPath(h)} className={s.card}>
                {photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cloudinaryUrl(photo, 480)} width={480} height={320} alt={photoAlt(h, 0, h.Photos!.length)} loading="lazy" decoding="async" />
                )}
                <div className={s.cardBody}>
                  {price && <p className={s.cardPrice}>{fmtMoney(price)}</p>}
                  <p className={s.cardAddr}>{streetLine(h)}, {cityName(h)}</p>
                  <p>{typeLabel(h)} · {factsLine(h)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p>No similar homes are for sale right now.</p>
      )}
      <p className={s.links} style={{ marginTop: 20 }}>
        <Link className={`${s.btn} ${s.btnSecondary}`} href={cityPath(listing)}>
          See all {cityName(listing)} homes for sale
        </Link>
      </p>
    </>
  );
}
