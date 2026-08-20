import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Footer from "@/components/global/footer";

export default async function BlogDetailPage({
	params,
}: {
	params: {
		id: string;
	};
}) {
	const slug = (await params).id;

	// ✅ Fetch blog by slug from your API
	const baseUrl =
		process.env.NEXT_PUBLIC_SERVER_URL ||
		process.env.NEXT_PUBLIC_BASE_URL ||
		"http://localhost:3000";
	const res = await fetch(
		`${baseUrl}/api/v2/blogs?slug=${slug}`,
		{ cache: "no-store" }
	);

	if (!res.ok) {
		return (
			<main className="min-h-screen bg-background">
				<div className="container mx-auto px-4 py-12">
					<h1 className="text-2xl font-bold text-foreground mb-4">
						Blog not found
					</h1>
					<Link href="/">
						<Button variant="outline">Back to Home</Button>
					</Link>
				</div>
			</main>
		);
	}

	const blog = await res.json();

	return (
		<div>
			<main className="min-h-screen bg-background">
				<div className="w-11/12 mx-auto px-4 py-8">
					<Link
						href="/"
						className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
						<ArrowLeft className="w-4 h-4" />
						Back to Home
					</Link>

					<article className="max-w-11/12 mx-auto">
						{/* Cover Image */}
						{blog.coverImage && (
							<img
								src={blog.coverImage}
								alt={blog.title}
								className="w-full h-96 object-cover rounded-lg mb-6"
							/>
						)}

						{/* Title */}
						<h1 className="text-4xl font-bold text-foreground mb-4">
							{blog.title}
						</h1>

						{/* Metadata */}
						<div className="flex flex-wrap gap-4 text-muted-foreground mb-8 border-b border-border pb-6">
							<div className="flex items-center gap-2">
								<User className="w-4 h-4" />
								<span>{blog.author || "Gulfshore Group"}</span>
							</div>
							<div className="flex items-center gap-2">
								<Calendar className="w-4 h-4" />
								<span>
									{blog.publishedAt
										? new Date(blog.publishedAt).toLocaleDateString(
												"en-US",
												{
													month: "short",
													day: "numeric",
													year: "numeric",
												}
										  )
										: "Unpublished"}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="px-2 py-1 bg-muted text-xs rounded">
									{blog.category?.replace("-", " ")}
								</span>
							</div>
						</div>

						{/* Description + Content */}
						<div className="prose prose-invert max-w-none space-y-6">
							<p className="text-lg text-muted-foreground leading-relaxed">
								{blog.description}
							</p>

							<div
								className="space-y-4 text-foreground leading-relaxed"
								dangerouslySetInnerHTML={{ __html: blog.content }}
							/>
						</div>
					</article>
				</div>
			</main>
			<Footer />
		</div>
	);
}
