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
import { ArrowLeft, Save, Video, Plus, Trash } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import UploadImg from "@/components/cloudinary/uploadImg";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function EditCommunityPage() {
	const params = useParams<{ id: string }>();
	const [formData, setFormData] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [generatingAi, setGeneratingAi] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const id = params.id;
				const cname = decodeURIComponent(id).replaceAll(/-/g, " ");
				const res = await axios.get(`/api/community/${cname}`);
				let loadedData = res.data.data;
				
				if (loadedData && loadedData.description) {
					try {
						if (loadedData.description.startsWith("{")) {
							const parsed = JSON.parse(loadedData.description);
							loadedData = {
								...loadedData,
								infoText: parsed.infoText || "",
								title: parsed.title || "",
								metaDescription: parsed.metaDescription || "",
								keywords: parsed.keywords || "",
							};
						}
					} catch (e) {}
				}
				
				setFormData(loadedData);
			} catch (err) {
				console.error(err);
				setError("Failed to load community data.");
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [params.id]);

	const getEmbedUrl = (url: string) => {
		if (!url) return null;
		let videoId = "";
		if (url.includes("youtube.com/watch?v=")) {
			videoId = url.split("watch?v=")[1].split("&")[0];
		} else if (url.includes("youtu.be/")) {
			videoId = url.split("youtu.be/")[1].split("?")[0];
		}
		
		if (videoId) {
			return `https://www.youtube.com/embed/${videoId}`;
		}
		
		if (url.includes("vimeo.com/")) {
			const vimeoId = url.split("vimeo.com/")[1].split("?")[0];
			if (vimeoId && !isNaN(Number(vimeoId))) {
				return `https://player.vimeo.com/video/${vimeoId}`;
			}
		}
		
		return url;
	};

	const addGolfCourse = () => {
		const courses = formData.golfCourses || [];
		setFormData({
			...formData,
			golfCourses: [
				...courses,
				{ name: "", opened: "", architect: "", par: "", holes: "", yards: "", rating: "", slope: "" }
			]
		});
	};

	const removeGolfCourse = (index: number) => {
		const courses = [...(formData.golfCourses || [])];
		courses.splice(index, 1);
		setFormData({ ...formData, golfCourses: courses });
	};

	const updateGolfCourse = (index: number, field: string, value: string) => {
		const courses = [...(formData.golfCourses || [])];
		courses[index] = { ...courses[index], [field]: value };
		setFormData({ ...formData, golfCourses: courses });
	};

	const handleGenerateAi = async () => {
		try {
			setGeneratingAi(true);
			const res = await axios.post(`/api/admin/generate-community-ai`, {
				communityId: formData.id,
				isGolfCommunity: formData.isGolfCommunity || false
			});
			if (res.data.success) {
				setFormData({
					...formData,
					infoText: res.data.parsedData.infoText,
					description: res.data.community.description,
					title: res.data.parsedData.title,
					metaDescription: res.data.parsedData.metaDescription,
					keywords: res.data.parsedData.keywords
				});
				toast.success("AI Content generated successfully!");
			}
		} catch (err) {
			console.error(err);
			toast.error("Failed to generate AI description.");
		} finally {
			setGeneratingAi(false);
		}
	};

	const handleSave = async () => {
		try {
			setIsSaving(true);
			const id = params.id;
			const dataToSave = { ...formData };
			if (dataToSave.title || dataToSave.metaDescription || dataToSave.keywords || dataToSave.infoText) {
				dataToSave.description = JSON.stringify({
					infoText: dataToSave.infoText || "",
					title: dataToSave.title || "",
					metaDescription: dataToSave.metaDescription || "",
					keywords: dataToSave.keywords || ""
				});
			}
			const res = await axios.put(`/api/community/${id}`, dataToSave);
			
			let loadedData = res.data.data;
			if (loadedData && loadedData.description) {
				try {
					if (loadedData.description.startsWith("{")) {
						const parsed = JSON.parse(loadedData.description);
						loadedData = {
							...loadedData,
							infoText: parsed.infoText || "",
							title: parsed.title || "",
							metaDescription: parsed.metaDescription || "",
							keywords: parsed.keywords || "",
						};
					}
				} catch (e) {}
			}
			setFormData(loadedData);
			toast.success("Community updated successfully!");
		} catch (err) {
			console.error(err);
			setError("Failed to upload community data.");
		} finally {
			setIsSaving(false);
		}
	};

	if (loading)
		return (
			<div className="p-6 text-center font-bold text-muted-foreground">
				Loading community data...
			</div>
		);

	if (error)
		return (
			<div className="p-6 text-center text-red-500">
				Error: {error}
			</div>
		);

	if (!formData)
		return (
			<div className="p-6 text-center font-bold text-muted-foreground">
				No Data available.
			</div>
		);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="outline" size="sm" asChild>
						<Link href="/admin/properties/communities">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Communities
						</Link>
					</Button>
					<div>
						<h1 className="text-3xl font-bold text-foreground">
							Edit Community: {formData.name}
						</h1>
						<p className="text-muted-foreground">
							Update community information and marketing content
						</p>
					</div>
				</div>
				<Button onClick={handleSave} disabled={isSaving}>
					<Save className="h-4 w-4 mr-2" />
					{isSaving ? "Saving..." : "Save Changes"}
				</Button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* LEFT SIDE */}
				<div className="lg:col-span-2 space-y-6">
					{/* AI Content Generator */}
					<Card className="border-primary/50 shadow-sm bg-primary/5">
						<CardHeader className="flex flex-row items-center justify-between pb-4">
							<div>
								<CardTitle className="text-primary flex items-center gap-2">
									✨ AI Content Generator
								</CardTitle>
								<CardDescription>
									Automatically generate SEO fields and HTML description for this community
								</CardDescription>
							</div>
							<div className="flex items-center gap-4">
								<div className="flex items-center space-x-2">
									<input 
										type="checkbox" 
										id="isGolfCommunity" 
										checked={formData.isGolfCommunity || false}
										onChange={(e) => setFormData({ ...formData, isGolfCommunity: e.target.checked })}
										className="w-4 h-4 accent-primary"
									/>
									<Label htmlFor="isGolfCommunity" className="text-sm font-medium">Is Golf Community?</Label>
								</div>
								<Button 
									onClick={handleGenerateAi} 
									disabled={generatingAi}
									className="bg-primary hover:bg-primary/90 text-primary-foreground"
								>
									{generatingAi ? "Generating..." : "Generate AI Content"}
								</Button>
							</div>
						</CardHeader>
					</Card>

					{/* Basic Info */}
					<Card>
						<CardHeader>
							<CardTitle>Basic Information</CardTitle>
							<CardDescription>
								Core community details and demographics
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="name">Community Name</Label>
									<Input
										id="name"
										disabled
										value={formData.name || ""}
										onChange={(e) =>
											setFormData({
												...formData,
												name: e.target.value,
											})
										}
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
								<Label htmlFor="title">Meta Title</Label>
								<Input
									id="title"
									value={formData.title || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											title: e.target.value,
										})
									}
									placeholder="SEO title for search results"
								/>
								<p className="text-xs text-muted-foreground mt-1">
									{formData.title?.length || 0}/60 characters
								</p>
							</div>
							<div>
								<Label htmlFor="metaDescription">
									Meta Description
								</Label>
								<Textarea
									id="metaDescription"
									rows={3}
									value={formData.metaDescription || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											metaDescription: e.target.value,
										})
									}
									placeholder="SEO description for search results"
								/>
								<p className="text-xs text-muted-foreground mt-1">
									{formData.metaDescription?.length || 0}/160
									characters
								</p>
							</div>
							<div>
								<Label htmlFor="keywords">Keywords</Label>
								<Input
									id="keywords"
									value={formData.keywords || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											keywords: e.target.value,
										})
									}
									placeholder="Comma-separated keywords"
								/>
							</div>
						</CardContent>
					</Card>

					{/* Description */}
					<Card>
						<CardHeader>
							<CardTitle>Content & Description</CardTitle>
							<CardDescription>
								Marketing content and community description
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Label htmlFor="infoText">Community Description (HTML)</Label>
							<Textarea
								id="infoText"
								rows={12}
								value={formData.infoText || formData.description || ""}
								onChange={(e) =>
									setFormData({
										...formData,
										infoText: e.target.value
									})
								}
								placeholder="Describe the community's key features, attractions, and lifestyle... Use HTML tags."
							/>
						</CardContent>
					</Card>

					{/* Golf Courses (Only if isGolfCommunity) */}
					{formData.isGolfCommunity && (
						<Card className="border-green-500/20 shadow-sm">
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle className="text-green-700">Golf Courses</CardTitle>
									<CardDescription>
										Manage the specific golf courses within this community
									</CardDescription>
								</div>
								<Button onClick={addGolfCourse} type="button" size="sm" className="bg-green-600 hover:bg-green-700">
									<Plus className="w-4 h-4 mr-1" /> Add Course
								</Button>
							</CardHeader>
							<CardContent className="space-y-6">
								{(!formData.golfCourses || formData.golfCourses.length === 0) ? (
									<p className="text-sm text-muted-foreground italic">No golf courses added yet. Click "Add Course" above.</p>
								) : (
									formData.golfCourses.map((course: any, idx: number) => (
										<div key={idx} className="p-4 border rounded-lg bg-gray-50/50 space-y-4 relative">
											<Button 
												variant="ghost" 
												size="icon" 
												className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-100"
												onClick={() => removeGolfCourse(idx)}
											>
												<Trash className="w-4 h-4" />
											</Button>
											
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<Label>Course Name</Label>
													<Input 
														value={course.name || ""} 
														onChange={(e) => updateGolfCourse(idx, "name", e.target.value)} 
														placeholder="e.g. South Course" 
													/>
												</div>
												<div>
													<Label>Architect / Designer</Label>
													<Input 
														value={course.architect || ""} 
														onChange={(e) => updateGolfCourse(idx, "architect", e.target.value)} 
														placeholder="e.g. Tom Fazio" 
													/>
												</div>
											</div>
											
											<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
												<div>
													<Label>Holes</Label>
													<Input 
														value={course.holes || ""} 
														onChange={(e) => updateGolfCourse(idx, "holes", e.target.value)} 
														placeholder="e.g. 18" 
													/>
												</div>
												<div>
													<Label>Par</Label>
													<Input 
														value={course.par || ""} 
														onChange={(e) => updateGolfCourse(idx, "par", e.target.value)} 
														placeholder="e.g. 72" 
													/>
												</div>
												<div>
													<Label>Year Opened</Label>
													<Input 
														value={course.opened || ""} 
														onChange={(e) => updateGolfCourse(idx, "opened", e.target.value)} 
														placeholder="e.g. 2002" 
													/>
												</div>
												<div>
													<Label>Yards</Label>
													<Input 
														value={course.yards || ""} 
														onChange={(e) => updateGolfCourse(idx, "yards", e.target.value)} 
														placeholder="e.g. 7,100" 
													/>
												</div>
											</div>
											<div className="grid grid-cols-2 gap-4">
												<div>
													<Label>Rating</Label>
													<Input 
														value={course.rating || ""} 
														onChange={(e) => updateGolfCourse(idx, "rating", e.target.value)} 
														placeholder="e.g. 74.5" 
													/>
												</div>
												<div>
													<Label>Slope</Label>
													<Input 
														value={course.slope || ""} 
														onChange={(e) => updateGolfCourse(idx, "slope", e.target.value)} 
														placeholder="e.g. 138" 
													/>
												</div>
											</div>
										</div>
									))
								)}
							</CardContent>
						</Card>
					)}
				</div>

				{/* RIGHT SIDE */}
				<div className="space-y-6">
					{/* Default Image */}
					<Card>
						<CardHeader>
							<CardTitle>Default Community Image</CardTitle>
							<CardDescription>
								Main image representing this community
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{formData.Images?.length > 0 && (
								<div className="aspect-video bg-muted rounded-lg overflow-hidden">
									<img
										src={formData.defaultImage || formData.Images[0]}
										alt={`${formData.name} image`}
										className="w-full h-full object-cover"
									/>
								</div>
							)}

							<UploadImg
								formData={formData}
								setFormData={setFormData}
								seoFileName={formData.slug ? `${formData.slug}-naples-fl-community-entrance` : undefined}
							/>
							<p className="text-xs text-muted-foreground">
								Recommended: 1200x600px, JPG or PNG format
							</p>
						</CardContent>
					</Card>

					{/* Video */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Video className="w-5 h-5" />
								Community Video
							</CardTitle>
							<CardDescription>
								Embed a promotional video for the community
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label htmlFor="videoUrl">Video URL</Label>
								<Input
									id="videoUrl"
									placeholder="Paste YouTube or Vimeo URL..."
									value={formData.videoUrl || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											videoUrl: e.target.value,
										})
									}
								/>
								<p className="text-xs text-muted-foreground mt-2">
									Paste a YouTube or Vimeo URL to embed a video on the community page
								</p>
							</div>

							{formData.videoUrl && (
								<div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
									<iframe
										src={getEmbedUrl(formData.videoUrl) || formData.videoUrl}
										className="absolute top-0 left-0 w-full h-full"
										allowFullScreen
										title="Community Video Preview"
									></iframe>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Stats */}
					<Card>
						<CardHeader>
							<CardTitle>Community Statistics</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex justify-between">
								<span className="text-sm text-muted-foreground">
									Total Properties
								</span>
								<span className="font-medium">
									{formData.PropertyCount ?? 0}
								</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
