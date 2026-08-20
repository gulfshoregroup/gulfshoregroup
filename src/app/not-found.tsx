"use client";
import { useState, useEffect } from "react";
import {
	Home,
	Search,
	Phone,
	ArrowLeft,
	MapPin,
	Building2,
	Key,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
	const router = useRouter();

	const handleGoHome = () => {
		// In a real Next.js app, you'd use: router.push('/')
		router.push("/");
	};

	const handleSearchProperties = () => {
		// In a real Next.js app, you'd use: router.push('/properties')
		router.push("/Florida-Real-Estate-Search");
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-red-50 relative overflow-hidden">
			{/* Floating Real Estate Icons */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				{[...Array(6)].map((_, i) => (
					<div
						key={i}
						className={`absolute text-red-100 opacity-20 animate-bounce`}
						style={{
							left: `${15 + i * 15}%`,
							top: `${20 + (i % 2) * 40}%`,
							animationDelay: `${i * 0.5}s`,
							animationDuration: `${3 + i * 0.5}s`,
						}}>
						{i % 3 === 0 && <Home className="w-8 h-8" />}
						{i % 3 === 1 && <Building2 className="w-6 h-6" />}
						{i % 3 === 2 && <Key className="w-7 h-7" />}
					</div>
				))}
			</div>

			<div className="relative z-10 flex items-center justify-center min-h-screen p-4">
				<div
					className={`max-w-4xl mx-auto text-center transition-all duration-1000 `}>
					{/* Main 404 Display */}
					<div className="relative mb-8">
						<h1 className="text-9xl md:text-[12rem] font-black text-transparent bg-clip-text bg-linear-to-r from-red-400 via-red-600 to-red-800 leading-none select-none">
							404
						</h1>
						<div className="absolute inset-0 text-9xl md:text-[12rem] font-black text-red-100 opacity-20 blur-sm leading-none select-none">
							404
						</div>
					</div>

					{/* Property Not Found Message */}
					<div className="mb-8 space-y-4">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
							Page Not Found
						</h2>
						<p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
							Looks like this property or page has been has moved to a
							new address. Don&apos;t worry, we have plenty of other
							amazing properties waiting for you!
						</p>
					</div>

					{/* Search Suggestions */}
					<div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 mb-8 shadow-lg">
						<h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
							<MapPin className="w-5 h-5 text-red-600" />
							What would you like to do instead?
						</h3>
						<div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
							<div className="flex items-center gap-2">
								<Search className="w-4 h-4 text-red-600" />
								<span>Browse available properties</span>
							</div>
							<div className="flex items-center gap-2">
								<Home className="w-4 h-4 text-red-600" />
								<span>Explore featured listings</span>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
						<button
							onClick={handleGoHome}
							className="group relative overflow-hidden bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center gap-3 min-w-[200px]">
							<ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
							<span>Back to Home</span>
							<div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
						</button>

						<button
							onClick={handleSearchProperties}
							className="group relative overflow-hidden bg-white hover:bg-gray-50 text-red-600 border-2 border-red-600 hover:border-red-700 px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center gap-3 min-w-[200px]">
							<Search className="w-5 h-5 transition-transform group-hover:scale-110" />
							<span>Search Properties</span>
						</button>
					</div>

					{/* Additional Help */}
					<div className="mt-12 text-center">
						<p className="text-gray-500 mb-4">
							Need immediate assistance? Our real estate experts are
							here to help.
						</p>
						<div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-sm">
							<a
								href="tel:+1239992-9119"
								className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors">
								<Phone className="w-4 h-4" />
								Call: +1 (239) 992-9119
							</a>
							<div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full" />
							<a
								href="mailto:mailbox@gulfshoregroup.com"
								className="text-red-600 hover:text-red-700 font-medium transition-colors">
								Email: mailbox@gulfshoregroup.com
							</a>
						</div>
					</div>
				</div>
			</div>

			{/* Decorative Elements */}
			<div className="absolute bottom-0 left-0 w-full h-32 bg-linear-to-t from-red-600/5 to-transparent pointer-events-none" />
			<div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
			<div className="absolute bottom-0 left-0 w-48 h-48 bg-red-600/3 rounded-full blur-2xl pointer-events-none" />
		</div>
	);
}
