import {
	createSlice,
	createAsyncThunk,
	PayloadAction,
} from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../store";
import {
	fetchPropertiesApi,
	syncRecentViewsToDB,
	syncSearchToDb,
} from "../api";
import { Coordinates, Filters, UiState } from "@/types/search";
import ExtractSearchParams from "@/hooks/extractSearchParams";
import { EMPTY_FILTERS } from "@/lib/search-filters";

const initialState: UiState = {
	viewCount: 0,
	user: "",
	success: null,
	mobileMapView: false,
	listView: false,
	list: [],
	total: null,
	limit: 36,
	totalPages: 0,
	details: null,
	loading: false,
	error: null,
	filters: { ...EMPTY_FILTERS },
	hoveredMLS: null,
};

// --- Fetch Properties with Filters ---
export const fetchProperties = createAsyncThunk<
	{
		total: any;
		totalPages: any;
		success: Boolean;
		data: Property[];
		page: any;
	},
	void,
	{ state: RootState }
>("properties/fetch", async (_, { getState }) => {
	const { search } = getState();
	const { filters, limit } = search;
	const data = await fetchPropertiesApi({ filters, limit });
	return data;
});

export const syncRecentViews = createAsyncThunk(
	"property/sync",
	async (id: string) => {
		const response = await syncRecentViewsToDB(id);
		return null;
	}
);
export const syncGuestSearch = createAsyncThunk(
	"property/sync",
	async (query: string) => {
		const filter = await ExtractSearchParams(query.split("/"));
		const response = await syncSearchToDb({
			...filter,
			north: null,
			south: null,
			east: null,
			west: null,
		});
		return null;
	}
);
const searchSlice = createSlice({
	name: "search",
	initialState,
	reducers: {
		setMobileMapView: (state, action: PayloadAction<Boolean>) => {
			state.mobileMapView = action.payload;
			state.limit = 80;
		},
		setListView: (state, action: PayloadAction<Boolean>) => {
			state.listView = action.payload;
			state.limit = 18;
		},
		setLimit: (state, action: PayloadAction<number>) => {
			state.limit = action.payload;
		},
		setFilters: (state, action: PayloadAction<Filters>) => {
			state.filters = action.payload;
		},
		setMapCard: (state, action: PayloadAction<Property | null>) => {
			state.details = action.payload;
		},
		setHoveredMLS: (state, action: PayloadAction<string | null>) => {
			state.hoveredMLS = action.payload;
		},
		setCoordinates: (state, action: PayloadAction<Coordinates>) => {

			const coordinate = action.payload;
			state.filters = {
				...state.filters,
				...coordinate,
			};
		},
		clearFilters(state) {
			state.filters = { ...EMPTY_FILTERS };
		},
		setSort(
			state,
			action: PayloadAction<{
				sort: string;
				order: string;
			}>
		) {
			const { sort, order } = action.payload;
			state.filters = {
				...state.filters,
				order,
				sort,
				page: "1",
			};
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchProperties.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchProperties.fulfilled, (state, action) => {
				state.loading = false;
				state.list = action.payload.data;
				state.total = action.payload.total;
				state.totalPages = action.payload.totalPages;
				state.success = true;
			})
			.addCase(fetchProperties.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to fetch properties";
			});
	},
});

export const {
	setFilters,
	setCoordinates,
	clearFilters,
	setSort,
	setMobileMapView,
	setLimit,
	setListView,
	setMapCard,
	setHoveredMLS,
} = searchSlice.actions;
export default searchSlice.reducer;
export const selectUi = (s: RootState) => s.search;
export const selectAllProperties = (s: RootState) =>
	s.search.list as any as Property[];
