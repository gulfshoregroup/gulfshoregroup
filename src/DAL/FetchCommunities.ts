import capitalizeWords from "@/hooks/capitalize-letter";

async function fetchCommunities(city: string) {
	try {
		const url = typeof window === 'undefined' ? (process.env.NEXT_PUBLIC_SERVER_URL || "https://gulfshoregroup.com") : "";
		const res = await fetch(
			`${url}/api/v2/cities/${capitalizeWords(
				city.replaceAll("-", " ")
			)}/communities/`
		);
		const data = await res.json();

		return data;
	} catch (error) {
		//  console.error(error);
		return [];
	}
}

export default fetchCommunities;
