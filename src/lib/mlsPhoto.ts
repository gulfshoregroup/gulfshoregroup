/**
 * MLS listing photos (Bridge / CloudFront / S3) are served straight from
 * their own CDN instead of through Next's image optimizer (/_next/image).
 *
 * On production the optimizer rejects these CloudFront photos ("The requested
 * resource isn't a valid image ... received null", HTTP 400), even though the
 * same URLs return valid JPEGs to browsers. Result: every listing card showed
 * "No Image Available". Loading them directly fixes that and also takes the
 * image work off the Railway server.
 */
const MLS_PHOTO_HOSTS = /(\.cloudfront\.net|bridgedataoutput\.com|\.amazonaws\.com)\//i;

export function isMlsPhoto(src?: string | null): boolean {
	return typeof src === "string" && MLS_PHOTO_HOSTS.test(src);
}
