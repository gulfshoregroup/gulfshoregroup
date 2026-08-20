"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ReadMoreProps {
	children: any;
	maxLength?: number;
	readMoreText?: string;
	readLessText?: string;
	className?: string;
	link?: string;
}

const ReadMore: React.FC<ReadMoreProps> = ({
	children,
	maxLength = 280,
	readMoreText = "Read More",
	readLessText = "Read Less",
	className = "",
	link = "",
}) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const router = useRouter();

	const textContent = Array.isArray(children)
		? children.join("")
		: typeof children === "string"
		? children
		: typeof children === "number"
		? String(children)
		: children
		? String(children)
		: "";

	const shouldTruncate = textContent.length > maxLength;

	const toggleExpanded = (e?: React.MouseEvent) => {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		if (link && typeof link === "string" && link.trim()) {
			router.push(link, {
				scroll: true,
			});
			return;
		}
		setIsExpanded((prev) => !prev);
	};

	const getTruncatedText = (text: string, max: number) => {
		if (text.length <= max) return text;
		const sliced = text.slice(0, max);
		const lastSpace = sliced.lastIndexOf(" ");
		return lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced;
	};

	return (
		<div className={className}>
			<div
				className="whitespace-pre-wrap break-words text-gray-700 leading-relaxed font-normal"
				aria-expanded={isExpanded}>
				{isExpanded ? (
					<span>{textContent}</span>
				) : (
					<span>
						{getTruncatedText(textContent, maxLength)}
						{shouldTruncate && "..."}
					</span>
				)}
			</div>

			{shouldTruncate &&
				(link ? (
					<Link
						href={link}
						aria-label="read-more"
						className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm rounded-lg transition-colors cursor-pointer"
						target="_blank">
						<span>Read More</span>
						<ChevronDown size={15} />
					</Link>
				) : (
					<button
						type="button"
						onClick={toggleExpanded}
						className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm rounded-lg transition-all duration-200 cursor-pointer select-none"
						aria-label={
							isExpanded ? "Collapse content" : "Expand content"
						}>
						<span>{isExpanded ? readLessText : readMoreText}</span>
						{isExpanded ? (
							<ChevronUp size={16} />
						) : (
							<ChevronDown size={16} />
						)}
					</button>
				))}
		</div>
	);
};

export default ReadMore;
