"use client";

import React, {
	useState,
	useEffect,
	useRef,
	useCallback,
} from "react";
import { Search, X, MapPin, Clock, TrendingUp } from "lucide-react";
import { Button } from "../ui/button";
import axios from "axios";
import { useRouter } from "next/navigation";
import capitalizeWords from "@/hooks/capitalize-letter";
import UrlMaker from "@/hooks/url-maker";

interface Suggestion {
	text: string;
	type?:
		| "address"
		| "city"
		| "community"
		| "mls"
		| "zipcode"
		| "recent"
		| "popular";
	city?: string;
	community?: string;
	MLSNumber?: string;
}

const SearchBox = () => {
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [selectedSuggestion, setSelectedSuggestions] =
		useState<Suggestion | null>();
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const [isLoading, setIsLoading] = useState(false);
	const [recentSearches, setRecentSearches] = useState<Suggestion[]>(
		[]
	);
	const inputRef = useRef<HTMLInputElement>(null);
	const suggestionsRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const popularSearches: Suggestion[] = [
		{
			text: "Naples",
			type: "city",
		},

		{ text: "Bonita Springs", type: "city" },
		{
			text: "Estero",
			type: "city",
		},
		{
			text: "Marco Island",
			type: "city",
		},
		{
			text: "Fort Myers",
			type: "city",
		},
		{
			text: "Cape Coral",
			type: "city",
		},
	];

	// Simulate API call for suggestions
	const fetchSuggestions = useCallback(
		async (searchQuery: string) => {
			if (!searchQuery.trim()) {
				setSuggestions([]);
				return;
			}

			setIsLoading(true);

			// Simulate API delay
			const res = await axios.get("/api/v2/search/autocomplete", {
				params: { q: searchQuery },
			});

			const filtered = res.data.suggestions.filter(
				(suggestion: any) =>
					suggestion.text
						.toLowerCase()
						.includes(searchQuery.toLowerCase())
			);

			// Add recent searches that match
			const matchingRecent = recentSearches.filter((recent) =>
				recent.text.toLowerCase().includes(searchQuery.toLowerCase())
			);

			const combinedResults = [
				...matchingRecent.map((item) => ({
					...item,
					type: "recent" as const,
					icon: <Clock className="w-4 h-4" />,
				})),
				...filtered,
			];

			// Remove duplicates based on text
			const uniqueResults = combinedResults.filter(
				(item, index, array) =>
					array.findIndex(
						(i) => i.text.toLowerCase() === item.text.toLowerCase()
					) === index
			);

			setSuggestions(uniqueResults.slice(0, 8)); // Limit to 8 suggestions
			setIsLoading(false);
		},
		[recentSearches]
	);

	useEffect(() => {
		const debounceTimer = setTimeout(() => {
			fetchSuggestions(query);
		}, 500); // Reduced debounce time for better UX

		return () => clearTimeout(debounceTimer);
	}, [query, fetchSuggestions]);

	// Handle clicks outside component
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const value = e.target.value;

		setQuery(value);
		setIsOpen(true);
		setSelectedIndex(-1);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) return;

		const currentSuggestions = query
			? suggestions
			: [
					...recentSearches.slice(0, 3),
					...popularSearches.slice(0, 3),
			  ];

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setSelectedIndex((prev) =>
					prev < currentSuggestions.length - 1 ? prev + 1 : prev
				);
				break;
			case "ArrowUp":
				e.preventDefault();
				setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
				break;
			case "Enter":
				e.preventDefault();
				if (selectedIndex >= 0) {
					handleSuggestionClick(currentSuggestions[selectedIndex]);
				} else if (query.trim()) {
					router.push(`/search/${encodeURIComponent(query)}`);
					setIsOpen(false);
					setSelectedIndex(-1);
				}
				break;
			case "Escape":
				setIsOpen(false);
				setSelectedIndex(-1);
				inputRef.current?.blur();
				break;
		}
	};

	const addToRecentSearches = (suggestion: Suggestion) => {
		const newSearch: Suggestion = {
			text: suggestion.text,
			type: suggestion.type,
		};

		setRecentSearches((prev) => {
			const filtered = prev.filter(
				(item) =>
					item.text.toLowerCase() !== newSearch.text.toLowerCase()
			);
			return [newSearch, ...filtered].slice(0, 5); // Keep only 5 recent searches
		});
	};

	const handleSuggestionClick = (suggestion: Suggestion) => {
		setSelectedSuggestions(suggestion);
		setIsOpen(false);
		setSelectedIndex(-1);
		handleSearch(suggestion);
	};

	const handleSearch = (suggestion: Suggestion) => {
		addToRecentSearches(suggestion);
		setIsOpen(false);
		if (suggestion.type === "city") {
			router.push(
				`/Florida-Real-Estate-Search/${capitalizeWords(
					suggestion.text
				)
					.replaceAll(/\s+/g, "-")
					.replaceAll(" ", "-")}`
			);
		} else if (suggestion.type === "community") {
			router.push(
				`/Florida-Real-Estate-Search/${capitalizeWords(suggestion.city!)
					.replaceAll(/\s+/g, "-")
					.replaceAll(" ", "-")}/${capitalizeWords(
					suggestion.community || suggestion.text
				)
					.replaceAll(", ", "-")
					.replaceAll(" ", "-")}`
			);
		} else if (suggestion.type === "address") {
			router.push(
				UrlMaker(
					suggestion.city || "",
					suggestion.community || "",
					suggestion.text,
					suggestion.MLSNumber || ""
				)
			);
		} else if (suggestion.type === "zipcode") {
			router.push(
				`/Florida-Real-Estate-Search/postalCode-${suggestion.text}`
			);
		} else {
			router.push(`/search/${encodeURIComponent(suggestion.text)}`);
		}
	};

	const clearSearch = () => {
		setQuery("");
		setSuggestions([]);
		setIsOpen(false);
		setSelectedIndex(-1);
		inputRef.current?.focus();
	};

	const handleFocus = () => {
		setIsOpen(true);
		if (
			!query &&
			(recentSearches.length > 0 || popularSearches.length > 0)
		) {
			setSelectedIndex(-1);
		}
	};

	const handleBlur = (e: React.FocusEvent) => {
		// Don't close if focus is moving to a suggestion
		if (!containerRef.current?.contains(e.relatedTarget as Node)) {
			setTimeout(() => setIsOpen(false), 150);
		}
	};

	const handleSearchButtonClick = () => {
		if (query.trim()) {
			router.push(`/search/${encodeURIComponent(query)}`);
		} else {
			inputRef.current?.focus();
		}
	};

	// Get suggestions to display
	const displaySuggestions = query
		? suggestions
		: [...recentSearches.slice(0, 3), ...popularSearches.slice(0, 3)];

	const getSuggestionLabel = (type?: string) => {
		switch (type) {
			case "recent":
				return "Recent";
			case "popular":
				return "Popular";
			case "address":
				return "Address";
			case "city":
				return "City";
			case "community":
				return "Community";
			default:
				return "";
		}
	};

	const newLocal =
		"rounded-full min-w-[60vw] md:min-w-52 lg:min-w-70 w-max py-2 px-2 text-gray-700 placeholder-gray-400 bg-transparent border-none outline-none text-sm md:text-base";
	return (
		<div
			ref={containerRef}
			className={
				" flex justify-between p-1 rounded-lg bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 items-center gap-1 border border-gray-100"
			}>
			<div className="relative w-full">
				{/* Search Input Container */}
				<div className="relative w-full flex items-center ">
					<div className="pl-4 pr-2 flex-shrink-0">
						<Search className="w-5 h-5 text-gray-400" />
					</div>

					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						onFocus={handleFocus}
						onBlur={handleBlur}
						placeholder="Search Address, City, Community..."
						className={newLocal}
						autoComplete="off"
						spellCheck="false"
					/>

					{query && (
						<button
							onClick={clearSearch}
							className="p-2 mr-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 flex-shrink-0"
							aria-label="Clear search"
							type="button">
							<X className="w-4 h-4" />
						</button>
					)}
				</div>

				{/* Suggestions Dropdown */}
				{isOpen && (
					<div
						ref={suggestionsRef}
						className="absolute top-12 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-[1000] max-h-80 overflow-y-auto"
						style={{ minWidth: "300px" }}>
						{isLoading ? (
							<div className="p-4 text-center text-gray-500">
								<div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
								<span className="ml-2 text-sm">Searching...</span>
							</div>
						) : displaySuggestions.length > 0 ? (
							<>
								{!query && recentSearches.length > 0 && (
									<div className="px-4 py-2 border-b border-gray-100">
										<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
											Recent Searches
										</h3>
									</div>
								)}
								<ul className="py-1">
									{displaySuggestions.map((suggestion, index) => (
										<li key={index}>
											<button
												onClick={() =>
													handleSuggestionClick(suggestion)
												}
												className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between group ${
													index === selectedIndex
														? "bg-red-50 border-r-2 border-red-500"
														: ""
												}`}
												type="button">
												<div className="flex items-center space-x-3 flex-1 min-w-0">
													<div
														className={`flex-shrink-0 ${
															index === selectedIndex
																? "text-red-500"
																: "text-gray-400"
														}`}>
														<MapPin className="w-4 h-4" />
													</div>
													<span className="text-gray-700 text-sm md:text-base truncate">
														{suggestion.text === "NOT APPLICABLE" ||
														suggestion.text === "N/A" ||
														suggestion.text === "OTHERS"
															? query.toUpperCase()
															: suggestion.text}
													</span>
												</div>
												<div className="flex items-center space-x-2 flex-shrink-0">
													{suggestion.type && (
														<span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
															{getSuggestionLabel(suggestion.type)}
														</span>
													)}
												</div>
											</button>
										</li>
									))}
								</ul>
								{!query &&
									popularSearches.length > 0 &&
									recentSearches.length > 0 && (
										<>
											<div className="px-4 py-2 border-t border-gray-100">
												<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
													Popular Searches
												</h3>
											</div>
											<ul className="py-1">
												{popularSearches
													.slice(0, 3)
													.map((suggestion, index) => (
														<li key={"popular-" + index}>
															<button
																onClick={() =>
																	handleSuggestionClick(suggestion)
																}
																className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between group ${
																	index +
																		recentSearches.slice(0, 3)
																			.length ===
																	selectedIndex
																		? "bg-red-50 border-r-2 border-red-500"
																		: ""
																}`}
																type="button">
																<div className="flex items-center space-x-3 flex-1 min-w-0">
																	<div
																		className={`flex-shrink-0 ${
																			index +
																				recentSearches.slice(0, 3)
																					.length ===
																			selectedIndex
																				? "text-red-500"
																				: "text-gray-400"
																		}`}>
																		<TrendingUp className="w-4 h-4" />
																	</div>
																	<span className="text-gray-700 text-sm md:text-base truncate">
																		{suggestion.text}
																	</span>
																</div>
															</button>
														</li>
													))}
											</ul>
										</>
									)}
							</>
						) : query && !isLoading ? (
							<ul>
								<li>
									<button
										onClick={() => {}}
										className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between group ${
											1 + recentSearches.slice(0, 3).length ===
											selectedIndex
												? "bg-red-50 border-r-2 border-red-500"
												: ""
										}`}
										type="button">
										<div className="flex items-center space-x-3 flex-1 min-w-0">
											<div
												className={`flex-shrink-0 ${
													1 + recentSearches.slice(0, 3).length ===
													selectedIndex
														? "text-red-500"
														: "text-gray-400"
												}`}>
												<Search className="w-4 h-4" />
											</div>
											<span className="text-gray-700 text-sm md:text-base font-bold truncate">
												{query}
											</span>
										</div>
									</button>
								</li>
							</ul>
						) : null}
					</div>
				)}
			</div>

			<Button
				className="rounded-lg p-0 w-9 h-9 bg-gradient-to-tr from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl flex-shrink-0"
				onClick={handleSearchButtonClick}
				type="button"
				aria-label="Search">
				<Search className="w-5 h-5" />
			</Button>
		</div>
	);
};

export default SearchBox;
