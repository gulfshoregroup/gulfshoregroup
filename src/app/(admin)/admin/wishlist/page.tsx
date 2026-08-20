"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WishlistEntry {
	id: string;
	userId: string;
	mlsId: string;
	createdAt: string;
}

export default function WishlistPage() {
	const [wishlists, setWishlists] = useState<WishlistEntry[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/wishlist?limit=100")
			.then((r) => r.json())
			.then((d) => {
				setWishlists(d.data || []);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	return (
		<div className="p-6 space-y-4">
			<h1 className="text-2xl font-bold">User Wishlists</h1>
			{loading ? (
				<p className="text-muted-foreground">Loading...</p>
			) : wishlists.length === 0 ? (
				<p className="text-muted-foreground">No wishlist entries found.</p>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{wishlists.map((w) => (
						<Card key={w.id}>
							<CardHeader>
								<CardTitle className="text-sm">MLS: {w.mlsId}</CardTitle>
							</CardHeader>
							<CardContent className="text-xs text-muted-foreground space-y-1">
								<p>User: {w.userId}</p>
								<p>Saved: {new Date(w.createdAt).toLocaleDateString()}</p>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
