import { Filters } from "@/types/search";
import capitalizeWords from "@/hooks/capitalize-letter";
import Cities from "@/types/cities";

type QueryValue = string | string[] | undefined;
type QueryRecord = Record<string, QueryValue>;

const CSV_KEYS = new Set(["propertyTypes", "features"]);

const FILTER_KEYS: (keyof Filters)[] = [
	"beds",
	"baths",
	"minPrice",
	"maxPrice",
	"builtYearMin",
	"builtYearMax",
	"sort",
	"order",
	"propertyTypes",
	"postalCode",
	"page",
	"features",
	"hoa",
	"minAcres",
	"maxAcres",
	"status",
	"q",
	"subdivision",
	"school",
	"mls",
	"address",
	"developmentName",
	"minSqft",
	"maxSqft",
];

const BASE_SEARCH_PATH = "/Florida-Real-Estate-Search";

export const EMPTY_FILTERS: Filters = {
	city: "",
	developmentName: "",
	north: null,
	south: null,
	east: null,
	west: null,
	beds: "",
	baths: "",
	minPrice: "",
	maxPrice: "",
	builtYearMin: "",
	builtYearMax: "",
	sort: "",
	order: "",
	propertyTypes: [],
	postalCode: "",
	page: "1",
	features: [],
	hoa: "Any",
	minAcres: "",
	maxAcres: "",
	status: "Active",
	q: "",
	subdivision: "",
	school: "",
	mls: "",
	address: "",
	minSqft: "",
	maxSqft: "",
};

const normalizeString = (value: QueryValue): string => {
	if (Array.isArray(value)) return value[0] ?? "";
	return value ?? "";
};

const normalizeCsv = (value: QueryValue): string[] => {
	const raw = Array.isArray(value) ? value.join(",") : value ?? "";
	return raw
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
};

export const parseFiltersFromQuery = (query: QueryRecord): Partial<Filters> => {
	const parsed: Partial<Filters> = {};

	for (const key of FILTER_KEYS) {
		const value = query[key];
		if (CSV_KEYS.has(key)) {
			const items = normalizeCsv(value);
			if (items.length > 0) {
				if (key === "propertyTypes") parsed.propertyTypes = items;
				if (key === "features") parsed.features = items;
			}
			continue;
		}

		const str = normalizeString(value);
		if (!str) continue;
		(parsed as Record<string, string>)[key] = str;
	}

	return parsed;
};

export const parseFiltersFromSearchParams = (
	params: URLSearchParams
): Partial<Filters> => {
	const query: QueryRecord = {};
	for (const [key, value] of params.entries()) {
		query[key] = value;
	}
	return parseFiltersFromQuery(query);
};

export const buildQueryFromFilters = (
	filters: Partial<Filters>,
	current?: URLSearchParams
) => {
	const next = new URLSearchParams(current?.toString() ?? "");

	for (const key of FILTER_KEYS) {
		next.delete(key);
	}

	for (const key of FILTER_KEYS) {
		const value = filters[key];
		if (Array.isArray(value)) {
			if (value.length > 0) {
				next.set(key, value.join(","));
			}
			continue;
		}
		if (typeof value === "string" && value.trim()) {
			next.set(key, value.trim());
		}
	}

	return next;
};

const normalizePathToken = (value: string) =>
	value
		.replaceAll(/[-_]+/g, " ")
		.trim()
		.toLowerCase();

const isFilterSlug = (segment: string) => {
	const lower = segment.toLowerCase();
	const filters = [
		"-beds",
		"-baths",
		"-minprice",
		"-maxprice",
		"-minbuiltyear",
		"-maxbuiltyear",
		"sort=",
		"propertytypes=",
		"postalcode-",
		"page-",
		"keyword-",
	];
	const propertyTypes = ["homes", "residential-lots", "condos"];
	return (
		filters.some((f) => lower.startsWith(f) || lower.endsWith(f) || lower === f) ||
		propertyTypes.includes(lower)
	);
};

export const parseLocationFromPathname = (pathname: string) => {
	const segments = pathname.split("/").filter(Boolean);
	const baseIndex = segments.indexOf("Florida-Real-Estate-Search");
	const slugSegments =
		baseIndex >= 0 ? segments.slice(baseIndex + 1) : segments;

	if (!slugSegments.length) {
		return { city: "", developmentName: "" };
	}

	const knownCities = new Set(Cities.map((item) => normalizePathToken(item)));
	const first = slugSegments[0];
	const second = slugSegments[1];
	const firstNormalized = normalizePathToken(first);
	const secondNormalized = normalizePathToken(second || "");

	if (knownCities.has(firstNormalized)) {
		const devName = second && !isFilterSlug(second) ? second : "";
		return {
			city: capitalizeWords(first.replaceAll("-", " ")),
			developmentName: devName ? capitalizeWords(devName.replaceAll("-", " ")) : "",
		};
	}

	if (knownCities.has(secondNormalized)) {
		return {
			city: capitalizeWords(second!.replaceAll("-", " ")),
			developmentName: "",
		};
	}

	return { city: "", developmentName: "" };
};

export const buildSearchPathWithLocation = ({
	city,
	developmentName,
}: {
	city?: string | null;
	developmentName?: string | null;
}) => {
	const citySlug = (city || "")
		.trim()
		.replaceAll(/\s+/g, "-")
		.toLowerCase();
	const communitySlug = (developmentName || "")
		.trim()
		.replaceAll(/\s+/g, "-")
		.toLowerCase();

	if (citySlug && communitySlug) {
		return `${BASE_SEARCH_PATH}/${citySlug}/${communitySlug}`;
	}
	if (citySlug) {
		return `${BASE_SEARCH_PATH}/${citySlug}`;
	}
	return BASE_SEARCH_PATH;
};
