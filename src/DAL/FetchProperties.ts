import axios from "axios";
import { redirect } from "next/navigation";

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

export async function FetchProperty(params: string) {
	const slug = decodeURIComponent(params);
	try {
		let baseUrl = typeof window === 'undefined' ? (process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, '') || "https://gulfshoregroup.com") : "";
		if (typeof window === 'undefined' && !process.env.NEXT_PUBLIC_SERVER_URL && process.env.RAILWAY_PUBLIC_DOMAIN) {
			baseUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
		}

		const res = await fetch(`${baseUrl}/api/v2/properties/${slug}`, {
			method: "GET",
			cache: "no-store",
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
}
