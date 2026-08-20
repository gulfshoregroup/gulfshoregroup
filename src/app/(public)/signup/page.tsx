"use client";
import React, { Suspense } from "react";
import SignUpForm from "./signupComponent";

export default function SignUpPage() {
	return (
		<div>
			<Suspense>
				<SignUpForm />
			</Suspense>
		</div>
	);
}
