"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import PropertyCard from "@/components/cards/property/property-card";
import Link from "next/link";
import {
	getWishlist,
	LeadAuthRequiredError,
} from "@/lib/leads/client";
import type { Property } from "@/app/generated/prisma/client";

type WishlistItem = {
	id: string;
	property: Property;
};

export default function FavoritesPage() {
	const { isLoaded, isSignedIn } = useAuth();
	const [favorites, setFavorites] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!isLoaded) return;

		if (!isSignedIn) {
			setLoading(false);
			return;
		}

		const loadFavorites = async () => {
			try {
				setLoading(true);
				const response = await getWishlist(1, 100);
				const items = (response.data as WishlistItem[]).map(
					(item) => ({ ...item.property, isWishlisted: true })
				);
				setFavorites(items);
				setError(null);
			} catch (err) {
				if (err instanceof LeadAuthRequiredError) {
					setError(null);
				} else {
					setError(
						err instanceof Error
							? err.message
							: "An unknown error occurred"
					);
				}
			} finally {
				setLoading(false);
			}
		};

		loadFavorites();
	}, [isLoaded, isSignedIn]);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const handleWishlistUpdate = (e: Event) => {
			const customEvent = e as CustomEvent;
			const { propertyId, saved } = customEvent.detail || {};
			if (propertyId && !saved) {
				setFavorites((prev) => prev.filter((item) => item.id !== propertyId));
			}
		};

		window.addEventListener("wishlist-updated", handleWishlistUpdate);
		return () => {
			window.removeEventListener("wishlist-updated", handleWishlistUpdate);
		};
	}, []);

	if (!isLoaded) {
		return (
			<div className="container mx-auto p-8 text-center">
				Loading user information...
			</div>
		);
	}

	if (!isSignedIn) {
		return (
			<div className="container mx-auto p-8 text-center">
				<p className="mb-4">Please sign in to view your favorites.</p>
				<Link
					href="/signup"
					className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
					Sign In
				</Link>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-4 md:p-8">
			<h1 className="text-xl md:text-2xl font-bold mb-6">
				Your Favorite Properties
			</h1>

			{loading && (
				<div className="text-center py-12">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
					<p className="mt-2">Loading your favorites...</p>
				</div>
			)}

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
					{error}
				</div>
			)}

			{!loading && !error && favorites.length === 0 && (
				<div className="text-center py-12 bg-gray-50 rounded-lg">
					<p className="text-lg text-gray-600">
						You haven&apos;t added any properties to your favorites
						yet.
					</p>
					<Link
						href="/Florida-Real-Estate-Search"
						className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
						Browse Properties
					</Link>
				</div>
			)}

			{!loading && !error && favorites.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{favorites.map((property) => (
						<PropertyCard key={property.id} {...property} />
					))}
				</div>
			)}
		</div>
	);
}
