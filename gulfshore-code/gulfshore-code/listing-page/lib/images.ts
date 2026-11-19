// lib/images.ts
// Resize listing photos on Cloudinary's CDN as AVIF/WebP (f_auto,q_auto) instead of on Railway.
// For MLS photos hosted elsewhere this uses Cloudinary "fetch" — add the MLS photo domain
// to Settings → Security → "Allowed fetch domains" in Cloudinary first.
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD ?? 'dm68hqwp9';

export function cloudinaryUrl(
  src: string,
  width: number,
  opts: { height?: number; crop?: 'fill' | 'limit' } = {}
): string {
  if (!src) return '';
  const t = ['f_auto', 'q_auto', `w_${width}`, opts.height ? `h_${opts.height}` : '', `c_${opts.crop ?? 'limit'}`]
    .filter(Boolean)
    .join(',');
  // Already on Cloudinary: insert the transformation after /upload/
  const m = src.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/);
  if (m) return `${m[1]}${t}/${m[2]}`;
  return `https://res.cloudinary.com/${CLOUD}/image/fetch/${t}/${encodeURIComponent(src)}`;
}

export function cloudinarySrcSet(src: string, widths = [400, 640, 960, 1280, 1600]): string {
  return widths.map((w) => `${cloudinaryUrl(src, w)} ${w}w`).join(', ');
}
