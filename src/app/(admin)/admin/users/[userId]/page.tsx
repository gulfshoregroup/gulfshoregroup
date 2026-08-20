"use client";

import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { ScrollArea } from "@/components/ui/scroll-area";
import UrlMaker from "@/hooks/url-maker";
import { ArrowUpRightFromSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Filters } from "./savedSearchEdit";

export default function UserDetailPage() {
	const params = useParams<{ userId: string }>();
	const userId = params.userId;
	const router = useRouter();
	const [userData, setUserData] = useState<any>(null);
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const url =
		process.env.NEXT_PUBLIC_SERVER_URL ||
		"https://admin.gulfshoregroup.com";
	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				setError(null);
				const res = await axios.get(`/api/user/${userId}`);
				const data = res.data.data;
				setUserData(data);
				setUser(data.user);
			} catch (err) {
				console.error(err);
				setError("Failed to fetch user data");
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [userId]);

	if (loading)
		return (
			<div className="p-6 text-center font-bold text-muted-foreground">
				Loading user details...
			</div>
		);

	if (error)
		return (
			<div className="p-6 text-center text-red-500">
				Error: {error}
			</div>
		);

	if (!userData)
		return (
			<div className="p-6 text-center font-bold text-muted-foreground"></div>
		);

	return (
		<div className="space-y-6 px-4 my-8">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">User Details</h1>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Profile Section */}
				<Card className="md:col-span-1">
					<CardHeader>
						<CardTitle>Profile</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col items-center space-y-4">
							<Avatar className="h-24 w-24">
								<AvatarImage
									src={`${
										user.profileImage || "/default-profile.png"
									}`}
									alt={user?.firstName}
								/>
								<AvatarFallback className="text-2xl">
									{user?.firstName?.[0]}
									{user?.lastName?.[0]}
								</AvatarFallback>
							</Avatar>

							<div className="space-y-1 text-center">
								<h3 className="text-xl font-bold">
									{user.firstName} {user.lastName}
								</h3>
								<p className="text-sm text-muted-foreground">
									{user.email}
								</p>
								<Badge
									variant={
										user.status === "active" ? "default" : "secondary"
									}>
									{user.status}
								</Badge>
							</div>

							<div className="w-full space-y-2 pt-4 text-sm">
								<div className="flex justify-between">
									<span className="font-medium">Joined:</span>
									<span>{user.createdAt || "—"}</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Activity Section */}
				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle>Activity</CardTitle>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="wishlist">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger
									className="data-[state=active]:bg-accent data-[state=active]:text-white"
									value="wishlist">
									Wishlist
								</TabsTrigger>
								<TabsTrigger
									className="data-[state=active]:bg-accent data-[state=active]:text-white"
									value="viewed">
									Viewed Properties
								</TabsTrigger>
							</TabsList>

							{/* Wishlist Tab */}
							<TabsContent value="wishlist" className="mt-4">
								<div className="border rounded-md">
									<ScrollArea className="h-80">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Property</TableHead>
													<TableHead>Location</TableHead>
													<TableHead>Price</TableHead>
													<TableHead>Added On</TableHead>
												</TableRow>
											</TableHeader>

											<TableBody>
												{userData.wishlistProperties?.length > 0 ? (
													userData.wishlistProperties.map(
														(property: any) => (
															<TableRow key={property.id}>
																<TableCell className="font-medium">
																	<a
																		className="underline"
																		href={`${UrlMaker(
																			property.property?.City || "",
																			property.property?.Development || "",
																			property.property?.PropertyAddress || "",
																			property.property?.MLSNumber || ""
																		)}`}>
																		{" "}
																		{
																			property.property?.PropertyAddress || "Unknown Property"
																		}
																	</a>
																</TableCell>
																<TableCell>
																	{property.property?.City || "-"}
																</TableCell>
																<TableCell>
																	$
																	{property.property?.CurrentPrice?.toLocaleString() || "0"}
																</TableCell>
																<TableCell>
																	{new Date(
																		property.createdAt
																	).toLocaleDateString()}
																</TableCell>
															</TableRow>
														)
													)
												) : (
													<TableRow>
														<TableCell
															colSpan={4}
															className="text-center text-muted-foreground">
															No wishlist properties
														</TableCell>
													</TableRow>
												)}
											</TableBody>
										</Table>
									</ScrollArea>
								</div>
							</TabsContent>

							{/* Viewed Properties Tab */}
							<TabsContent value="viewed" className="mt-4">
								<ScrollArea className="h-80">
									<div className="border rounded-md">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Property</TableHead>
													<TableHead>Location</TableHead>
													<TableHead>Price</TableHead>
													<TableHead>Viewed On</TableHead>
												</TableRow>
											</TableHeader>

											<TableBody>
												{userData.viewedProperties?.length > 0 ? (
													userData.viewedProperties.map(
														(property: any) => (
															<TableRow
																key={`${property.id}-${property.createdAt}`}>
																<TableCell className="font-medium">
																	<a
																		className="underline"
																		href={`${UrlMaker(
																			property.property?.City || "",
																			property.property?.Development || "",
																			property.property?.PropertyAddress || "",
																			property.property?.MLSNumber || ""
																		)}`}>
																		{" "}
																		{
																			property.property?.PropertyAddress || "Unknown Property"
																		}
																	</a>
																</TableCell>
																<TableCell>
																	{property.property?.City || "-"}
																</TableCell>
																<TableCell>
																	${property.property?.CurrentPrice || "0"}
																</TableCell>
																<TableCell>
																	{new Date(
																		property.createdAt
																	).toLocaleDateString()}
																</TableCell>
															</TableRow>
														)
													)
												) : (
													<TableRow>
														<TableCell
															colSpan={4}
															className="text-center text-muted-foreground">
															No viewed properties
														</TableCell>
													</TableRow>
												)}
											</TableBody>
										</Table>
									</div>
								</ScrollArea>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</div>

			{/* Activity Section */}
			<Card className="md:col-span-2">
				<CardHeader>
					<CardTitle>Search Activity</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="History">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger
								className="data-[state=active]:bg-accent data-[state=active]:text-white"
								value="History">
								Search History
							</TabsTrigger>
							<TabsTrigger
								className="data-[state=active]:bg-accent data-[state=active]:text-white"
								value="SavedSearch">
								Saved Search
							</TabsTrigger>
						</TabsList>

						{/* Wishlist Tab */}
						<TabsContent value="History" className="mt-4">
							<ScrollArea className="h-72">
								<div className="border rounded-md">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Link</TableHead>
												<TableHead>Search Count</TableHead>
												<TableHead>City</TableHead>
												<TableHead>Community</TableHead>
												<TableHead>Min Price</TableHead>
												<TableHead>Max Price</TableHead>
												<TableHead>Beds</TableHead>
												<TableHead>Baths</TableHead>
												<TableHead>Last Search</TableHead>
											</TableRow>
										</TableHeader>

										<TableBody>
											{userData.searchHistory?.length > 0 ? (
												userData.searchHistory.map((search: any) => (
													<TableRow key={search._id}>
														<TableCell className="font-medium">
															<a className="underline" href="#">
																Link
															</a>
														</TableCell>
														<TableCell>
															{search.searchCount}
														</TableCell>
														<TableCell>
															{search.searchQuery.city || "-"}
														</TableCell>
														<TableCell>
															{search.searchQuery.developmentName ||
																"-"}
														</TableCell>
														<TableCell>
															{search.searchQuery.minPrice || "-"}
														</TableCell>
														<TableCell>
															{search.searchQuery.maxPrice || "-"}
														</TableCell>
														<TableCell>
															{search.searchQuery.beds || "-"}
														</TableCell>
														<TableCell>
															{search.searchQuery.baths || "-"}
														</TableCell>
														<TableCell>
															{new Date(
																search.lastSearched
															).toLocaleDateString()}
														</TableCell>
													</TableRow>
												))
											) : (
												<TableRow>
													<TableCell
														colSpan={4}
														className="text-center text-muted-foreground">
														No Search Activity
													</TableCell>
												</TableRow>
											)}
										</TableBody>
									</Table>
								</div>
							</ScrollArea>
						</TabsContent>

						{/* Viewed Properties Tab */}
						<TabsContent value="SavedSearch" className="mt-4">
							<ScrollArea>
								<div className="border rounded-md">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Link</TableHead>
												<TableHead>Subscription</TableHead>
												<TableHead>Frequency</TableHead>
												<TableHead>Type</TableHead>
												<TableHead>City</TableHead>
												<TableHead>Community</TableHead>
												<TableHead>Min Price</TableHead>
												<TableHead>Max Price</TableHead>
												<TableHead>Bed</TableHead>
												<TableHead>Bath</TableHead>
												<TableHead>Actions</TableHead>
											</TableRow>
										</TableHeader>

										<TableBody>
											{userData.savedSearch?.length > 0 ? (
												userData.savedSearch?.map((search: any) => (
													<TableRow key={search._id}>
														<TableCell className="font-medium">
															<a
																className="underline"
																href={search.link}>
																<ArrowUpRightFromSquare
																	size={15}
																	className="text-blue-600"
																/>
															</a>
														</TableCell>
														<TableCell>
															{search.subscriptionFrequency
																? "Enabled"
																: "Not Enabled"}
														</TableCell>
														<TableCell>
															{search.subscriptionFrequency}
														</TableCell>
														<TableCell>
															{(() => {
																const f = typeof search.filters === 'string' ? JSON.parse(search.filters) : search.filters || {};
																return f.propertyTypes?.join(", ") || "All";
															})()}
														</TableCell>
														<TableCell>
															{(() => {
																const f = typeof search.filters === 'string' ? JSON.parse(search.filters) : search.filters || {};
																return f.city || "-";
															})()}
														</TableCell>
														<TableCell>
															{(() => {
																const f = typeof search.filters === 'string' ? JSON.parse(search.filters) : search.filters || {};
																return f.developmentName || "-";
															})()}
														</TableCell>
														<TableCell>
															{(() => {
																const f = typeof search.filters === 'string' ? JSON.parse(search.filters) : search.filters || {};
																return f.minPrice || "-";
															})()}
														</TableCell>
														<TableCell>
															{(() => {
																const f = typeof search.filters === 'string' ? JSON.parse(search.filters) : search.filters || {};
																return f.maxPrice || "-";
															})()}
														</TableCell>
														<TableCell>
															{(() => {
																const f = typeof search.filters === 'string' ? JSON.parse(search.filters) : search.filters || {};
																return f.beds || "-";
															})()}
														</TableCell>
														<TableCell>
															{(() => {
																const f = typeof search.filters === 'string' ? JSON.parse(search.filters) : search.filters || {};
																return f.baths || "-";
															})()}
														</TableCell>
														<TableCell>
															<Filters
																onSave={() => router.refresh()}
																savedSearch={search}
															/>
														</TableCell>
													</TableRow>
												))
											) : (
												<TableRow>
													<TableCell
														colSpan={4}
														className="text-center text-muted-foreground">
														No Saved Search
													</TableCell>
												</TableRow>
											)}
										</TableBody>
									</Table>
								</div>
							</ScrollArea>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
