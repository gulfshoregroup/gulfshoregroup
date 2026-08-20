"use client";

import { useEffect, useState } from "react";
import { Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import SavedSearchCard from "@/components/saved-search-card";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";

export default function SavedSearchesSection() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [savedSearches, setSavedSearches] = useState<any[]>([]);

	// Fetch all saved searches
	useEffect(() => {
		const fetchSavedSearches = async () => {
			try {
				setLoading(true);
				const res = await axios.get("/api/v2/saved-searches");
				setSavedSearches(res.data);
				setError(null);
			} catch (error) {
				console.error(error);
				setError("Failed to load saved searches.");
			} finally {
				setLoading(false);
			}
		};
		fetchSavedSearches();
	}, []);

	// Update API call
	const handleUpdate = async (updatedSearch: any) => {
		try {
			setLoading(true);
			const res = await axios.put(
				`/api/v2/saved-searches/${updatedSearch._id}`,
				updatedSearch
			);
			const newData = res.data;

			// Optimistic UI update
			setSavedSearches((prev) =>
				prev.map((search) =>
					search._id === newData._id ? newData : search
				)
			);
			toast.success("Search Successfully Updated!");
		} catch (error) {
			console.error(error);
			setError("Failed to update saved search.");
		} finally {
			setLoading(false);
		}
	};

	// Delete API call
	const handleDelete = async (id: string) => {
		try {
			setLoading(true);
			await axios.delete(`/api/v2/saved-searches/${id}`);

			// Optimistic UI update
			setSavedSearches((prev) =>
				prev.filter((search) => search._id !== id)
			);
			toast.success("Search Successfully Removed!");
		} catch (error) {
			console.error(error);
			setError("Failed to delete saved search.");
		} finally {
			setLoading(false);
		}
	};

	if (loading && savedSearches.length === 0) {
		return <p>Loading saved searches...</p>;
	}

	if (error) {
		return <p className="text-red-500">{error}</p>;
	}

	return (
		<section className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
						<Star className="w-6 h-6 fill-blue-600 text-blue-600" />
						Saved Searches
					</h3>
					<p className="text-muted-foreground mt-1">
						Get alerts when new homes match your criteria
					</p>
				</div>
				<Link href={"/Florida-Real-Estate-Search?openFilters=true"}>
					<Button className="gap-2">
						<Plus className="w-4 h-4" />
						New Search
					</Button>
				</Link>
			</div>

			{savedSearches.length === 0 ? (
				<p className="text-muted-foreground">
					No saved searches yet.
				</p>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{savedSearches.map((search) => (
						<SavedSearchCard
							key={search._id}
							search={search}
							onUpdate={handleUpdate}
							onDelete={handleDelete}
						/>
					))}
				</div>
			)}
		</section>
	);
}
