"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"; // ShadCN Dialog
import {
	FacebookShareButton,
	TwitterShareButton,
	LinkedinShareButton,
	WhatsappShareButton,
	TelegramShareButton,
	EmailShareButton,
	WhatsappIcon,
	LinkedinIcon,
	TelegramIcon,
	TwitterIcon,
	FacebookIcon,
	EmailIcon,
} from "next-share";
import { Copy, Share, MessageCircle } from "lucide-react";

export default function SocialShare({
	propertyUrl,
}: {
	propertyUrl: string;
}) {
	const [copied, setCopied] = useState(false);
	const [shareSubject, setShareSubject] = useState("Check out this property!");
	const [shareBody, setShareBody] = useState("Take a look at this property I found: ");

	useEffect(() => {
		fetch("/api/admin/general-settings")
			.then((res) => res.json())
			.then((data) => {
				if (data.shareSubject) setShareSubject(data.shareSubject);
				if (data.shareBody) setShareBody(data.shareBody);
			})
			.catch(() => {});
	}, []);

	const propertyUrlLink =
		typeof window !== "undefined"
			? `${window.location.origin}${propertyUrl}`
			: `https://gulfshoregroup.com${propertyUrl}`;
	// Function to copy URL
	const copyToClipboard = () => {
		navigator.clipboard.writeText(propertyUrlLink);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	// Function to share via SMS
	const shareViaSMS = () => {
		const smsBody = `${shareBody} ${propertyUrlLink}`;
		const isIos = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
		const separator = isIos ? '&' : '?';
		window.open(`sms:${separator}body=${encodeURIComponent(smsBody)}`, "_self");
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Share className="w-5 h-5" />
			</DialogTrigger>

			<DialogContent className="lg:p-6 lg:max-w-md md:max-w-md max-w-[98vw] px-3 py-5 rounded-lg">
				<DialogTitle>Gulfshore Group</DialogTitle>
				<h3 className="py-2 font-medium lg:text-2xl text-lg">
					Share this property on :
				</h3>
				<div className="flex flex-wrap gap-3 sm:gap-4 items-center">
					<FacebookShareButton url={propertyUrlLink}>
						<FacebookIcon className="text-blue-600 w-10 hover:scale-110 transition-transform" />
					</FacebookShareButton>

					<TwitterShareButton
						url={propertyUrlLink}
						title={shareSubject}>
						<TwitterIcon className="text-blue-400 w-10 hover:scale-110 transition-transform" />
					</TwitterShareButton>

					<LinkedinShareButton url={propertyUrlLink}>
						<LinkedinIcon className="text-blue-700 w-10 hover:scale-110 transition-transform" />
					</LinkedinShareButton>

					<WhatsappShareButton
						url={propertyUrlLink}
						title={shareSubject}>
						<WhatsappIcon className=" w-10 hover:scale-110 transition-transform" />
					</WhatsappShareButton>

					<TelegramShareButton
						url={propertyUrlLink}
						title={shareSubject}>
						<TelegramIcon className="text-blue-500 w-10 hover:scale-110 transition-transform" />
					</TelegramShareButton>

					<EmailShareButton
						url={propertyUrlLink}
						subject={shareSubject}
						body={shareBody}>
						<EmailIcon className="w-10 hover:scale-110 transition-transform" />
					</EmailShareButton>

					<button
						onClick={shareViaSMS}
						className="bg-green-500 flex items-center hover:scale-110  transition-transform justify-center text-center text-white rounded-none w-10 h-10">
						<MessageCircle fontSize={40} className="" />
					</button>
				</div>

				{/* Copy Link Button */}
				<div className="mt-4 lg:max-w-96 max-w-80 flex items-center justify-between border p-2 rounded-lg bg-gray-100">
					<span className="text-sm truncate">{propertyUrlLink}</span>
					<button
						onClick={copyToClipboard}
						className="text-gray-600 hover:text-blue-600 transition">
						<Copy className="w-5 h-5" />
					</button>
				</div>

				{copied && (
					<p className="text-green-500 text-sm mt-2">Link copied!</p>
				)}
			</DialogContent>
		</Dialog>
	);
}
