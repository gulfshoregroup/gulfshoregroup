// GTmetrix step 2 — if staying with Next's own image optimizer,
// serve AVIF/WebP and cache resized images for 30 days.
// (Preferred: use a Cloudinary loader with f_auto,q_auto instead.)
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
  },
};
