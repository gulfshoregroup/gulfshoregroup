"use client";

import Image, { type ImageProps } from "next/image";
import cloudinaryLoader from "@/lib/cloudinaryLoader";

/**
 * next/image that loads Cloudinary images straight from Cloudinary's CDN
 * (see src/lib/cloudinaryLoader.ts). A client wrapper is needed because a
 * loader function can't be passed from a Server Component.
 */
export default function CloudinaryImage(props: ImageProps) {
	return <Image loader={cloudinaryLoader} {...props} />;
}
