"use client";

import SignUpForm from "@/app/(public)/signup/signupComponent";
import { X } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Button } from "../ui/button";

function SignupPopUp() {
	const [isOpen, setIsOpen] = useState(false);

	const handleClose = () => {
		setIsOpen(false);
		localStorage.setItem("popupShowed", "1");
	};

	useEffect(() => {
		if (typeof window !== "undefined") {
			const popupShowed = localStorage.getItem("popupShowed");

			setTimeout(() => {
				if (popupShowed !== "1") {
					if (!isOpen) {
						setIsOpen(true);
					}
				}
			}, 28000);
		}
	}, []);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-1000 overflow-y-auto">
			<div className="absolute z-10000 top-3 right-2">
				<Button
					className="rounded-full cursor-pointer px-3 py-4 bg-gray-100"
					variant={"outline"}
					onClick={() => handleClose()}>
					<X />
				</Button>
			</div>
			<Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
				<SignUpForm />
			</Suspense>
		</div>
	);
}

export default SignupPopUp;
