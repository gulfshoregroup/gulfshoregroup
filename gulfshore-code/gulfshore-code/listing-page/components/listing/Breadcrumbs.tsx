// Visible breadcrumb: Home › Naples › 286 Indies Dr E 202 (matches the BreadcrumbList schema)
import Link from 'next/link';
import { cityName, cityPath, community, streetLine, type Listing } from '@/lib/seo/listing';
import s from './listing.module.css';

export function Breadcrumbs({ listing }: { listing: Listing }) {
  const comm = community(listing);
  return (
    <nav aria-label="Breadcrumb" className={s.breadcrumbs}>
      <ol>
        <li><Link href="/">Home</Link></li>
        <li><Link href={cityPath(listing)}>{cityName(listing)} homes for sale</Link></li>
        {comm && <li><span>{comm}</span></li>}
        <li aria-current="page">{streetLine(listing)}</li>
      </ol>
    </nav>
  );
}
