import { BookOpen, Facebook } from "lucide-react";
import BlogArticleCard from "@/components/blogs/blogCard";
import prisma from "@/lib/prisma";

interface BlogSectionProps {
	category?: string;
	title?: string;
	subtitle?: string;
	limit?: number;
	isCompact?: boolean;
}

export default async function BlogSection({ 
	category, 
	title = "Real Estate Blogs", 
	subtitle = "Tips, trends, and insights from real estate experts",
	limit = 4,
	isCompact = false
}: BlogSectionProps = {}) {
	const fetchBlogArticles = async () => {
		try {
			if (category === "facebook") {
				const pageId = process.env.FACEBOOK_PAGE_ID;
				const token = process.env.FACEBOOK_ACCESS_TOKEN;
				if (pageId && token) {
					const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/posts?fields=id,message,created_time,full_picture,permalink_url&access_token=${token}`, { next: { revalidate: 3600 } });
					if (fbRes.ok) {
						const fbData = await fbRes.json();
						if (fbData && fbData.data) {
							return fbData.data.slice(0, limit).map((post: any) => ({
								id: post.id,
								slug: post.id,
								title: post.message ? post.message.split('\n')[0].substring(0, 60) + (post.message.length > 60 ? '...' : '') : 'Social Update',
								description: post.message || 'Check out our latest update on Facebook.',
								author: 'Facebook Page',
								publishedAt: post.created_time,
								category: 'facebook',
								coverImage: post.full_picture || '',
								externalUrl: post.permalink_url,
							}));
						}
					} else {
						console.error("FB API Error:", await fbRes.text());
					}
				}
				// If FB fetch fails or credentials missing, return empty or fallback
				return [];
			}

			const whereClause: any = { published: true };
			if (category === "others") {
				// Show all blogs EXCEPT facebook blogs in the 'others' section
				whereClause.category = { not: "facebook" };
			} else if (category && category !== "facebook") {
				// Show specific category
				whereClause.category = category;
			}
			
			const articles = await prisma.blog.findMany({
				where: whereClause,
				orderBy: { createdAt: "desc" },
				take: limit,
			});
			return articles || [];
		} catch (error) {
			console.error("Error fetching blog articles:", error);
			return [];
		}
	};

	const blogArticles = await fetchBlogArticles();

	if (!blogArticles || blogArticles.length === 0) {
		return null; // or a fallback UI
	}

	return (
		<section className={`space-y-6 py-12 ${isCompact ? '' : 'container mx-auto px-4'}`}>
			<div className="flex items-center justify-between">
				<div>
					<h3 className={`${isCompact ? 'text-xl' : 'text-2xl'} font-bold text-foreground flex items-center gap-2`}>
						{category === "facebook" ? <Facebook className="w-6 h-6 text-blue-600" /> : <BookOpen className="w-6 h-6 text-primary" />}
						{title}
					</h3>
					<p className="text-muted-foreground mt-1 text-sm">
						{subtitle}
					</p>
				</div>
			</div>

			<div className={`grid grid-cols-1 sm:grid-cols-2 ${!isCompact ? 'lg:grid-cols-3 xl:grid-cols-4' : ''} gap-6 border-t border-border pt-8`}>
				{blogArticles.map((article: any) => (
					<BlogArticleCard key={article.id || article.slug} article={article} />
				))}
			</div>
		</section>
	);
}
