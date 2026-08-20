"use client";
import { GoogleOneTap } from "@clerk/nextjs";

export default function ShowGoogleSignInPopup() {
	return (
		<GoogleOneTap
			fedCmSupport={true}
			itpSupport={true}
			cancelOnTapOutside={false}
		/>
	);
}
