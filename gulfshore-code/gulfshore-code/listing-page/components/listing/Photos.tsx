// Photos: the first one loads first (it is the largest element on screen = LCP),
// the rest load lazily. Resized on Cloudinary as AVIF/WebP. Descriptive alt text.
// No sign-up wall — every photo is visible to visitors, Google and AI crawlers.
import { cloudinarySrcSet, cloudinaryUrl } from '@/lib/images';
import { photoAlt, type Listing } from '@/lib/seo/listing';
import s from './listing.module.css';

export function HeroPhoto({ listing }: { listing: Listing }) {
  const photos = listing.Photos ?? [];
  if (!photos.length) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={s.heroImg}
      src={cloudinaryUrl(photos[0], 960)}
      srcSet={cloudinarySrcSet(photos[0])}
      sizes="(max-width: 900px) 100vw, 680px"
      width={960}
      height={640}
      alt={photoAlt(listing, 0, photos.length)}
      fetchPriority="high"
      decoding="async"
    />
  );
}

export function AllPhotos({ listing }: { listing: Listing }) {
  const photos = listing.Photos ?? [];
  if (photos.length < 2) return null;
  return (
    <div className={s.gallery}>
      {photos.slice(1).map((p, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={p + i}
          src={cloudinaryUrl(p, 640)}
          srcSet={cloudinarySrcSet(p, [400, 640, 960])}
          sizes="(max-width: 700px) 100vw, 560px"
          width={640}
          height={427}
          alt={photoAlt(listing, i + 1, photos.length)}
          loading="lazy"
          decoding="async"
        />
      ))}
    </div>
  );
}
