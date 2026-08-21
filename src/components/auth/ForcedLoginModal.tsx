"use client";

import React, { useState, useEffect } from "react";
import { useUser, useSignIn } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Bell, ShieldCheck, Home, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ForcedLoginModal() {
	const { isSignedIn, isLoaded } = useUser();
	const { signIn } = useSignIn();
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);

	const handleGoogleLogin = () => {
		if (!signIn) return;
		signIn.authenticateWithRedirect({
			strategy: "oauth_google",
			redirectUrl: "/sso-callback",
			redirectUrlComplete: pathname,
		});
	};

	useEffect(() => {
		if (!isLoaded || isSignedIn) {
			setIsOpen(false);
			return;
		}

		// Don't show on auth pages, admin pages, blogs, or city/search pages (per client request)
		if (
			pathname.includes("/signup") ||
			pathname.includes("/signin") ||
			pathname.includes("/sign-up") ||
			pathname.includes("/sign-in") ||
			pathname.startsWith("/admin") ||
			pathname.startsWith("/blogs") ||
			// To ensure city pages aren't blocked:
			(pathname.startsWith("/Florida-Real-Estate-Search") && !pathname.includes("/Florida-Real-Estate-Listings/")) ||
			pathname.startsWith("/explore")
		) {
			setIsOpen(false);
			return;
		}

		// Track property views in localStorage
		const viewsKey = "gulfshore_property_views";
		const currentViews = Number(localStorage.getItem(viewsKey) || "0");
		const newViews = currentViews + 1;
		localStorage.setItem(viewsKey, newViews.toString());

		// Check if user is signed in via the custom mock auth
		const isMockSignedIn = document.cookie.includes("mock_signed_in=true");
		if (isMockSignedIn) {
			setIsOpen(false);
			return;
		}

		// If user has viewed 2 or more properties, or is on a detail page, trigger modal after brief delay
		const isDetailPage = pathname.includes("/Florida-Real-Estate-Listings/");
		if (newViews >= 3 || isDetailPage) {
			const timer = setTimeout(() => {
				setIsOpen(true);
			}, 4000);
			return () => clearTimeout(timer);
		}
	}, [isLoaded, isSignedIn, pathname]);

	if (!isOpen || isSignedIn) return null;

	return (
		<Dialog open={isOpen}>
			<DialogContent 
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
				className="sm:max-w-[480px] w-[95vw] p-0 overflow-hidden bg-white rounded-3xl border-0 shadow-2xl [&>button]:hidden max-h-[85vh] sm:max-h-[90vh] flex flex-col"
			>
				<div className="flex-1 overflow-y-auto flex flex-col gap-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
					{/* Top Header Banner */}
					<div className="relative bg-gradient-to-br from-red-600 via-red-700 to-rose-900 p-8 text-white text-center">
						<div className="mx-auto w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/20 shadow-inner">
							<Home className="w-8 h-8 text-white" />
						</div>
						<DialogTitle className="text-2xl font-extrabold tracking-tight mb-2">
							Unlock Full MLS VIP Access
						</DialogTitle>
						<DialogDescription className="text-red-100 text-sm max-w-xs mx-auto leading-relaxed">
							Join Gulfshore Group to unlock high-resolution photos, price history, and instant property alerts.
						</DialogDescription>
					</div>

					{/* Benefits Section */}
					<div className="p-6 space-y-4">
						<div className="space-y-3">
							<div className="flex items-start gap-3 p-3 bg-red-50/60 rounded-xl border border-red-100">
								<Bell className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
								<div>
									<h4 className="text-sm font-semibold text-gray-900">
										Instant Email &amp; SMS Alerts
									</h4>
									<p className="text-xs text-gray-600">
										Be the first to know when new luxury listings matching your criteria hit the market.
									</p>
								</div>
							</div>

							<div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
								<Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
								<div>
									<h4 className="text-sm font-semibold text-gray-900">
										Exclusive NABOR MLS Data
									</h4>
									<p className="text-xs text-gray-600">
										View unredacted property prices, HOA fees, and neighborhood WalkScores.
									</p>
								</div>
							</div>

							<div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
								<ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
								<div>
									<h4 className="text-sm font-semibold text-gray-900">
										Save Searches &amp; Favorites
									</h4>
									<p className="text-xs text-gray-600">
										Bookmark dream homes and receive automated price drop notifications.
									</p>
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="pt-2 space-y-3">
							<Button 
								onClick={handleGoogleLogin} 
								className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 text-base cursor-pointer">
								<svg className="w-5 h-5" viewBox="0 0 24 24">
									<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
									<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
									<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
									<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
								</svg>
								Continue with Google
							</Button>

							<div className="relative flex items-center py-2">
								<div className="flex-grow border-t border-gray-200"></div>
								<span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Or email</span>
								<div className="flex-grow border-t border-gray-200"></div>
							</div>

							<Link href={`/signup${pathname !== "/" ? `?redirect_url=${encodeURIComponent(pathname)}` : ""}`} onClick={() => setIsOpen(false)} className="w-full block">
								<Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-base cursor-pointer">
									Create Free Account
									<ArrowRight className="w-5 h-5" />
								</Button>
							</Link>

							<Link href={`/signin${pathname !== "/" ? `?redirect_url=${encodeURIComponent(pathname)}` : ""}`} onClick={() => setIsOpen(false)} className="w-full block">
								<button
									className="w-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-300 font-semibold py-3.5 rounded-xl text-sm cursor-pointer flex items-center justify-center">
									Already have an account? Sign In
								</button>
							</Link>
						</div>

						<p className="text-[11px] text-center text-gray-400 pt-2">
							Free &amp; secure registration. No spam guarantee.
						</p>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
