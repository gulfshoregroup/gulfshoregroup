"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"; // ShadCN Dialog
import { Share } from "lucide-react";

// The dialog body (next-share buttons + share-settings fetch) loads only when
// the dialog is first opened. Previously every listing card fetched
// /api/admin/general-settings on page load (8 requests on the homepage, 36 on
// a search page) and shipped next-share up front.
const ShareDialogBody = dynamic(() => import("./share-dialog-body"), {
	ssr: false,
	loading: () => <div className="h-40" />,
});

export default function SocialShare({ propertyUrl }: { propertyUrl: string }) {
	const [opened, setOpened] = useState(false);

	return (
		<Dialog onOpenChange={(o) => o && setOpened(true)}>
			<DialogTrigger asChild>
				<Share className="w-5 h-5" aria-label="Share this property" />
			</DialogTrigger>

			<DialogContent className="lg:p-6 lg:max-w-md md:max-w-md max-w-[98vw] px-3 py-5 rounded-lg">
				{opened && <ShareDialogBody propertyUrl={propertyUrl} />}
			</DialogContent>
		</Dialog>
	);
}
