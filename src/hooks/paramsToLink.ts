import { SortItems } from "@/lib/constants";
import capitalizeWords from "./capitalize-letter";

interface ParamsToLinkProps {
	params: {
		city?: string;
		community?: string;
		type?: string;
		sort?: string;
		order?: "asc" | "desc" | string;
	};
}

const sanitize = (value: string) =>
	value
		.trim()
		.replace(/\s+/g, "-")
		.replace(/[^a-zA-Z0-9\-]/g, ""); // remove special chars

const paramsToLink = ({ params }: ParamsToLinkProps) => {
	const city = params.city
		? sanitize(capitalizeWords(params.city))
		: "";
	const community = params.community
		? sanitize(params.community)
		: "";
	let url = "";

	// --- Base Path ---
	if (params.type) {
		url = community
			? `/Florida-Real-Estate-Search/${sanitize(
					params.type
			  )}/${city}/${community}`
			: `/Florida-Real-Estate-Search/${sanitize(
					params.type
			  )}/${city}`;
	} else {
		url = community
			? `/Florida-Real-Estate-Search/${city}/${community}`
			: `/Florida-Real-Estate-Search/${city}`;
	}

	// --- Sort ---
	if (params.sort && params.order) {
		const found = SortItems.find(
			(item) =>
				item.sort === params.sort && item.order === params.order
		);
		if (found) {
			url += `/sort=${sanitize(found.label)}`;
		}
	}

	return url.replaceAll("//", "/");
};

export default paramsToLink;
