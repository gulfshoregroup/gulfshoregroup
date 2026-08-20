"use client";

import Link from "next/link";
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

interface City {
	City: string;
	PropertyCount: number;
	name: string;
}

export default function CitiesPage() {
	const [cities, setCities] = useState<City[]>();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [totalCount, setTotalCount] = useState(0);

	const [searchTerm, setSearchTerm] = useState("");
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [formData, setFormData] = useState({
		City: "",
		title: "",
		metaDescription: "",
		keywords: "",
		infoText: "",
		isFeatured: false,
		defaultImage: "",
	});

	const handleCreateCity = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.City) {
			toast.error("City name is required");
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

			const res = await axios.post("/api/cities", payload);
			
			setIsCreateOpen(false);
			setFormData({
				City: "",
				title: "",
				metaDescription: "",
				keywords: "",
				infoText: "",
				isFeatured: false,
				defaultImage: "",
			});
			setImageFile(null);
			toast.success("City created successfully!");
			fetchCities();
		} catch (err: any) {
			toast.error(err.response?.data?.error || err.message || "Failed to create city");
		}
	};

	const fetchCities = async () => {
		try {
			const res = await axios.get("/api/cities");
			setCities(res.data.data);
			setTotalCount(res.data.totalCount);
		} catch (error) {}
	};

	const filteredRequest = cities?.filter((request) => {
		const matchesSearch =
			request.City.toLowerCase().includes(searchTerm.toLowerCase()) ||
			request.name.toLowerCase().includes(searchTerm.toLowerCase());

		return matchesSearch;
	});

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				await fetchCities();
			} catch (error: any) {
				setError(error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	return (
		<div className="space-y-6 px-4 my-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">
						Cities{" "}
						<span className="text-muted-foreground text-sm font-normal">
							{totalCount !== 0 && `(${totalCount})`}
						</span>
					</h1>
					<p className="text-muted-foreground mt-1">Manage all service areas and cities</p>
				</div>
				<Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
					<Plus className="h-4 w-4" />
					Add City
				</Button>
			</div>

			<div className="flex items-center gap-2">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						onChange={(e) => setSearchTerm(e.target.value)}
						type="search"
						placeholder="Search cities..."
						className="pl-8"
					/>
				</div>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[60%]">City</TableHead>
							<TableHead>Properties</TableHead>
							<TableHead className="w-[80px]">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredRequest?.map((city, i) => (
							<TableRow key={i}>
								<TableCell>
									<div className="font-medium">
										{capitalizeWords(city.City)}
									</div>
								</TableCell>
								<TableCell>{city.PropertyCount}</TableCell>
								<TableCell>
									<Link
										href={`/admin/cities/${capitalizeWords(
											city.City
										).replaceAll(" ", "-")}/edit`}>
										<Button variant="ghost" size="icon">
											<Edit className="h-4 w-4" />
											<span className="sr-only">Edit</span>
										</Button>
									</Link>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent className="sm:max-w-[700px] w-[95vw] rounded-xl max-h-[90vh] overflow-hidden flex flex-col">
					<form onSubmit={handleCreateCity} className="flex flex-col h-full overflow-hidden">
						<DialogHeader className="px-6 py-4 border-b shrink-0">
							<DialogTitle>Add New City</DialogTitle>
							<DialogDescription>
								Fill in the details below to add a new city to your database.
							</DialogDescription>
						</DialogHeader>
						<div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
							
							<div className="grid gap-2">
								<Label htmlFor="City">City Name <span className="text-red-500">*</span></Label>
								<Input
									id="City"
									required
									placeholder="e.g. Naples"
									value={formData.City}
									onChange={(e) => setFormData({ ...formData, City: e.target.value })}
								/>
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
								<Label htmlFor="infoText">City Description</Label>
								<Textarea
									id="infoText"
									rows={4}
									placeholder="Describe the city's key features, attractions, and lifestyle..."
									value={formData.infoText}
									onChange={(e) => setFormData({ ...formData, infoText: e.target.value })}
								/>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="grid gap-2">
									<Label htmlFor="isFeatured">Publication Status</Label>
									<Select
										value={formData.isFeatured ? "true" : "false"}
										onValueChange={(v) => setFormData({ ...formData, isFeatured: v === "true" })}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="false">Standard</SelectItem>
											<SelectItem value="true">Featured</SelectItem>
										</SelectContent>
									</Select>
								</div>
								
								<div className="grid gap-2">
									<Label htmlFor="imageFile">Default City Image</Label>
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
							</div>

							<div className="grid gap-2">
								<Label htmlFor="defaultImage" className="text-muted-foreground text-xs">
									OR Paste Image URL
								</Label>
								<Input
									id="defaultImage"
									type="url"
									placeholder="https://example.com/city-photo.jpg"
									value={formData.defaultImage}
									onChange={(e) => setFormData({ ...formData, defaultImage: e.target.value })}
									disabled={!!imageFile}
								/>
							</div>

						</div>
						<DialogFooter className="px-6 py-4 border-t shrink-0">
							<Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
							<Button type="submit">Create City</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
