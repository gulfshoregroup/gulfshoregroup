// Three big contact buttons right under the price: Schedule a showing · Call · Email a question.
// Works without JavaScript. Point the showing link at your existing contact form.
import { EMAIL, PHONE_DISPLAY, PHONE_TEL, fullAddress, listingUrl, type Listing } from '@/lib/seo/listing';
import s from './listing.module.css';

export function ListingCta({ listing }: { listing: Listing }) {
  const addr = fullAddress(listing);
  const subject = encodeURIComponent(`Question about ${addr} (MLS ${listing.ListingId})`);
  const body = encodeURIComponent(`Hi Dimitri,\n\nI have a question about ${addr}:\n${listingUrl(listing)}\n\n`);
  return (
    <div className={s.ctas}>
      <a className={`${s.btn} ${s.btnPrimary}`} href={`/contact?topic=showing&listing=${encodeURIComponent(listing.ListingId)}`}>
        Schedule a showing
      </a>
      <a className={`${s.btn} ${s.btnSecondary}`} href={`tel:${PHONE_TEL}`}>
        Call {PHONE_DISPLAY}
      </a>
      <a className={`${s.btn} ${s.btnSecondary}`} href={`mailto:${EMAIL}?subject=${subject}&body=${body}`}>
        Email a question
      </a>
    </div>
  );
}
