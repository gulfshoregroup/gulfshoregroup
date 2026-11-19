// Price, address, type and beds/baths in words — all in the first screen on a phone.
import {
  cityName, community, factsLine, fmtMoney, isActive, num, state, streetLine, typeLabel, type Listing,
} from '@/lib/seo/listing';
import s from './listing.module.css';

export function ListingHeader({ listing }: { listing: Listing }) {
  const price = num(listing.ListPrice);
  const comm = community(listing);
  const sub = [typeLabel(listing), listing.PropertySubType && listing.PropertySubType !== typeLabel(listing) ? listing.PropertySubType : null]
    .filter(Boolean)
    .join(' — ');
  return (
    <header>
      {!isActive(listing) && <p className={s.status}>{listing.StandardStatus ?? 'Off market'}</p>}
      <h1 className={s.address}>{streetLine(listing)}</h1>
      <p className={s.subline}>
        {cityName(listing)}, {state(listing)} {listing.PostalCode ?? ''}
        {comm ? ` · ${comm}` : ''}
      </p>
      <p className={s.subline}>{sub}</p>
      {price && <p className={s.price}>{fmtMoney(price)}</p>}
      <p className={s.facts}>{factsLine(listing)}</p>
    </header>
  );
}
