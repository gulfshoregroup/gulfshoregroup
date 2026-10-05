import axios from "axios";
import { redirect } from "next/navigation";
import { cache } from "react";

export default async function FetchProperties(params: string[]) {
	const paramsString = params.join("&");
	try {
		const response = await axios.get(
			`/api/properties?${paramsString}`
		);
		if (response.data.success) {
			return response.data;
		}
	} catch (error) {
		return;
	}
}

export const FetchProperty = cache(async (params: string) => {
	const slug = decodeURIComponent(params);
	try {
		let baseUrl = typeof window === 'undefined' ? (process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, '') || "https://gulfshoregroup.com") : "";
		if (typeof window === 'undefined' && !process.env.NEXT_PUBLIC_SERVER_URL && process.env.RAILWAY_PUBLIC_DOMAIN) {
			baseUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
		}
		// In local development, always hit local server directly via IPv4 loopback
		if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
			baseUrl = `http://127.0.0.1:${process.env.PORT || 3000}`;
		}

		const res = await fetch(`${baseUrl}/api/v2/properties/${slug}`, {
			method: "GET",
			next: { revalidate: 300 }, // Cache server-side for 5 minutes
		});
		const response = await res.json();

		if (response.success) {
			return response.data;
		}
	} catch (error) {
		let url = typeof window === 'undefined' ? (process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, '') || "https://gulfshoregroup.com") : "";
		if (typeof window === 'undefined' && !process.env.NEXT_PUBLIC_SERVER_URL && process.env.RAILWAY_PUBLIC_DOMAIN) {
			url = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
		}
		return redirect(`${url}/Florida-Real-Estate-Search`);
	}
});

