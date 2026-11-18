import type { ImageLoaderProps } from "next/image";

/**
 * next/image loader for res.cloudinary.com images.
 *
 * Without it, Cloudinary images are downloaded by our Railway server
 * (/_next/image) and re-encoded there, so the browser waits on a second hop
 * through a server with no CDN. With it, the browser gets the right width
 * straight from Cloudinary's CDN (f_auto = WebP/AVIF, q_auto = smart quality).
 *
 * Works with URLs like:
 *   https://res.cloudinary.com/<cloud>/image/upload/<optional transforms>/v123/<id>.jpg
 */
export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
	const marker = "/image/upload/";
	const i = src.indexOf(marker);
	if (!src.includes("res.cloudinary.com") || i === -1) return src;

	const head = src.slice(0, i + marker.length);
	let rest = src.slice(i + marker.length);
	// Drop an existing transformation segment (e.g. "f_auto,q_auto,w_1920/").
	const firstSeg = rest.split("/")[0];
	if (/^[a-z]{1,3}_[^/]*$/.test(firstSeg) && !/^v\d+$/.test(firstSeg)) {
		rest = rest.slice(firstSeg.length + 1);
	}
	const q = quality ? `q_${quality}` : "q_auto";
	return `${head}f_auto,${q},c_limit,w_${width}/${rest}`;
}
