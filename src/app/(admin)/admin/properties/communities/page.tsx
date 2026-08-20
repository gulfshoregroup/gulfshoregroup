/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Edit, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import capitalizeWords from "@/hooks/capitalizeFirstLetter";
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
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface Community {
	Development: string;
	name: string;
	PropertyCount: number;
	City: string;
}

export default function CommunitiesPage() {
	const [communities, setCommunities] = useState<Community[]>([]);
	const [citiesList, setCitiesList] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [totalCount, setTotalCount] = useState(0);
	const [page, setPage] = useState(1);
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredCommunities, setFilteredCommunities] = useState<
		Community[]
	>([]);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [formData, setFormData] = useState({
		Development: "",
		City: "",
		title: "",
		metaDescription: "",
		keywords: "",
		infoText: "",
		defaultImage: "",
	});


	const handleCreateCommunity = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.Development || !formData.City) {
			toast.error("Community Name and City Name are required");
			return;
		}

		let finalImageUrl = formData.defaultImage;

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

			const payload = { ...formData, defaultImage: finalImageUrl };

			await axios.post("/api/community", payload);
			
			setIsCreateOpen(false);
			setFormData({
				Development: "",
				City: "",
				title: "",
				metaDescription: "",
				keywords: "",
				infoText: "",
				defaultImage: "",
			});
			setImageFile(null);
			toast.success("Community created successfully!");
			fetchCommunities(1);
		} catch (err: any) {
			toast.error(err.response?.data?.error || err.message || "Failed to create community");
		}
	};

	const limit = 2000;

	// Fetch communities
	const fetchCommunities = async (pageNum = 1) => {
		try {
			setLoading(true);
			const res = await axios.get(
				`/api/community?page=${pageNum}&limit=${limit}`
			);
			setTotalCount(res.data.totalCount || 0);
			setCommunities(res.data.data || []);
			console.log(res.data.data);
		} catch (err: any) {
			setError(err.message || "Failed to fetch communities");
		} finally {
			setLoading(false);
		}
	};

	// Fetch cities
	const fetchCities = async () => {
		try {
			const res = await axios.get("/api/cities");
			if (res.data?.data) {
				const names = res.data.data.map((c: any) => c.City || c.name).filter(Boolean);
				const uniqueNames = Array.from(new Set(names)) as string[];
				setCitiesList(uniqueNames);
				if (uniqueNames.length > 0 && !formData.City) {
					setFormData((prev) => ({ ...prev, City: uniqueNames[0] }));
				}
			}
		} catch (err) {
			console.error("Failed to fetch cities for dropdown:", err);
		}
	};

	useEffect(() => {
		fetchCommunities(page);
		fetchCities();
	}, []);


	const pageHandler = (pageNum: number) => {
		setPage(pageNum);
		fetchCommunities(pageNum);
	};

	const handleSearch = (term: string) => {
		setSearchTerm(term);
		if (term.trim() === "") {
			setFilteredCommunities(communities);
		} else {
			const filtered = communities.filter((community) =>
				community.Development.toLowerCase().includes(
					term.toLowerCase()
				)
			);
			setFilteredCommunities(filtered);
		}
	};
	const filteredRequest = communities?.filter((request) => {
		const matchesSearch =
			request.Development.toLowerCase().includes(
				searchTerm.toLowerCase()
			) ||
			request.name.toLowerCase().includes(searchTerm.toLowerCase());

		return matchesSearch;
	});

	const totalPages = Math.ceil(totalCount / limit);

	return (
		<div className="space-y-6 px-4 my-5">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">
						Communities{" "}
						{totalCount > 0 && (
							<span className="text-muted-foreground text-sm font-normal">
								({totalCount})
							</span>
						)}
					</h1>
					<p className="text-muted-foreground mt-1">Manage communities and neighborhoods</p>
				</div>
				<Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
					<Plus className="h-4 w-4" />
					Add Community
				</Button>
			</div>

			{/* Search */}
			<div className="flex items-center gap-2">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Search communities..."
						className="pl-8"
					/>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-md border">
				{loading ? (
					<div className="p-6 text-center text-muted-foreground">
						Loading...
					</div>
				) : error ? (
					<div className="p-6 text-center text-red-500">{error}</div>
				) : filteredRequest.length === 0 ? (
					<div className="p-6 text-center text-muted-foreground">
						No communities found.
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Community</TableHead>
								<TableHead>City</TableHead>

								<TableHead>Properties</TableHead>
								<TableHead className="w-[80px]">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredRequest.map((community, i) => (
								<TableRow key={i}>
									<TableCell>
										<div className="font-medium">
											{capitalizeWords(community.Development)}
										</div>
									</TableCell>
									<TableCell>
										<div className="font-medium">
											{capitalizeWords(community.City)}
										</div>
									</TableCell>
									<TableCell>{community.PropertyCount}</TableCell>
									<TableCell>
										<Link
											href={`/admin/communities/${capitalizeWords(
												community.Development
											).replaceAll(" ", "-")}/edit`}>
											<Button variant="ghost" size="icon">
												<Edit className="h-4 w-4" />
											</Button>
										</Link>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<Pagination>
					<PaginationContent>
						{page > 1 && (
							<PaginationItem>
								<PaginationPrevious
									onClick={() => pageHandler(page - 1)}
									className={
										page === 1 ? "pointer-events-none opacity-50 cursor-pointer" : "cursor-pointer"
									}
								/>
							</PaginationItem>
						)}

						{page < totalPages && (
							<PaginationItem>
								<PaginationNext
									onClick={() => pageHandler(page + 1)}
									className={
										page === totalPages
											? "pointer-events-none opacity-50 cursor-pointer"
											: "cursor-pointer"
									}
								/>
							</PaginationItem>
						)}
					</PaginationContent>
				</Pagination>
			)}

			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent className="sm:max-w-[700px] w-[95vw] rounded-xl max-h-[90vh] overflow-hidden flex flex-col">
					<form onSubmit={handleCreateCommunity} className="flex flex-col h-full overflow-hidden">
						<DialogHeader className="px-6 py-4 border-b shrink-0">
							<DialogTitle>Add New Community</DialogTitle>
							<DialogDescription>
								Fill in the details below to add a new community to the database.
							</DialogDescription>
						</DialogHeader>
						<div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
							
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="grid gap-2">
									<Label htmlFor="Development">Community Name <span className="text-red-500">*</span></Label>
									<Input
										id="Development"
										required
										placeholder="e.g. Seagate"
										value={formData.Development}
										onChange={(e) => setFormData({ ...formData, Development: e.target.value })}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="City">City Name <span className="text-red-500">*</span></Label>
									<Select
										value={formData.City}
										onValueChange={(val) => setFormData((prev) => ({ ...prev, City: val }))}
									>
										<SelectTrigger id="City" className="w-full">
											<SelectValue placeholder="Select existing city..." />
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
									<p className="text-[10px] text-muted-foreground leading-tight">Select an active city from your database</p>
								</div>

							</div>

							<div className="grid gap-2">
								<Label htmlFor="title">Meta Title (SEO)</Label>
								<Input
									id="title"
									placeholder="SEO title for search results"
									value={formData.title}
									onChange={(e) => setFormData({ ...formData, title: e.target.value })}
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="metaDescription">Meta Description (SEO)</Label>
								<Textarea
									id="metaDescription"
									rows={2}
									placeholder="SEO description for search results"
									value={formData.metaDescription}
									onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="keywords">Keywords</Label>
								<Input
									id="keywords"
									placeholder="Comma-separated keywords"
									value={formData.keywords}
									onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="infoText">Community Description</Label>
								<Textarea
									id="infoText"
									rows={4}
									placeholder="Describe the community's key features, attractions, and lifestyle..."
									value={formData.infoText}
									onChange={(e) => setFormData({ ...formData, infoText: e.target.value })}
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="imageFile">Default Community Image</Label>
								<Input
									id="imageFile"
									type="file"
									accept="image/*"
									onChange={(e) => {
										if (e.target.files && e.target.files[0]) {
											setImageFile(e.target.files[0]);
											setFormData({ ...formData, defaultImage: "" });
										} else {
											setImageFile(null);
										}
									}}
									className="cursor-pointer"
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="defaultImage" className="text-muted-foreground text-xs">
									OR Paste Image URL
								</Label>
								<Input
									id="defaultImage"
									type="url"
									placeholder="https://example.com/community-photo.jpg"
									value={formData.defaultImage}
									onChange={(e) => setFormData({ ...formData, defaultImage: e.target.value })}
									disabled={!!imageFile}
								/>
							</div>

						</div>
						<DialogFooter className="px-6 py-4 border-t shrink-0">
							<Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
							<Button type="submit">Create Community</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
