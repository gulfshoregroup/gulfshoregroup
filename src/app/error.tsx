"use client";
import React from "react";
import {
	Home,
	ArrowLeft,
	RefreshCw,
	Search,
	MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ErrorPage() {
	const router = useRouter();

	const handleGoHome = () => {
		router.replace("/");
	};

	const handleRefresh = () => {
		router.refresh();
	};

	const handleGoBack = () => {
		router.back();
	};

	return (
		<div className="min-h-screen pt-20 bg-linear-to-br from-rose-50 via-red-50 to-pink-100 flex items-center justify-center p-4">
			{/* Animated background elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-20 left-10 w-32 h-32 bg-red-200/30 rounded-full blur-xl animate-pulse"></div>
				<div className="absolute bottom-20 right-10 w-48 h-48 bg-rose-200/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
				<div className="absolute top-1/2 left-1/3 w-24 h-24 bg-pink-200/40 rounded-full blur-lg animate-pulse delay-500"></div>
			</div>

			<div className="relative z-10 max-w-4xl w-full">
				{/* Main error card */}
				<div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 p-8 md:p-12 text-center">
					{/* Error icon with animation */}
					<div className="relative mb-8">
						<div
							className="mx-auto w-32 h-32 bg-linear-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300"
							style={{
								background:
									"linear-gradient(135deg, #d10032, #b8002a)",
							}}>
							<Home className="w-16 h-16 text-white animate-bounce" />
						</div>
						{/* Floating elements around the icon */}
						<div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
						<div className="absolute -bottom-2 -left-2 w-4 h-4 bg-red-400 rounded-full animate-pulse"></div>
					</div>

					{/* Error text */}
					<div className="mb-8">
						<h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
							Oops! Something went wrong
						</h1>
						<p className="text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
							We&apos;re experiencing some technical difficulties.
							Let&apos;s get you back to finding your dream home!
						</p>
					</div>

					{/* Action buttons */}
					<div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
						<button
							onClick={handleGoHome}
							className="group text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3"
							style={{
								background:
									"linear-gradient(135deg, #d10032, #b8002a)",
							}}>
							<Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
							Browse Properties
						</button>

						<button
							onClick={handleRefresh}
							className="group bg-white text-slate-700 px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl border-2 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 hover:bg-red-50"
							style={{ borderColor: "#d10032" }}>
							<RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
							Try Again
						</button>

						<button
							onClick={handleGoBack}
							className="group bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-slate-200 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3">
							<ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
							Go Back
						</button>
					</div>

					{/* Quick links */}
					<div className="border-t border-slate-200 pt-8">
						<p className="text-sm text-slate-500 mb-6">
							Popular searches
						</p>
						<div className="flex flex-wrap justify-center gap-3">
							{[
								{
									icon: Search,
									text: "Naples Homes",
									link: "/Florida-Real-Estate-Search/Homes/Naples",
								},
								{
									icon: MapPin,
									text: "Listings In Florida",
									link: "/Florida-Real-Estate-Search",
								},
								{
									icon: Home,
									text: "Latest Listings",
									link: "/Florida-Real-Estate-Search/sort=Newest-First",
								},
							].map((item, index) => (
								<button
									onClick={() => {
										router.push(item.link);
									}}
									key={index}
									className="group flex items-center gap-2 bg-slate-50 hover:bg-red-50 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border border-transparent hover:border-red-200">
									<item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
									{item.text}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Footer text */}
				<p className="text-center text-slate-500 mt-8 text-sm">
					Need help? Contact our support team at{" "}
					<a
						href="mailto:mailbox@gulfshoregroup.com"
						className="font-medium transition-colors"
						style={{ color: "#d10032" }}>
						mailbox@gulfshoregroup.com
					</a>
				</p>
			</div>
		</div>
	);
}
