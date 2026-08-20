import { Loader2 } from "lucide-react";
import React from "react";

export default function LoaderScreen() {
	return (
		<div className="h-[90svh] w-screen flex justify-center items-center">
			<Loader2
				width={50}
				height={50}
				strokeWidth={2.5}
				className="text-primary animate-spin"
			/>
		</div>
	);
}
