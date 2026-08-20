"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function SignInPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const res = await fetch("/api/admin/auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "login",
					email,
					password
				})
			});
			const data = await res.json();
			if (data.success) {
				const setCookie = (name: string, val: string) => {
					document.cookie = `${name}=${val}; path=/; max-age=31536000`;
				};
				setCookie("mock_signed_in", "true");
				setCookie("mock_user_email", data.email);
				if (typeof sessionStorage !== "undefined") {
					sessionStorage.setItem("just_signed_in", "true");
				}
				window.location.href = "/admin/dashboard";
			} else {
				setError(data.error || "Invalid email or password.");
				setLoading(false);
			}
		} catch (err) {
			setError("Failed to connect to authentication service.");
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen bg-white">
			{/* Left Side - Project Hero Image (Visible on MD and up) */}
			<div className="relative hidden w-1/2 md:block">
				<Image
					src="/hero.png"
					alt="Gulfshore Group Real Estate"
					fill
					priority
					className="object-cover"
				/>
				{/* Dark subtle overlay gradient */}
				<div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-black/20" />
				
				{/* Elegant brand overlay content */}
				<div className="absolute inset-0 flex flex-col justify-between p-12 text-white z-10">
					<Link href="/" className="inline-flex items-center gap-3 group text-white/90 hover:text-white transition-colors">
						<ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
						<span className="text-sm font-medium">Back to website</span>
					</Link>

					<div className="space-y-6 max-w-lg">
						<div className="flex items-center gap-3">
							<Image
								src="/logored.svg"
								alt="Gulfshore Group Logo"
								width={45}
								height={12}
								className="brightness-0 invert"
							/>
							<div className="flex flex-col">
								<span className="text-xl font-bold tracking-wider">GULFSHORE GROUP</span>
								<span className="text-xs text-white/60 tracking-wider">London Forster Realty</span>
							</div>
						</div>
						
						<div className="space-y-2">
							<h1 className="text-4xl font-extrabold tracking-tight leading-tight">
								Exclusive Portal for Platform Management
							</h1>
							<p className="text-white/80 text-base font-light">
								Access the administration dashboard to manage properties, monitor search activity, analyze trends, and communicate with leads.
							</p>
						</div>
					</div>

					<p className="text-xs text-white/40">
						© {new Date().getFullYear()} Gulfshore Group. All rights reserved.
					</p>
				</div>
			</div>

			{/* Right Side - Premium Login Form */}
			<div className="flex w-full flex-col justify-center px-6 py-12 md:w-1/2 lg:px-16 xl:px-24 bg-gray-50/50">
				<div className="mx-auto w-full max-w-md space-y-8">
					
					{/* Logo & Header for mobile layout (hidden on Desktop) */}
					<div className="md:hidden flex flex-col items-center text-center space-y-4">
						<div className="flex items-center gap-2">
							<Image
								src="/logored.svg"
								alt="Gulfshore Group Logo"
								width={35}
								height={10}
							/>
							<span className="text-lg font-bold text-gray-900 tracking-wider">GULFSHORE GROUP</span>
						</div>
						<h2 className="text-2xl font-bold text-gray-900">Admin Sign In</h2>
						<p className="text-sm text-gray-500">Sign in to manage your platform</p>
					</div>

					{/* Desktop Header */}
					<div className="hidden md:block space-y-2">
						<div className="inline-flex p-3 rounded-2xl bg-[#B89A6A]/10 text-[#B89A6A] mb-2">
							<ShieldCheck className="w-8 h-8" />
						</div>
						<h2 className="text-3xl font-bold tracking-tight text-gray-900">
							Administrator Sign In
						</h2>
						<p className="text-sm text-gray-500">
							Please enter your administrative credentials below.
						</p>
					</div>

					{/* Form */}
					<form className="mt-8 space-y-6" onSubmit={handleLogin}>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-1.5">
									Email Address
								</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
										<Mail className="w-5 h-5" />
									</div>
									<input
										type="email"
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className="block w-full rounded-xl border border-gray-300 pl-10 pr-3 py-2.5 text-gray-900 bg-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#B89A6A]/20 focus:border-[#B89A6A] sm:text-sm transition-all duration-200"
										placeholder="admin@gulfshore.com"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-1.5">
									Password
								</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
										<Lock className="w-5 h-5" />
									</div>
									<input
										type={showPassword ? "text" : "password"}
										required
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className="block w-full rounded-xl border border-gray-300 pl-10 pr-10 py-2.5 text-gray-900 bg-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#B89A6A]/20 focus:border-[#B89A6A] sm:text-sm transition-all duration-200"
										placeholder="••••••••"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
									>
										{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
									</button>
								</div>
							</div>
						</div>

						{error && (
							<div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-sm font-medium text-red-600">
								{error}
							</div>
						)}

						<div>
							<button
								type="submit"
								disabled={loading}
								className="group relative flex w-full justify-center rounded-xl bg-[#B89A6A] px-4 py-3 text-sm font-bold text-white hover:bg-[#a6895b] focus:outline-hidden focus:ring-2 focus:ring-[#B89A6A]/50 disabled:opacity-50 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
							>
								{loading ? "Verifying Credentials..." : "Sign In to Dashboard"}
							</button>
						</div>
					</form>

					{/* Return to home link for mobile layout */}
					<div className="md:hidden text-center mt-4">
						<Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#B89A6A] hover:underline">
							<ArrowLeft className="w-4 h-4" />
							Back to website
						</Link>
					</div>

					{/* Note card displaying current local admin credentials */}
					<div className="mt-6 p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-xs text-amber-800 space-y-1">
						<p className="font-bold flex items-center gap-1">
							⚠️ Demo Administrator Account
						</p>
						<p>Use the default credentials or configure them from Settings inside the dashboard:</p>
						<div className="mt-2 space-y-1 font-mono text-[11px] bg-white p-2 rounded-lg border border-amber-100/50">
							<div>Email: admin@gulfshore.com</div>
							<div>Pass: admin</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
