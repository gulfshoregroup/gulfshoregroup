import { BookOpen, Facebook } from "lucide-react";
import BlogArticleCard from "@/components/blogs/blogCard";
import prisma from "@/lib/prisma";

interface BlogSectionProps {
	category?: string;
	title?: string;
	subtitle?: string;
}

export default async function BlogSection({ 
	category, 
	title = "Real Estate Blogs", 
	subtitle = "Tips, trends, and insights from real estate experts" 
}: BlogSectionProps = {}) {
	const fetchBlogArticles = async () => {
		try {
			const whereClause: any = { published: true };
			if (category === "others") {
				// Show all blogs EXCEPT facebook blogs in the 'others' section
				whereClause.category = { not: "facebook" };
			} else if (category) {
				// Show specific category (like 'facebook')
				whereClause.category = category;
			}
			
			const articles = await prisma.blog.findMany({
				where: whereClause,
				orderBy: { createdAt: "desc" },
				take: 4,
			});
			return articles || [];
		} catch (error) {
			console.error("Error fetching blog articles from DB:", error);
			return [];
		}
	};

	const blogArticles = await fetchBlogArticles();

	if (!blogArticles || blogArticles.length === 0) {
		return null; // or a fallback UI
	}

	return (
		<section className="space-y-6 py-12 container mx-auto px-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
						{category === "facebook" ? <Facebook className="w-6 h-6 text-blue-600" /> : <BookOpen className="w-6 h-6 text-primary" />}
						{title}
					</h3>
					<p className="text-muted-foreground mt-1 text-sm">
						{subtitle}
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 border-t border-border pt-8">
				{blogArticles.map((article: any) => (
					<BlogArticleCard key={article.id || article.slug} article={article} />
				))}
			</div>
		</section>
	);
}
