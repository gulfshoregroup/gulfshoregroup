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
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Search, Edit, Plus, Trash2, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

interface Blog {
	id: string;
	title: string;
	slug: string;
	category: string;
	published: boolean;
	createdAt: string;
	content?: string;
	coverImage?: string;
}

export default function BlogsPage() {
	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [totalCount, setTotalCount] = useState(0);

	const [previewBlog, setPreviewBlog] = useState<Blog | null>(null);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);

	const [searchTerm, setSearchTerm] = useState("");
	const filteredRequest = blogs?.filter((blog) => {
		const matchesSearch =
			blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			blog.category?.toLowerCase().includes(searchTerm.toLowerCase());

		return matchesSearch;
	});
	const fetchBlogs = async () => {
		try {
			const res = await axios.get("/api/blogs");
			setBlogs(res.data.data || []);
			setTotalCount(res.data.totalCount || 0);
		} catch (error: any) {
			setError(error);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this blog?")) return;
		try {
			await axios.delete(`/api/blogs/${id}`);
			await fetchBlogs();
			toast.success("Blog deleted successfully!");
		} catch (error: any) {
			toast.error("Failed to delete blog: " + error.message);
		}
	};

	const handleTogglePublish = async (blog: Blog) => {
		try {
			await axios.put(`/api/blogs/${blog.id}`, {
				published: !blog.published,
			});
			await fetchBlogs();
			toast.success(`Blog ${blog.published ? 'Unpublished' : 'Published'} successfully!`);
		} catch (error: any) {
			toast.error("Failed to update status: " + error.message);
		}
	};

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				await fetchBlogs();
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
				<h1 className="text-3xl font-bold">
					Blogs{" "}
					<span className="text-muted-foreground text-sm font-normal">
						{totalCount !== 0 && `(${totalCount})`}
					</span>
				</h1>
				<Link href="/admin/blogs/new">
					<Button className="bg-[#B89A6A] hover:bg-[#a6895b] text-white">
						<Plus className="h-4 w-4 mr-2" />
						Create Blog
					</Button>
				</Link>
			</div>

			<div className="flex items-center gap-2">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						onChange={(e) => setSearchTerm(e.target.value)}
						type="search"
						placeholder="Search blogs..."
						className="pl-8"
					/>
				</div>
			</div>

			<div className="rounded-md border">
				{loading ? (
					<div className="p-6 text-center text-muted-foreground">Loading...</div>
				) : error ? (
					<div className="p-6 text-center text-red-500">Error loading blogs</div>
				) : filteredRequest.length === 0 ? (
					<div className="p-6 text-center text-muted-foreground">No blogs found.</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Title</TableHead>
								<TableHead>Category</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Created At</TableHead>
								<TableHead className="w-[80px]">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredRequest?.map((blog) => (
								<TableRow key={blog.id}>
									<TableCell>
										<div className="font-medium">
											{blog.title}
										</div>
										<div className="text-xs text-muted-foreground">
											/{blog.slug}
										</div>
									</TableCell>
									<TableCell>
										<span className="text-sm capitalize">{blog.category}</span>
									</TableCell>
									<TableCell>
										<Badge
											variant={blog.published ? "default" : "secondary"}
											className="cursor-pointer"
											onClick={() => handleTogglePublish(blog)}
											title="Click to toggle status"
										>
											{blog.published ? "Published" : "Draft"}
										</Badge>
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{new Date(blog.createdAt).toLocaleDateString()}
									</TableCell>
									<TableCell className="flex gap-2 items-center">
										<Button 
											variant="ghost" 
											size="icon" 
											title="Preview Blog"
											onClick={() => {
												setPreviewBlog(blog);
												setIsPreviewOpen(true);
											}}
										>
											<Eye className="h-4 w-4" />
											<span className="sr-only">View</span>
										</Button>
										<Link href={`/admin/blogs/${blog.id}`}>
											<Button variant="ghost" size="icon" title="Edit Blog">
												<Edit className="h-4 w-4 text-blue-600" />
												<span className="sr-only">Edit</span>
											</Button>
										</Link>
										<Button 
											variant="ghost" 
											size="icon" 
											onClick={() => handleDelete(blog.id)}
											title="Delete Blog"
										>
											<Trash2 className="h-4 w-4 text-red-600" />
											<span className="sr-only">Delete</span>
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>

			<Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
				<DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="text-2xl font-bold">{previewBlog?.title}</DialogTitle>
					</DialogHeader>
					<div className="mt-4 space-y-4">
						{previewBlog?.coverImage && (
							<img 
								src={previewBlog.coverImage} 
								alt={previewBlog.title} 
								className="w-full h-64 object-cover rounded-lg"
							/>
						)}
						<div className="flex items-center gap-2">
							<Badge variant={previewBlog?.published ? "default" : "secondary"}>
								{previewBlog?.published ? "Published" : "Draft"}
							</Badge>
							<span className="text-sm text-muted-foreground capitalize">
								{previewBlog?.category}
							</span>
						</div>
						<div 
							className="prose prose-sm max-w-none mt-6"
							dangerouslySetInnerHTML={{ __html: previewBlog?.content || "No content available." }}
						/>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
