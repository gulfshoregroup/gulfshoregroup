import UrlMaker from "@/hooks/url-maker";
import axios from "axios";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	robots: "noindex, nofollow",
	title: "Gulfshore Group - Real Estate Listings",
};

export async function fetchProperty(address: string) {
	const decodedAddress = decodeURI(address)
		.replaceAll(", ", "-")
		.replaceAll(" ", "-")
		.replaceAll("/", "-");
	const url = `https://gulfshoregroup.com/api/properties/propertybyaddress/${decodedAddress}`;
	try {
		const property = await axios.get(url);
		console.log(property); // Debugging: Log property data
		return property.data;
	} catch (error) {
		console.error("Error fetching property:", error);
		return null;
	}
}

export default async function SearchListingPage({
	params,
}: {
	params: { slug: string };
}) {
	const id = (await params).slug;
	const property = await fetchProperty(id!);

	redirect(
		UrlMaker(
			property.City,
			property.Development || property.DevelopmentName,
			property.FullAddress && property.FullAddress !== ""
				? property.PropertyAddress
				: property.MLSNumber
		)
	); // Redirect to `/properties/[id]`
}
