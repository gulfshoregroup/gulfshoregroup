"use client";

import { useRouter } from "next/navigation";
import { Calendar, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BlogArticleCardProps {
	article: {
		slug: string | number;
		title: string;
		description: string;
		author: string;
		publishedAt: string;
		category?: string;
		coverImage: string;
		externalUrl?: string;
	};
}

export default function BlogArticleCard({
	article,
}: BlogArticleCardProps) {
	const router = useRouter();

	const handleClick = () => {
		if (article.externalUrl) {
			window.open(article.externalUrl, "_blank");
		} else {
			router.push(`/blogs/${article.slug}`);
		}
	};

	return (
		<Card
			onClick={handleClick}
			className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col w-full h-full border border-border/60 rounded-xl bg-card">
			<div className="relative h-48 w-full overflow-hidden bg-muted">
				<img
					src={
						article.coverImage ||
						"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80"
					}
					alt={article.title}
					className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
					onError={(e: any) => {
						e.target.src =
							"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80";
					}}
				/>
			</div>

			<div className="p-5 flex-1 flex flex-col justify-between">
				<div>
					<div className="mb-3">
						<Badge
							variant="secondary"
							className="bg-primary/10 text-primary capitalize font-medium px-2.5 py-0.5 text-xs">
							{article.category?.replace("-", " ") || "Real Estate"}
						</Badge>
					</div>

					<h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
						{article.title}
					</h3>

					<p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
						{article.description}
					</p>
				</div>

				<div className="border-t border-border pt-3 space-y-2">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<User className="w-3.5 h-3.5" />
						<span>{article.author}</span>
					</div>
					<div className="flex gap-4 text-xs text-muted-foreground">
						<div className="flex items-center gap-1">
							<Calendar className="w-3.5 h-3.5" />
							<span>
								{article.publishedAt
									? new Date(article.publishedAt).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
									  })
									: ""}
							</span>
						</div>
					</div>
				</div>
			</div>
		</Card>
	);
}
