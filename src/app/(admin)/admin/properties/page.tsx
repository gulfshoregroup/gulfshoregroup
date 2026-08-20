"use client";
import React, { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Home,
	Eye,
	Heart,
	Search,
	ChevronLeft,
	ChevronRight,
	Plus,
	RefreshCw,
	Database,
	Building2,
} from "lucide-react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const getStatusColor = (status: string) => {
	switch (status?.toLowerCase()) {
		case "active":
			return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
		case "pending":
			return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
		case "sold":
			return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
		case "off-market":
			return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
		default:
			return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
	}
};

export default function PropertiesPage() {
	const [properties, setProperties] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const [searchTerm, setSearchTerm] = useState("");
	const [citySearch, setCitySearch] = useState("");
	const [developmentSearch, setDevelopmentSearch] = useState("");
	const [mlsSearch, setMlsSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("Active");
	const [syncStatus, setSyncStatus] = useState<null | { loading: boolean; message: string; success?: boolean }>(null);
	const limit = 20;

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [citiesList, setCitiesList] = useState<string[]>([]);
	const [communitiesList, setCommunitiesList] = useState<{ Development: string; City: string }[]>([]);

	const [formData, setFormData] = useState({
		MLSNumber: "",
		FullAddress: "",
		City: "",
		SubdivisionName: "",
		ListPrice: "",
		PropertyType: "Single Family Residence",
		StandardStatus: "Active",
		BedroomsTotal: "",
		BathroomsFull: "",
		LivingArea: "",
		ImageUrl: "",
	});

	// Fetch cities & communities dropdown options
	useEffect(() => {
		const fetchOptions = async () => {
			try {
				const [citiesRes, commsRes] = await Promise.all([
					fetch("/api/cities").then((r) => r.json()).catch(() => ({})),
					fetch("/api/community?limit=2000").then((r) => r.json()).catch(() => ({})),
				]);

				if (citiesRes.data) {
					const names = citiesRes.data.map((c: any) => c.City || c.name).filter(Boolean);
					const uniqueNames = Array.from(new Set(names)) as string[];
					setCitiesList(uniqueNames);
					if (uniqueNames.length > 0 && !formData.City) {
						setFormData((prev) => ({ ...prev, City: uniqueNames[0] }));
					}
				}

				if (commsRes.data) {
					const items = commsRes.data.map((c: any) => ({
						Development: c.Development || c.name,
						City: c.City || "",
					})).filter((c: any) => Boolean(c.Development));
					setCommunitiesList(items);
				}
			} catch (err) {
				console.error("Error fetching dropdown options:", err);
			}
		};

		fetchOptions();
	}, []);


	const [imageFile, setImageFile] = useState<File | null>(null);

	const handleCreateProperty = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.MLSNumber || !formData.FullAddress || !formData.City) {
			toast.error("MLS Number, Full Address, and City are required");
			return;
		}

		let finalImageUrl = formData.ImageUrl;

		try {
			if (imageFile) {
				const uploadData = new FormData();
				uploadData.append("file", imageFile);
				
				const uploadRes = await fetch("/api/upload", {
					method: "POST",
					body: uploadData,
				});

				if (!uploadRes.ok) {
					throw new Error("Failed to upload image");
				}

				const uploadJson = await uploadRes.json();
				finalImageUrl = uploadJson.url;
			}

			const payload = { ...formData, ImageUrl: finalImageUrl };

			const res = await fetch("/api/properties", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData.error || "Failed to create property");
			}
			setIsCreateOpen(false);
			setFormData({
				MLSNumber: "",
				FullAddress: "",
				City: citiesList[0] || "",
				SubdivisionName: "",
				ListPrice: "",
				PropertyType: "Single Family Residence",
				StandardStatus: "Active",
				BedroomsTotal: "",
				BathroomsFull: "",
				LivingArea: "",
				ImageUrl: "",
			});

			setImageFile(null);
			toast.success("Property created successfully!");
			fetchProperties();
		} catch (err: any) {
			toast.error(err.message || "Something went wrong");
		}
	};

	const fetchProperties = async () => {
		setLoading(true);
		try {
			const statusParam = statusFilter === "All" ? "All" : statusFilter;
			let url = `/api/properties?page=${page}&limit=${limit}&Status=${statusParam}`;
			if (citySearch) url += `&city=${encodeURIComponent(citySearch)}`;
			if (developmentSearch) url += `&development=${encodeURIComponent(developmentSearch)}`;
			if (mlsSearch) url += `&MLSNumber=${encodeURIComponent(mlsSearch)}`;

			const res = await fetch(url);
			const json = await res.json();
			if (json.success) {
				setProperties(json.data || []);
				setTotalCount(json.total || 0);
				setTotalPages(json.totalPages || 1);
			}
		} catch (error) {
			console.error("Error fetching properties:", error);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Trigger full Bridge sync from admin UI.
	 * Chains calls automatically using nextOffset until complete.
	 */
	const handleFullSync = async () => {
		setSyncStatus({ loading: true, message: "Starting full sync from Bridge API..." });
		let offset = 0;
		let totalFetched = 0;
		try {
			while (true) {
				setSyncStatus({ loading: true, message: `Syncing... ${totalFetched} properties fetched so far` });
				const res = await fetch(`/api/v2/sync/full?offset=${offset}&status=Active`);
				const json = await res.json();
				if (!json.success) throw new Error(json.error || "Sync failed");
				totalFetched += json.totalFetched || 0;
				if (json.isComplete || json.nextOffset === null) break;
				offset = json.nextOffset;
			}
			setSyncStatus({ loading: false, message: `✅ Full sync complete! ${totalFetched.toLocaleString()} properties synced.`, success: true });
			toast.success(`Full sync complete! ${totalFetched.toLocaleString()} properties synced.`);
			fetchProperties();
		} catch (err: any) {
			setSyncStatus({ loading: false, message: `❌ Sync failed: ${err.message}`, success: false });
			toast.error(err.message || "Sync failed");
		}
	};

	useEffect(() => {
		fetchProperties();
	}, [page, statusFilter]);

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setPage(1);
		fetchProperties();
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between flex-wrap gap-3">
				<div>
					<h1 className="text-3xl font-bold text-foreground">
						Properties Listings
						<span className="text-muted-foreground text-sm font-normal ml-2">
							({totalCount.toLocaleString()} {statusFilter === "All" ? "total" : statusFilter.toLowerCase()})
						</span>
					</h1>
					<p className="text-muted-foreground">
						Manage and monitor all property listings across Florida
					</p>
					{syncStatus && (
						<p className={`text-xs mt-1 font-medium ${
							syncStatus.success === false ? "text-red-500" :
							syncStatus.success === true ? "text-green-600" : "text-blue-500"
						}`}>
							{syncStatus.loading && <RefreshCw className="inline h-3 w-3 mr-1 animate-spin" />}
							{syncStatus.message}
						</p>
					)}
				</div>
				<div className="flex gap-2 flex-wrap">
					{/* Status Filter */}
					<Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
						<SelectTrigger className="w-[140px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="Active">Active</SelectItem>
							<SelectItem value="Closed">Sold / Closed</SelectItem>
							<SelectItem value="All">All Properties</SelectItem>
						</SelectContent>
					</Select>
					{/* Full Sync Button */}
					<Button
						variant="outline"
						onClick={handleFullSync}
						disabled={syncStatus?.loading}
						className="flex items-center gap-2 border-blue-300 text-blue-600 hover:bg-blue-50"
					>
						{syncStatus?.loading
							? <RefreshCw className="h-4 w-4 animate-spin" />
							: <Database className="h-4 w-4" />}
						{syncStatus?.loading ? "Syncing..." : "Full MLS Sync"}
					</Button>
					<Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
						<Plus className="h-4 w-4" />
						Add Property
					</Button>
				</div>
			</div>

			{/* Search Filters */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base font-semibold">Search Filter</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-4 items-end">
						<div className="flex-1 min-w-[200px]">
							<label className="text-xs font-semibold text-muted-foreground mb-1 block">City</label>
							<Input
								placeholder="e.g. Naples"
								value={citySearch}
								onChange={(e) => setCitySearch(e.target.value)}
							/>
						</div>
						<div className="flex-1 min-w-[200px]">
							<label className="text-xs font-semibold text-muted-foreground mb-1 block">Development / Community</label>
							<Input
								placeholder="e.g. Lely Resort"
								value={developmentSearch}
								onChange={(e) => setDevelopmentSearch(e.target.value)}
							/>
						</div>
						<div className="flex-1 min-w-[150px]">
							<label className="text-xs font-semibold text-muted-foreground mb-1 block">MLS Number</label>
							<Input
								placeholder="e.g. 222014022"
								value={mlsSearch}
								onChange={(e) => setMlsSearch(e.target.value)}
							/>
						</div>
						<Button type="submit" className="bg-[#B89A6A] hover:bg-[#a6895b] text-white">
							<Search className="h-4 w-4 mr-2" />
							Search
						</Button>
						<Button 
							type="button" 
							variant="outline" 
							onClick={() => {
								setCitySearch("");
								setDevelopmentSearch("");
								setMlsSearch("");
								setPage(1);
								setTimeout(fetchProperties, 0);
							}}
						>
							Reset
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* Properties Table */}
			<Card>
				<CardHeader>
					<CardTitle>Property Listings</CardTitle>
					<CardDescription>
						Detailed view of all active property listings from database
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<p className="text-center text-muted-foreground py-8">Loading properties...</p>
					) : properties.length === 0 ? (
						<p className="text-center text-muted-foreground py-8">No properties found matching criteria.</p>
					) : (
						<>
							<div className="rounded-md border overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Property Details</TableHead>
											<TableHead>Price</TableHead>
											<TableHead>Type</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>City</TableHead>
											<TableHead>MLS Number</TableHead>
											<TableHead>Photos</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{properties.map((property) => (
											<TableRow key={property._id}>
												<TableCell>
													<div>
														<div className="font-medium">
															{property.PropertyAddress}
														</div>
														<div className="text-xs text-muted-foreground mt-0.5">
															{property.BedsTotal} bd • {property.BathsTotal} ba
															{property.ApproxLivingArea && ` • ${Number(property.ApproxLivingArea).toLocaleString()} sqft`}
														</div>
													</div>
												</TableCell>
												<TableCell className="font-medium">
													${property.CurrentPrice?.toLocaleString()}
												</TableCell>
												<TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
													{property.PropertyClass}
												</TableCell>
												<TableCell>
													<Badge className={getStatusColor(property.Status)}>
														{property.Status}
													</Badge>
												</TableCell>
												<TableCell className="text-xs font-semibold text-muted-foreground">
													{property.City}
												</TableCell>
												<TableCell className="font-mono text-xs">
													{property.MLSNumber}
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">
													{property.AllPixList?.length || 0} photos
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							{/* Pagination Controls */}
							<div className="flex items-center justify-between mt-4">
								<span className="text-xs text-muted-foreground">
									Page {page} of {totalPages} (Showing {(properties.length).toLocaleString()} rows)
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
										disabled={page === totalPages}
									>
										Next
										<ChevronRight className="h-4 w-4 ml-1" />
									</Button>
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>
			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent className="sm:max-w-[720px] w-[95vw] rounded-2xl p-6 shadow-2xl">
					<form onSubmit={handleCreateProperty}>
						<DialogHeader className="border-b pb-3">
							<DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
								<Home className="h-5 w-5 text-emerald-600" /> Add New Property Listing
							</DialogTitle>
							<DialogDescription>
								Fill in the listing details below to publish an exclusive or custom property to the website.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
							{/* Location & Identification Section */}
							<div className="p-4 bg-muted/30 rounded-xl border border-border space-y-3">
								<h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
									<Building2 className="h-4 w-4 text-blue-600" /> Property Identity & Address
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div className="md:col-span-2 flex flex-col gap-1.5">
										<Label htmlFor="FullAddress" className="text-xs font-semibold text-foreground">
											Full Address <span className="text-red-500">*</span>
										</Label>
										<Input
											id="FullAddress"
											required
											placeholder="e.g. 3777 Gordon Dr, Naples, FL 34102"
											value={formData.FullAddress}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													FullAddress: e.target.value,
												}))
											}
										/>
									</div>
									<div className="flex flex-col gap-1.5">
										<Label htmlFor="City" className="text-xs font-semibold text-foreground">
											City <span className="text-red-500">*</span>
										</Label>
										<Select
											value={formData.City}
											onValueChange={(val) =>
												setFormData((prev) => ({
													...prev,
													City: val,
													SubdivisionName: "", // Reset subdivision when city changes
												}))
											}
										>
											<SelectTrigger id="City" className="w-full">
												<SelectValue placeholder="Select City..." />
											</SelectTrigger>
											<SelectContent className="max-h-56 overflow-y-auto">
												{citiesList.length > 0 ? (
													citiesList.map((cityName) => (
														<SelectItem key={cityName} value={cityName}>
															{cityName}
														</SelectItem>
													))
												) : (
													<SelectItem value="Naples">Naples</SelectItem>
												)}
											</SelectContent>
										</Select>
									</div>

									<div className="flex flex-col gap-1.5">
										<Label htmlFor="SubdivisionName" className="text-xs font-semibold text-foreground">
											Community / Subdivision
										</Label>
										<Select
											value={formData.SubdivisionName}
											onValueChange={(val) =>
												setFormData((prev) => ({
													...prev,
													SubdivisionName: val,
												}))
											}
										>
											<SelectTrigger id="SubdivisionName" className="w-full">
												<SelectValue placeholder="Select Community / Subdivision..." />
											</SelectTrigger>
											<SelectContent className="max-h-56 overflow-y-auto">
												<SelectItem value="None">-- None / General --</SelectItem>
												{communitiesList
													.filter((c) => !formData.City || !c.City || c.City.toLowerCase() === formData.City.toLowerCase())
													.map((comm) => (
														<SelectItem key={comm.Development} value={comm.Development}>
															{comm.Development}
														</SelectItem>
													))}
											</SelectContent>
										</Select>
									</div>

									<div className="md:col-span-2 flex flex-col gap-1.5">
										<Label htmlFor="MLSNumber" className="text-xs font-semibold text-foreground">
											MLS / Listing ID <span className="text-red-500">*</span>
										</Label>
										<Input
											id="MLSNumber"
											required
											placeholder="e.g. 226008320"
											value={formData.MLSNumber}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													MLSNumber: e.target.value,
												}))
											}
										/>
									</div>
								</div>
							</div>


							{/* Specs & Pricing Section */}
							<div className="p-4 bg-muted/30 rounded-xl border border-border space-y-3">
								<h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
									💰 Pricing, Type & Dimensions
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div className="flex flex-col gap-1.5">
										<Label htmlFor="ListPrice" className="text-xs font-semibold text-foreground">
											List Price ($) <span className="text-red-500">*</span>
										</Label>
										<Input
											id="ListPrice"
											type="number"
											placeholder="e.g. 2500000"
											value={formData.ListPrice}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													ListPrice: e.target.value,
												}))
											}
										/>
									</div>
									<div className="flex flex-col gap-1.5">
										<Label htmlFor="PropertyType" className="text-xs font-semibold text-foreground">
											Property Type
										</Label>
										<Select
											value={formData.PropertyType}
											onValueChange={(v) =>
												setFormData((prev) => ({ ...prev, PropertyType: v }))
											}
										>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Single Family Residence">Single Family Residence</SelectItem>
												<SelectItem value="Condo">Condo</SelectItem>
												<SelectItem value="Townhouse">Townhouse</SelectItem>
												<SelectItem value="Land">Land</SelectItem>
												<SelectItem value="Commercial">Commercial</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="flex flex-col gap-1.5">
										<Label htmlFor="StandardStatus" className="text-xs font-semibold text-foreground">
											Listing Status
										</Label>
										<Select
											value={formData.StandardStatus}
											onValueChange={(v) =>
												setFormData((prev) => ({ ...prev, StandardStatus: v }))
											}
										>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Active">Active</SelectItem>
												<SelectItem value="Pending">Pending</SelectItem>
												<SelectItem value="Sold">Sold</SelectItem>
												<SelectItem value="Closed">Closed</SelectItem>
												<SelectItem value="Off Market">Off Market</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="flex flex-col gap-1.5">
										<Label htmlFor="LivingArea" className="text-xs font-semibold text-foreground">
											Living Area (SqFt)
										</Label>
										<Input
											id="LivingArea"
											type="number"
											placeholder="e.g. 3500"
											value={formData.LivingArea}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													LivingArea: e.target.value,
												}))
											}
										/>
									</div>
									<div className="flex flex-col gap-1.5">
										<Label htmlFor="BedroomsTotal" className="text-xs font-semibold text-foreground">
											Bedrooms
										</Label>
										<Input
											id="BedroomsTotal"
											type="number"
											placeholder="e.g. 4"
											value={formData.BedroomsTotal}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													BedroomsTotal: e.target.value,
												}))
											}
										/>
									</div>
									<div className="flex flex-col gap-1.5">
										<Label htmlFor="BathroomsFull" className="text-xs font-semibold text-foreground">
											Bathrooms
										</Label>
										<Input
											id="BathroomsFull"
											type="number"
											placeholder="e.g. 3"
											value={formData.BathroomsFull}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													BathroomsFull: e.target.value,
												}))
											}
										/>
									</div>
								</div>
							</div>

							{/* Photo Upload Section */}
							<div className="p-4 bg-muted/30 rounded-xl border border-border space-y-3">
								<h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
									🖼️ Property Main Image
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div className="flex flex-col gap-1.5">
										<Label htmlFor="imageFile" className="text-xs font-semibold text-foreground">
											Upload Image File
										</Label>
										<Input
											id="imageFile"
											type="file"
											accept="image/*"
											onChange={(e) => {
												if (e.target.files && e.target.files[0]) {
													setImageFile(e.target.files[0]);
													setFormData((prev) => ({ ...prev, ImageUrl: "" }));
												} else {
													setImageFile(null);
												}
											}}
											className="cursor-pointer text-xs"
										/>
									</div>
									<div className="flex flex-col gap-1.5">
										<Label htmlFor="ImageUrl" className="text-xs font-semibold text-foreground">
											OR Paste Image URL
										</Label>
										<Input
											id="ImageUrl"
											type="url"
											placeholder="https://example.com/photo.jpg"
											value={formData.ImageUrl}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													ImageUrl: e.target.value,
												}))
											}
											disabled={!!imageFile}
										/>
									</div>
								</div>
							</div>
						</div>

						<DialogFooter className="border-t pt-3 gap-2">
							<Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
								Cancel
							</Button>
							<Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 font-bold px-6">
								Create & Publish Property
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

		</div>
	);
}
