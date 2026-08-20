"use client";

import React, { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Eye, EyeOff, MapPin, Map, Search, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import axios from "axios";

export default function SignUpForm() {
	const query = useSearchParams();
	const redirectUrl = query.get("redirect_url") || "/";
	
	const [isLoginMode, setIsLoginMode] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		password: "",
		agreeToTerms: true,
	});
	const [countryCode, setCountryCode] = useState("+1");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [isPhoneValid, setIsPhoneValid] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const mode = query.get("mode");
		if (mode === "signin") {
			const redir = query.get("redirect_url");
			router.push(`/signin${redir ? `?redirect_url=${encodeURIComponent(redir)}` : ""}`);
		}
	}, [query, router]);

	const handleInputChange = (e: any) => {
		const { name, value, type, checked } = e.target;
		setFormData({
			...formData,
			[name]: type === "checkbox" ? checked : value,
		});
	};

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

	const formatPhoneNumber = (value: any, country: any) => {
		const phoneNumber = value.replace(/[^\d]/g, "");
		if (country === "+1") {
			if (phoneNumber.length < 4) return phoneNumber;
			if (phoneNumber.length < 7)
				return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
			return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
		}
		if (country === "+91") {
			if (phoneNumber.length < 6) return phoneNumber;
			return `${phoneNumber.slice(0, 5)}-${phoneNumber.slice(5, 10)}`;
		}
		return phoneNumber.replace(/(\d{3})(?=\d)/g, "$1 ");
	};

	const validatePhoneNumber = (phone: any, country: any) => {
		const digits = phone.replace(/\D/g, "");
		if (country === "+1") {
			return /^\(\d{3}\) \d{3}-\d{4}$/.test(phone) && digits.length === 10;
		}
		if (country === "+91") {
			return /^[6-9]\d{9}$/.test(digits);
		}
		if (country === "+44") {
			return digits.length >= 10 && digits.length <= 11;
		}
		if (country === "+971") {
			return digits.length >= 9 && digits.length <= 10;
		}
		return digits.length >= 7 && digits.length <= 15;
	};

	const handlePhoneChange = (e: any) => {
		const formatted = formatPhoneNumber(e.target.value, countryCode);
		setPhoneNumber(formatted);
		setIsPhoneValid(validatePhoneNumber(formatted, countryCode));
	};

	const handleCountryChange = (e: any) => {
		const newCountry = e;
		setCountryCode(newCountry);
		if (phoneNumber) {
			const formatted = formatPhoneNumber(
				phoneNumber.replace(/\D/g, ""),
				newCountry
			);
			setPhoneNumber(formatted);
			setIsPhoneValid(validatePhoneNumber(formatted, newCountry));
		}
	};

	const handleGoogleLogin = async () => {
		setIsLoading(true);
		setError("");
		if (typeof window === "undefined" || !(window as any).google) {
			setError("Google Auth is not loaded.");
			setIsLoading(false);
			return;
		}
		const client = (window as any).google.accounts.oauth2.initTokenClient({
			client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
			scope: "email profile",
			callback: async (tokenResponse: any) => {
				if (tokenResponse && tokenResponse.access_token) {
					try {
						const res = await fetch("/api/v2/user/google-auth", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ access_token: tokenResponse.access_token })
						});
						const data = await res.json();
						if (data.success) {
							if (typeof sessionStorage !== "undefined") {
								sessionStorage.setItem("just_signed_in", "true");
							}
							window.location.href = redirectUrl;
						} else {
							setError(data.error || "Google authentication failed.");
							setIsLoading(false);
						}
					} catch (err) {
						setError("Error during Google authentication.");
						setIsLoading(false);
					}
				} else {
					setError("Google authentication was cancelled or failed.");
					setIsLoading(false);
				}
			},
			error_callback: (err: any) => {
				setError("Google authentication failed.");
				setIsLoading(false);
			}
		});
		client.requestAccessToken();
	};

	const handleSubmit = async (e: any) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		if (!formData.email) {
			setError("Email is required.");
			setIsLoading(false);
			return;
		}

		if (!formData.password) {
			setError("Password is required.");
			setIsLoading(false);
			return;
		}

		if (isLoginMode) {
			// SIGN IN FLOW
			try {
				const response = await axios.post("/api/v2/user/signin", {
					email: formData.email,
					password: formData.password,
				});

				if (response.data.success) {
					window.location.href = redirectUrl;
				} else {
					setError(response.data.error || "Invalid email or password.");
				}
			} catch (err: any) {
				setError(err.response?.data?.error || "Error signing in. Please try again.");
			} finally {
				setIsLoading(false);
			}
			return;
		}

		// SIGN UP FLOW
		if (formData.password.length < 8) {
			setError("Password must be at least 8 characters long.");
			setIsLoading(false);
			return;
		}

		if (!isPhoneValid) {
			setError("Please enter a valid phone number.");
			setIsLoading(false);
			return;
		}

		if (!formData.agreeToTerms) {
			setError("You must agree to the terms and conditions.");
			setIsLoading(false);
			return;
		}

		try {
			const res = await axios.post("/api/v2/user/signup-lead", {
				firstName: formData.firstName,
				lastName: formData.lastName,
				email: formData.email,
				phone: `${countryCode}${phoneNumber.replace(/\D/g, "")}`,
				password: formData.password,
				agreeToTerms: formData.agreeToTerms
			});

			if (res.data.success) {
				window.location.href = redirectUrl;
			} else {
				setError(res.data.error || "Failed to create account.");
			}
		} catch (err: any) {
			setError(err.response?.data?.error || "Error signing up. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 relative">
			{/* Back Button */}
			<div className="absolute top-6 left-8 z-20">
				<a href="/" className="flex items-center gap-2 text-sm font-semibold text-[#d90429] hover:underline cursor-pointer">
					<ArrowLeft size={16} />
					<span>Back to Home</span>
				</a>
			</div>
			{/* Background Pattern */}
			<div className="absolute inset-0 opacity-5 pointer-events-none">
				<div className="absolute top-20 left-20 w-32 h-32 text-[#d90429]">
					<Home size={128} />
				</div>
				<div className="absolute bottom-20 right-20 w-24 h-24 text-[#d90429]">
					<MapPin size={96} />
				</div>
				<div className="absolute top-1/2 left-10 w-16 h-16 text-[#d90429]">
					<Map size={64} />
				</div>
				<div className="absolute top-40 right-40 w-20 h-20 text-[#d90429] ">
					<Search size={80} />
				</div>
			</div>

			<div className="flex items-center relative justify-center z-10 pt-10 p-4">
				<div className="w-full max-w-md">
					<Card className="shadow-lg py-4 px-3">
						<CardHeader className="pb-4 mt-3">
							<CardTitle>{isLoginMode ? "Sign In" : "Create Account"}</CardTitle>
							<CardDescription>
								{isLoginMode 
									? "Enter your email and password to access your account" 
									: "Join and find your dream Florida home"
								}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="w-full mb-2 mt-2">
								<button 
									type="button"
									onClick={handleGoogleLogin} 
									disabled={isLoading}
									className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 text-sm cursor-pointer">
									<svg className="w-5 h-5" viewBox="0 0 24 24">
										<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
										<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
										<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
										<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
									</svg>
									Continue with Google
								</button>

								<div className="relative flex items-center py-4">
									<div className="flex-grow border-t border-gray-200"></div>
									<span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Or continue with</span>
									<div className="flex-grow border-t border-gray-200"></div>
								</div>
							</div>
							<form onSubmit={handleSubmit} className="space-y-4">
								
								{!isLoginMode && (
									<div className="grid grid-cols-2 gap-4">
										<div>
											<Label htmlFor="firstName">First Name</Label>
											<Input
												name="firstName"
												placeholder="First Name"
												value={formData.firstName}
												onChange={handleInputChange}
												required
											/>
										</div>
										<div>
											<Label htmlFor="lastName">Last Name</Label>
											<Input
												name="lastName"
												placeholder="Last Name"
												value={formData.lastName}
												onChange={handleInputChange}
												required
											/>
										</div>
									</div>
								)}

								<div>
									<Label htmlFor="email">Email</Label>
									<Input
										type="email"
										name="email"
										value={formData.email}
										onChange={handleInputChange}
										placeholder="example@example.com"
										required
									/>
								</div>

								{!isLoginMode && (
									<div>
										<Label htmlFor="phone">Phone</Label>
										<div className="flex gap-2 max-h-10">
											<Select
												value={countryCode}
												onValueChange={(e) => handleCountryChange(e)}>
												<SelectTrigger>
													<SelectValue placeholder="Country Code" />
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
												value={phoneNumber}
												onChange={handlePhoneChange}
												placeholder="Phone number"
												required
											/>
										</div>
										{phoneNumber && !isPhoneValid && (
											<p className="text-red-500 text-sm mt-1">
												Invalid phone number
											</p>
										)}
									</div>
								)}

								<div>
									<Label htmlFor="password">Password</Label>
									<div className="relative">
										<Input
											type={showPassword ? "text" : "password"}
											name="password"
											value={formData.password}
											onChange={handleInputChange}
											placeholder="password"
											required
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-3 text-gray-500 hover:text-gray-700">
											{showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
										</button>
									</div>
								</div>

								{!isLoginMode && (
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											name="agreeToTerms"
											checked={formData.agreeToTerms}
											onChange={handleInputChange}
											required
											className="rounded border-gray-300 text-[#d90429] focus:ring-[#d90429]"
										/>
										<Label
											className="text-gray-500 font-normal leading-normal py-2 text-xs cursor-pointer"
											htmlFor="agreeToTerms">
											I agree to receive notifications about latest
											listings, updates and recommendations via SMS and
											email.
										</Label>
									</div>
								)}

								{error && (
									<div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
										{error}
									</div>
								)}

								<Button
									disabled={isLoading}
									type="submit"
									className="w-full h-11 bg-[#d90429] hover:bg-[#bf0022] text-white font-semibold transition-all">
									{isLoading 
										? (isLoginMode ? "Signing In..." : "Creating Account...") 
										: (isLoginMode ? "Sign In" : "Create Account")
									}
								</Button>
							</form>

							<div className="text-center text-sm text-gray-600 space-y-3 pt-2">
								<span>
									Already have an account?{" "}
									<a
										href={`/signin${redirectUrl !== "/" ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : ""}`}
										className="text-[#d90429] font-semibold underline ml-1 hover:text-[#bf0022]">
										Sign In
									</a>
								</span>
							</div>

							<hr className="border-gray-200" />

							<div className="flex items-center justify-between underline gap-2 text-xs text-gray-500">
								<a href="/terms">Terms</a>
								<a href="/policy">Privacy Policy</a>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
			<div className="text-center mt-8 text-xs text-gray-500 pb-10">
				<p>© GulfshoreGroup.com | All rights reserved.</p>
			</div>
		</div>
	);
}
