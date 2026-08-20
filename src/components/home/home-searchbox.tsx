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
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
		| "popular"
		| "subdivision"
		| "school";
	city?: string;
	community?: string;
	MLSNumber?: string;
}

const SearchBox = ({
	classname = "w-full flex justify-between p-1 rounded-lg bg-white items-center gap-1 border mb-2",
}: {
	classname?: string;
}) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
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

	useEffect(() => {
		let activeQuery = "";
		if (searchParams) {
			activeQuery =
				searchParams.get("q") ||
				searchParams.get("subdivision") ||
				searchParams.get("school") ||
				searchParams.get("mls") ||
				searchParams.get("address") ||
				searchParams.get("keyword") ||
				"";
		}
		if (!activeQuery && pathname) {
			if (pathname.startsWith("/search/")) {
				activeQuery = decodeURIComponent(
					pathname.replace("/search/", "")
				)
					.replaceAll("-", " ")
					.trim();
			} else if (pathname.startsWith("/Florida-Real-Estate-Search")) {
				const parts = pathname
					.replace("/Florida-Real-Estate-Search", "")
					.split("/")
					.map((p) => decodeURIComponent(p).trim())
					.filter(
						(p) =>
							p &&
							!p.startsWith("page-") &&
							!p.startsWith("sort=") &&
							!p.includes("-beds") &&
							!p.includes("-baths") &&
							!p.includes("-minPrice") &&
							!p.includes("-maxPrice") &&
							!p.includes("-minBuiltYear") &&
							!p.includes("-maxBuiltYear") &&
							!p.startsWith("propertyTypes=")
					);

				if (parts.length > 0) {
					const postalPart = parts.find((p) =>
						p.startsWith("postalCode-")
					);
					if (postalPart) {
						activeQuery = postalPart.replace("postalCode-", "");
					} else {
						activeQuery = parts[parts.length - 1].replaceAll(
							"-",
							" "
						);
					}
				}
			}
		}

		if (activeQuery) {
			setQuery(activeQuery);
		} else if (
			pathname === "/Florida-Real-Estate-Search" &&
			(!searchParams || !searchParams.toString())
		) {
			setQuery("");
		}
	}, [pathname, searchParams]);

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
		} else if (suggestion.type === "subdivision") {
			router.push(
				`/Florida-Real-Estate-Search?subdivision=${encodeURIComponent(
					suggestion.text
				)}`
			);
		} else if (suggestion.type === "school") {
			router.push(
				`/Florida-Real-Estate-Search?school=${encodeURIComponent(
					suggestion.text
				)}`
			);
		} else if (suggestion.type === "mls") {
			router.push(`/search/${encodeURIComponent(suggestion.text)}`);
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
		if (
			pathname &&
			(pathname.startsWith("/Florida-Real-Estate-Search") ||
				pathname.startsWith("/search")) &&
			(pathname !== "/Florida-Real-Estate-Search" ||
				(searchParams && searchParams.toString() !== ""))
		) {
			router.push("/Florida-Real-Estate-Search");
		} else {
			inputRef.current?.focus();
		}
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
			case "subdivision":
				return "Subdivision";
			case "school":
				return "School";
			case "mls":
				return "MLS ID";
			case "zipcode":
				return "ZIP Code";
			default:
				return "";
		}
	};
	return (
		<div
			ref={containerRef}
			className="relative w-full mx-auto">
			
			{/* Zillow Style Search Container */}
			<div className="flex items-center bg-white rounded-md shadow-xl border border-gray-200 overflow-hidden h-14 md:h-16 transition-all duration-300 focus-within:ring-4 focus-within:ring-white/30">
				
				{/* Search Icon */}
				<div className="pl-5 md:pl-6">
					<Search className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
				</div>
	
				{/* Input */}
				<div className="flex-1 h-full">
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						onFocus={handleFocus}
						onBlur={handleBlur}
						placeholder="Search by city, address, or ZIP code"
						className="w-full h-full px-4 text-[15px] md:text-lg font-medium text-gray-800 placeholder:text-gray-400 bg-transparent border-none outline-none leading-none"
						autoComplete="off"
						spellCheck="false"
					/>
				</div>
	
				{/* Clear Button */}
				{query && (
					<button
						onClick={clearSearch}
						className="mr-2 md:mr-3 p-2.5 rounded-full hover:bg-gray-100 transition"
						type="button"
						aria-label="Clear search">
						<X className="w-5 h-5 text-gray-500" />
					</button>
				)}
	
				{/* Search Button */}
				<button
					onClick={handleSearchButtonClick}
					type="button"
					aria-label="Search properties"
					className="h-14 md:h-16 px-6 md:px-8 bg-red-700 hover:bg-red-800 text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2">
					<Search className="w-5 h-5" />
					<span className="text-base">
						Search
					</span>
				</button>
			</div>
	
		{/* Zillow Style Dropdown */}
        {isOpen && (
				<div
					ref={suggestionsRef}
					className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-[9999] max-h-[420px] overflow-y-auto">
	
					{/* Loading */}
					{isLoading ? (
						<div className="p-6 flex items-center justify-center">
							<div className="w-5 h-5 border-2 border-[#006aff] border-t-transparent rounded-full animate-spin" />
							<span className="ml-3 text-gray-600 text-sm">
								Searching...
							</span>
						</div>
					) : displaySuggestions.length > 0 ? (
						<div className="py-2">
	
							{/* Recent Searches */}
							{!query && recentSearches.length > 0 && (
								<div className="px-5 py-3 border-b border-gray-100">
									<p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
										Recent Searches
									</p>
								</div>
							)}
	
							<ul>
								{displaySuggestions.map((suggestion, index) => (
									<li key={index}>
										<button
											onClick={() =>
												handleSuggestionClick(suggestion)
											}
											className={`w-full flex items-center gap-4 px-5 py-5 text-left transition-all duration-150 ${
												index === selectedIndex
													? "bg-blue-50"
													: "hover:bg-gray-50"
											}`}
											type="button">
	
											{/* Icon */}
											<div
												className={`shrink-0 ${
													index === selectedIndex
														? "text-[#006aff]"
														: "text-gray-400"
												}`}>
												{suggestion.type === "recent" ? (
													<Clock className="w-5 h-5" />
												) : suggestion.type === "popular" ? (
													<TrendingUp className="w-5 h-5" />
												) : (
													<MapPin className="w-5 h-5" />
												)}
											</div>
	
											{/* Text */}
											<div className="flex-1 min-w-0">
												<p className="text-base font-medium text-gray-800 truncate">
													{suggestion.text === "NOT APPLICABLE" ||
													suggestion.text === "N/A" ||
													suggestion.text === "OTHERS"
														? query.toUpperCase()
														: suggestion.text}
												</p>
	
												{suggestion.type && (
													<p className="text-xs text-gray-500 mt-0.5">
														{getSuggestionLabel(
															suggestion.type
														)}
													</p>
												)}
											</div>
										</button>
									</li>
								))}
							</ul>
						</div>
					) : query && !isLoading ? (
						<div className="p-3">
							<button
								onClick={() =>
									handleSuggestionClick({
										text: query,
									})
								}
								className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-gray-50 transition text-left"
								type="button">
	
								<Search className="w-5 h-5 text-gray-400" />
	
								<div>
									<p className="font-medium text-gray-800">
										Search for "{query}"
									</p>
									<p className="text-xs text-gray-500 mt-0.5">
										Address, City, ZIP or MLS
									</p>
								</div>
							</button>
						</div>
					) : null}
				</div>
			)}
		</div>
	);}

export default SearchBox;
