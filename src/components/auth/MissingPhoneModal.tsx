"use client";

import React, { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone } from "lucide-react";
import { usePathname } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MissingPhoneModal() {
	const { user, isLoaded, isSignedIn } = useUser();
	const { getToken } = useAuth();
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);
	const [countryCode, setCountryCode] = useState("+1");
	const [phone, setPhone] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

    const countryCodes = [
		{ code: "+1", country: "US/CA", flag: "🇺🇸" },
		{ code: "+44", country: "UK", flag: "🇬🇧" },
		{ code: "+971", country: "UAE", flag: "🇦🇪" },
		{ code: "+33", country: "France", flag: "🇫🇷" },
		{ code: "+49", country: "Germany", flag: "🇩🇪" },
		{ code: "+34", country: "Spain", flag: "🇪🇸" },
		{ code: "+39", country: "Italy", flag: "🇮🇹" },
		{ code: "+91", country: "India", flag: "🇮🇳" },
		{ code: "+86", country: "China", flag: "🇨🇳" },
		{ code: "+81", country: "Japan", flag: "🇯🇵" },
		{ code: "+61", country: "Australia", flag: "🇦🇺" },
	];

	useEffect(() => {
		if (!isLoaded || !isSignedIn || !user) {
			setIsOpen(false);
			return;
		}

		// Don't show on auth pages or admin pages
		if (
			pathname.includes("/signup") ||
			pathname.includes("/signin") ||
			pathname.startsWith("/admin")
		) {
			setIsOpen(false);
			return;
		}

		// Check if user has a phone number in Clerk
		const hasPhone = user.phoneNumbers && user.phoneNumbers.length > 0;
        
        // Check if user signed up with Google
        const isGoogleAuth = user.externalAccounts && user.externalAccounts.some((acc: any) => acc.provider === "oauth_google");
        
        // Also check localStorage in case they just added it during this session
        const phoneStored = localStorage.getItem(`phone_collected_${user.id}`);

        // Debugging logs for you (Check Browser Console)
        console.log("MissingPhoneModal Debug: ", {
            hasPhone,
            phoneLength: user.phoneNumbers?.length,
            isGoogleAuth,
            externalAccounts: user.externalAccounts,
            phoneStored,
            pathname
        });

		// Client requested: "Pop up for phone number only needed when signing up with google."
		if (!hasPhone && !phoneStored && isGoogleAuth) {
            console.log("MissingPhoneModal: Opening modal");
			setIsOpen(true);
		} else {
            console.log("MissingPhoneModal: Not opening modal due to conditions.");
            setIsOpen(false);
        }
	}, [isLoaded, isSignedIn, user, pathname]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
        
        // Clean phone number (remove any non-digits)
        const cleanPhone = phone.replace(/\D/g, "");
        
		if (cleanPhone.length < 10) {
			setError("Please enter a valid phone number (at least 10 digits).");
			return;
		}

        const fullPhoneNumber = `${countryCode}${cleanPhone}`;

		setIsSubmitting(true);
		setError("");

		try {
			const token = await getToken();
			const res = await fetch("/api/v2/user/update-phone", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${token}`
				},
				body: JSON.stringify({ phone: fullPhoneNumber, email: user?.primaryEmailAddress?.emailAddress }),
			});

			if (res.ok) {
                if (user) {
                    localStorage.setItem(`phone_collected_${user.id}`, "true");
                }
				setIsOpen(false);
			} else {
				const data = await res.json();
				setError(data.error || "Failed to update phone number");
			}
		} catch (err) {
			setError("An error occurred. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<Dialog open={isOpen}>
			<DialogContent 
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
				className="sm:max-w-[425px] bg-white rounded-3xl border-0 shadow-2xl [&>button]:hidden"
			>
				<div className="flex flex-col items-center text-center p-6 space-y-4">
					<div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-2">
						<Phone className="w-8 h-8" />
					</div>
					<DialogTitle className="text-2xl font-bold text-gray-900">
						Complete Your Profile
					</DialogTitle>
					<DialogDescription className="text-gray-600">
						To provide you with the best VIP real estate experience and send you instant property alerts, we need a valid phone number.
					</DialogDescription>

					<form onSubmit={handleSubmit} className="w-full space-y-4 mt-4 text-left">
						<div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Mobile Number</label>
                            <div className="flex gap-2">
                                <Select 
                                    value={countryCode} 
                                    onValueChange={(e) => setCountryCode(e)}
                                >
                                    <SelectTrigger className="w-28 h-12 rounded-xl border border-input bg-white text-base text-gray-700">
                                        <SelectValue placeholder="Code" />
                                    </SelectTrigger>
                                    <SelectContent className="border max-h-50 rounded px-2 bg-white">
                                        {countryCodes.map((c) => (
                                            <SelectItem key={c.code} value={c.code}>
                                                {c.flag} {c.code}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="tel"
                                    placeholder="Enter your phone number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    className="h-12 text-lg flex-1 rounded-xl"
                                    required
                                />
                            </div>
							{error && <p className="text-red-500 text-sm mt-1">{error}</p>}
						</div>
						
						<Button 
							type="submit" 
							disabled={isSubmitting}
							className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 rounded-xl mt-2"
						>
							{isSubmitting ? "Updating..." : "Save & Continue"}
						</Button>
					</form>
				</div>
			</DialogContent>
		</Dialog>
	);
}
