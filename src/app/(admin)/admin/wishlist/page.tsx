"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WishlistEntry {
	id: string;
	userId: string;
	mlsId: string;
	createdAt: string;
}

export default function WishlistPage() {
	const [wishlists, setWishlists] = useState<WishlistEntry[]>([]);
	const [loading, setLoading] = useState(true);

	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const limit = 20;

	useEffect(() => {
		setLoading(true);
		fetch(`/api/wishlist?page=${page}&limit=${limit}`)
			.then((r) => r.json())
			.then((d) => {
				setWishlists(d.data || []);
				setTotalCount(d.total || 0);
				setTotalPages(d.totalPages || 1);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [page]);

	return (
		<div className="p-6 space-y-4">
			<h1 className="text-2xl font-bold">User Wishlists</h1>
			{loading ? (
				<p className="text-muted-foreground">Loading...</p>
			) : wishlists.length === 0 ? (
				<p className="text-muted-foreground">No wishlist entries found.</p>
			) : (
				<div className="space-y-4">
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
					
					{/* Pagination Controls */}
					<div className="flex items-center justify-between mt-4 px-2">
						<span className="text-xs text-muted-foreground">
							Page {page} of {totalPages} (Showing {wishlists.length} of {totalCount} total)
						</span>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => Math.max(p - 1, 1))}
								disabled={page === 1}
							>
								<ChevronLeft className="h-4 w-4 mr-1" />
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
								disabled={page === totalPages || totalPages === 0}
							>
								Next
								<ChevronRight className="h-4 w-4 ml-1" />
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
