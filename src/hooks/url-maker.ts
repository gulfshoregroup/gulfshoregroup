import capitalizeWords from "./capitalize-letter";

export default function UrlMaker(city: string, community: string, address: string, id?: string) {
	const communityName = community || 'others';
	// Convert spaces & special characters to hyphens
	const formattedCity = capitalizeWords(city)?.replaceAll(/\s+/g, "-");
	const formattedCommunity = capitalizeWords(communityName)?.replaceAll(/\s+/g, "-");
	const formattedAddress = address?.replaceAll(", ", "-").replaceAll(" ", "-").replaceAll("/", "-").replaceAll('--','-');

	return `/Florida-Real-Estate-Listings/${formattedCity}/${formattedCommunity}/${formattedAddress}${id ? `/${id}` : ""}`;
}