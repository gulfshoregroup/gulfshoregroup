"use client";

import { useAuth } from "@clerk/nextjs";
import {
	addToWishlist,
	checkWishlist,
	LeadAuthRequiredError,
	removeFromWishlist,
} from "@/lib/leads/client";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const WishListButton = ({
	isWishlisted = false,
	propertyId,
}: {
	isWishlisted?: boolean;
	propertyId: string;
}) => {
	const [saved, setSaved] = useState(isWishlisted);
	const [loading, setLoading] = useState(false);
	const { isLoaded, isSignedIn } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoaded || !isSignedIn || !propertyId) return;

		checkWishlist(propertyId)
			.then((response) => setSaved(response.data.saved))
			.catch(() => {});
	}, [isLoaded, isSignedIn, propertyId]);

	useEffect(() => {
		if (typeof window === "undefined" || !propertyId) return;

		const handleWishlistUpdate = (e: Event) => {
			const customEvent = e as CustomEvent;
			if (customEvent.detail && customEvent.detail.propertyId === propertyId) {
				setSaved(customEvent.detail.saved);
			}
		};

		window.addEventListener("wishlist-updated", handleWishlistUpdate);
		return () => {
			window.removeEventListener("wishlist-updated", handleWishlistUpdate);
		};
	}, [propertyId]);

	const handleWishlist = async (event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();

		if (!isLoaded) return;

		if (!isSignedIn) {
			toast.info("Sign in to save properties", {
				description: "Create an account or log in to add favorites.",
			});
			router.push("/signup");
			return;
		}

		if (loading) return;

		const nextSaved = !saved;
		setSaved(nextSaved);
		setLoading(true);

		try {
			if (nextSaved) {
				await addToWishlist(propertyId);
				toast.success("Saved to favorites");
				if (typeof window !== "undefined") {
					window.dispatchEvent(
						new CustomEvent("wishlist-updated", {
							detail: { propertyId, saved: true },
						})
					);
				}
			} else {
				await removeFromWishlist(propertyId);
				toast.success("Removed from favorites");
				if (typeof window !== "undefined") {
					window.dispatchEvent(
						new CustomEvent("wishlist-updated", {
							detail: { propertyId, saved: false },
						})
					);
				}
			}
		} catch (error) {
			setSaved(!nextSaved);
			if (error instanceof LeadAuthRequiredError) {
				toast.info("Sign in to save properties");
				router.push("/signup");
			} else {
				toast.error("Could not update favorites. Please try again.");
				console.error(error);
			}
		} finally {
			setLoading(false);
		}
	};

	if (!isLoaded) {
		return (
			<div className="bg-white text-center rounded-full flex items-center justify-center w-10 h-10 p-1" />
		);
	}

	return (
		<button
			type="button"
			aria-label={saved ? "Remove from favorites" : "Add to favorites"}
			disabled={loading}
			className="bg-white text-center rounded-full flex items-center justify-center w-10 h-10 p-1 cursor-pointer disabled:opacity-60"
			onClick={handleWishlist}>
			{saved ? (
				<Heart
					className="w-5 h-5"
					fill="red"
					stroke="red"
					strokeWidth={1}
				/>
			) : (
				<Heart className="w-5 h-5" />
			)}
		</button>
	);
};
