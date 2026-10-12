export interface Coordinates {
	north: number;
	east: number;
	west: number;
	south: number;
}

export interface Filters {
	city: string | null;
	developmentName: string | null;
	north: number | null;
	south: number | null;
	east: number | null;
	west: number | null;
	beds: string;
	baths: string;
	minPrice: string;
	maxPrice: string;
	builtYearMin: string;
	builtYearMax: string;
	sort: string;
	order: string;
	propertyTypes: string[];
	postalCode: string;
	page: string;
	features: string[];
	// New filters
	hoa?: string;
	minAcres?: string;
	maxAcres?: string;
	status?: string;
	q?: string;
	subdivision?: string;
	school?: string;
	mls?: string;
	address?: string;
	minSqft?: string;
	maxSqft?: string;
}


export interface ViewHistoryObj {
	viewCount: number;
	PropertyAddress: string;
	id: string;
}

export interface SearchHistoryObj {
	filters: Filters;
	searchCount: number;
	total: number;
}
export interface UiState {
	success: Boolean | null;
	mobileMapView: Boolean;
	listView: Boolean;
	list: Property[];
	limit: number;
	total: number | null;
	totalPages: number | null;
	details: Property | null;
	loading: boolean;
	error: string | null;
	filters: Filters;
	user: string;
	viewCount: number;
	hoveredMLS: string | null;
}

