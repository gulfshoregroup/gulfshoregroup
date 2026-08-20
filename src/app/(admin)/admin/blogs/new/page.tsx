"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import UploadImg from "@/components/cloudinary/uploadImg";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function NewBlogPage() {
	const router = useRouter();
	const [formData, setFormData] = useState<any>({
		title: "",
		slug: "",
		description: "",
		content: "",
		category: "others",
		metaTitle: "",
		metaDescription: "",
		metaKeywords: "",
		coverImage: "",
		published: true,
		Images: [],
		defaultImage: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Keep coverImage updated with whatever UploadImg sets as defaultImage
	useEffect(() => {
		if (formData.defaultImage) {
			setFormData((prev: any) => {
				if (prev.coverImage !== prev.defaultImage) {
					return { ...prev, coverImage: prev.defaultImage };
				}
				return prev;
			});
		}
	}, [formData.defaultImage]);

	const handleSave = async () => {
		if (!formData.title.trim()) {
			toast.error("Blog title is required");
			return;
		}
		if (!formData.slug.trim()) {
			toast.error("Blog slug is required");
			return;
		}

		try {
			setLoading(true);
			const payload = {
				...formData,
				metaKeywords: typeof formData.metaKeywords === "string" ? formData.metaKeywords.split(",").map((k: string) => k.trim()).filter(Boolean) : formData.metaKeywords,
				coverImage: formData.defaultImage || formData.coverImage || "",
			};
			await axios.post("/api/blogs", payload);
			toast.success("Blog created successfully!");
			router.push("/admin/blogs");
		} catch (error) {
			toast.error("Failed to create blog.");
		} finally {
			setLoading(false);
		}
	};

	if (loading)
		return (
			<div className="p-6 text-center font-bold text-muted-foreground">
				Creating blog...
			</div>
		);

	return (
		<div className="space-y-6 px-4 my-5">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="outline" size="sm" asChild>
						<Link href="/admin/blogs">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Blogs
						</Link>
					</Button>
					<div>
						<h1 className="text-3xl font-bold text-foreground">
							Create New Blog
						</h1>
						<p className="text-muted-foreground">
							Add a new blog post and marketing content
						</p>
					</div>
				</div>
				<div className="flex gap-2">
					<Button onClick={handleSave} className="bg-[#B89A6A] hover:bg-[#a6895b] text-white">
						<Save className="h-4 w-4 mr-2" />
						Create Blog
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main Content */}
				<div className="lg:col-span-2 space-y-6">
					{/* Basic Information */}
					<Card>
						<CardHeader>
							<CardTitle>Basic Information</CardTitle>
							<CardDescription>
								Core blog details
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="title-field">Blog Title</Label>
									<Input
										id="title-field"
										value={formData.title}
										onChange={(e) => {
											const val = e.target.value;
											const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
											setFormData({
												...formData,
												title: val,
												slug: generatedSlug,
											});
										}}
										placeholder="e.g. Living in Naples, Florida"
									/>
								</div>
								<div>
									<Label htmlFor="slug-field">Blog Slug</Label>
									<Input
										id="slug-field"
										value={formData.slug}
										onChange={(e) => {
											setFormData({
												...formData,
												slug: e.target.value,
											});
										}}
										placeholder="e.g. living-in-naples"
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* SEO Settings */}
					<Card>
						<CardHeader>
							<CardTitle>SEO Settings</CardTitle>
							<CardDescription>
								Search engine optimization settings
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label htmlFor="metaTitle">Meta Title</Label>
								<Input
									id="metaTitle"
									value={formData.metaTitle}
									onChange={(e) =>
										setFormData({
											...formData,
											metaTitle: e.target.value,
										})
									}
									placeholder="SEO title for search results"
								/>
								<p className="text-xs text-muted-foreground mt-1">
									{formData.metaTitle?.length || 0}/60 characters
								</p>
							</div>
							<div>
								<Label htmlFor="metaDescription">
									Meta Description
								</Label>
								<Textarea
									id="metaDescription"
									rows={3}
									value={formData.metaDescription}
									onChange={(e) =>
										setFormData({
											...formData,
											metaDescription: e.target.value,
										})
									}
									placeholder="SEO description for search results"
								/>
								<p className="text-xs text-muted-foreground mt-1">
									{formData.metaDescription?.length || 0}/160 characters
								</p>
							</div>
							<div>
								<Label htmlFor="keywords">Keywords</Label>
								<Input
									id="keywords"
									value={formData.metaKeywords}
									onChange={(e) =>
										setFormData({
											...formData,
											metaKeywords: e.target.value,
										})
									}
									placeholder="e.g. Real Estate, Naples, Florida"
								/>
							</div>
						</CardContent>
					</Card>

					{/* Content & Description */}
					<Card>
						<CardHeader>
							<CardTitle>Content & Description</CardTitle>
							<CardDescription>
								Blog summary description and main content
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label htmlFor="description-field">Short Description</Label>
								<Textarea
									id="description-field"
									rows={3}
									value={formData.description}
									onChange={(e) =>
										setFormData({
											...formData,
											description: e.target.value,
										})
									}
									placeholder="Brief summary of the blog post..."
								/>
							</div>
							<div>
								<Label htmlFor="content-field">Blog Content</Label>
								<Textarea
									id="content-field"
									rows={12}
									value={formData.content}
									onChange={(e) =>
										setFormData({
											...formData,
											content: e.target.value,
										})
									}
									placeholder="Write the full blog post content here..."
								/>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Status & Category */}
					<Card>
						<CardHeader>
							<CardTitle>Settings</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label htmlFor="published-field">Publication Status</Label>
								<Select
									value={formData.published ? "true" : "false"}
									onValueChange={(value) =>
										setFormData({
											...formData,
											published: value === "true",
										})
									}>
									<SelectTrigger id="published-field">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="true">Published</SelectItem>
										<SelectItem value="false">Draft</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label htmlFor="category-field">Category</Label>
								<Select
									value={formData.category}
									onValueChange={(value) =>
										setFormData({
											...formData,
											category: value,
										})
									}>
									<SelectTrigger id="category-field">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="lifestyle">Lifestyle</SelectItem>
										<SelectItem value="market-reports">Market Reports</SelectItem>
										<SelectItem value="buyers">Buyers Guide</SelectItem>
										<SelectItem value="sellers">Sellers Guide</SelectItem>
										<SelectItem value="others">Others</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardContent>
					</Card>

					{/* Cover Image */}
					<Card>
						<CardHeader>
							<CardTitle>Cover Image</CardTitle>
							<CardDescription>
								Main banner image representing this blog post
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{formData.coverImage && (
								<div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
									<img
										src={formData.coverImage}
										alt="Cover"
										className="w-full h-full object-cover"
									/>
								</div>
							)}

							<UploadImg
								formData={formData}
								setFormData={setFormData}
							/>
							<p className="text-xs text-muted-foreground">
								Recommended size: 1200x630px
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
