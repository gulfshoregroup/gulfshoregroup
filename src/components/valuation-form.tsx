"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import { Home, ClipboardList, Clock, UserCheck, Upload, Trash2, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";

export default function ValuationForm() {
	const [step, setStep] = useState(1);
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		address: "",
		city: "",
		state: "FL",
		zip: "",
		beds: "3",
		baths: "2",
		sqft: "",
		yearBuilt: "",
		garage: "No",
		pool: "No",
		hoa: "No",
		waterfront: "No",
		lotSize: "Under 0.25 Acres",
		renovations: "No",
		renovationDetails: "",
		timeline: "Just Curious",
		comments: "",
	});

	const [countryCode, setCountryCode] = useState("+1");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [isPhoneValid, setIsPhoneValid] = useState(true);
	const [uploadedImages, setUploadedImages] = useState<string[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
	const [validationError, setValidationError] = useState("");
	
	const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [isSearchingAddress, setIsSearchingAddress] = useState(false);

	// Load form state from localStorage on mount
	useEffect(() => {
		if (typeof window !== "undefined") {
			const savedData = localStorage.getItem("valuation_form_data");
			if (savedData) {
				try {
					setFormData(JSON.parse(savedData));
				} catch (e) {
					console.error("Error loading saved valuation data", e);
				}
			}
			const savedStep = localStorage.getItem("valuation_form_step");
			if (savedStep) {
				const parsed = parseInt(savedStep, 10);
				if (parsed >= 1 && parsed <= 4) setStep(parsed);
			}
			const savedCountry = localStorage.getItem("valuation_country_code");
			if (savedCountry) setCountryCode(savedCountry);

			const savedPhone = localStorage.getItem("valuation_phone_number");
			if (savedPhone) setPhoneNumber(savedPhone);
			
			const savedImages = localStorage.getItem("valuation_uploaded_images");
			if (savedImages) {
				try {
					setUploadedImages(JSON.parse(savedImages));
				} catch (e) {}
			}
		}
	}, []);

	// Save form state to localStorage when changes occur
	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("valuation_form_data", JSON.stringify(formData));
		}
	}, [formData]);

	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("valuation_form_step", String(step));
		}
	}, [step]);

	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("valuation_country_code", countryCode);
		}
	}, [countryCode]);

	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("valuation_phone_number", phoneNumber);
		}
	}, [phoneNumber]);

	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("valuation_uploaded_images", JSON.stringify(uploadedImages));
		}
	}, [uploadedImages]);

	const swFloridaCities = [
		"Naples",
		"Bonita Springs",
		"Estero",
		"Ave Maria",
		"Marco Island",
		"Fort Myers",
		"Babcock Ranch",
		"Lehigh Acres",
		"Immokalee",
		"Sanibel",
		"Cape Coral",
	];

	const countryCodes = [
		{ code: "+1", country: "US/CA", flag: "🇺🇸" },
		{ code: "+91", country: "India", flag: "🇮🇳" },
		{ code: "+44", country: "UK", flag: "🇬🇧" },
		{ code: "+971", country: "UAE", flag: "🇦🇪" },
	];

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		setValidationError("");
	};

	const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setFormData((prev) => ({ ...prev, address: value }));
		setValidationError("");

		if (!value || value.trim().length < 3) {
			setAddressSuggestions([]);
			setShowSuggestions(false);
			return;
		}

		setIsSearchingAddress(true);
		try {
			const res = await fetch(`/api/v2/search/autocomplete?q=${encodeURIComponent(value)}`);
			if (!res.ok) throw new Error();
			const data = await res.json();
			const filtered = (data.suggestions || []).filter((s: any) => s.type === "address");
			setAddressSuggestions(filtered);
			setShowSuggestions(filtered.length > 0);
		} catch (err) {
			console.error("Address autocomplete error:", err);
		} finally {
			setIsSearchingAddress(false);
		}
	};

	const selectAddress = (suggestion: any) => {
		let street = suggestion.text;
		
		// Strip city/state/zip if they are trailing inside the suggestion text
		if (suggestion.city) {
			const cityIdx = street.toLowerCase().indexOf(suggestion.city.toLowerCase());
			if (cityIdx !== -1) {
				street = street.substring(0, cityIdx).replace(/,\s*$/, "").trim();
			}
		}
		street = street.replace(/\bFL\b/gi, "").replace(/\b\d{5}\b/g, "").replace(/,\s*$/, "").trim();

		// Auto-match city list
		let matchedCity = "";
		if (suggestion.city) {
			const found = swFloridaCities.find(
				(c) => c.toLowerCase() === suggestion.city.toLowerCase()
			);
			if (found) matchedCity = found;
		}

		setFormData((prev) => ({
			...prev,
			address: street,
			city: matchedCity || prev.city,
			zip: suggestion.zip || prev.zip,
		}));
		setAddressSuggestions([]);
		setShowSuggestions(false);
	};

	const formatPhoneNumber = (value: string, country: string) => {
		const numbersOnly = value.replace(/[^\d]/g, "");
		if (country === "+1") {
			if (numbersOnly.length < 4) return numbersOnly;
			if (numbersOnly.length < 7)
				return `(${numbersOnly.slice(0, 3)}) ${numbersOnly.slice(3)}`;
			return `(${numbersOnly.slice(0, 3)}) ${numbersOnly.slice(3, 6)}-${numbersOnly.slice(6, 10)}`;
		}
		if (country === "+91") {
			if (numbersOnly.length < 6) return numbersOnly;
			return `${numbersOnly.slice(0, 5)}-${numbersOnly.slice(5, 10)}`;
		}
		return numbersOnly.replace(/(\d{3})(?=\d)/g, "$1 ");
	};

	const validatePhone = (phone: string, country: string) => {
		const digits = phone.replace(/\D/g, "");
		if (country === "+1") {
			return /^\(\d{3}\) \d{3}-\d{4}$/.test(phone) && digits.length === 10;
		}
		if (country === "+91") {
			return /^[6-9]\d{9}$/.test(digits); // Indian numbers start with 6-9 and have exactly 10 digits
		}
		if (country === "+44") {
			return digits.length >= 10 && digits.length <= 11;
		}
		if (country === "+971") {
			return digits.length >= 9 && digits.length <= 10;
		}
		return digits.length >= 7 && digits.length <= 15;
	};

	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const input = e.target.value;
		const digits = input.replace(/[^\d]/g, "");
		const formatted = formatPhoneNumber(digits, countryCode);
		setPhoneNumber(formatted);
		const valid = validatePhone(formatted, countryCode);
		setIsPhoneValid(valid);
		setFormData((prev) => ({ ...prev, phone: `${countryCode}${digits}` }));
	};

	const handleCountryChange = (code: string) => {
		setCountryCode(code);
		if (phoneNumber) {
			const digits = phoneNumber.replace(/[^\d]/g, "");
			const formatted = formatPhoneNumber(digits, code);
			setPhoneNumber(formatted);
			setIsPhoneValid(validatePhone(formatted, code));
			setFormData((prev) => ({ ...prev, phone: `${code}${digits}` }));
		}
	};

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		setIsUploading(true);
		setValidationError("");

		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const fileData = new FormData();
				fileData.append("file", file);

				const res = await fetch("/api/upload", {
					method: "POST",
					body: fileData,
				});

				if (!res.ok) throw new Error("Upload failed");
				const data = await res.json();
				if (data.success && data.url) {
					setUploadedImages((prev) => [...prev, data.url]);
				}
			}
		} catch (err) {
			setValidationError("Failed to upload image. Please try again.");
		} finally {
			setIsUploading(false);
		}
	};

	const removeImage = (indexToRemove: number) => {
		setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
	};

	const validateStep = () => {
		if (step === 1) {
			if (!formData.address.trim()) {
				setValidationError("Property street address is required.");
				return false;
			}
			if (!formData.city) {
				setValidationError("Please select a city in Southwest Florida.");
				return false;
			}
			if (!formData.zip.trim() || !/^\d{5}$/.test(formData.zip.trim())) {
				setValidationError("Please enter a valid 5-digit ZIP code.");
				return false;
			}
		}
		if (step === 4) {
			if (!formData.firstName.trim()) {
				setValidationError("First name is required.");
				return false;
			}
			if (!formData.lastName.trim()) {
				setValidationError("Last name is required.");
				return false;
			}
			if (!formData.email.trim() || !formData.email.includes("@")) {
				setValidationError("Please enter a valid email address.");
				return false;
			}
			if (!formData.phone || !isPhoneValid) {
				setValidationError("Please enter a valid phone number.");
				return false;
			}
		}
		setValidationError("");
		return true;
	};

	const nextStep = () => {
		if (validateStep()) {
			setStep((prev) => prev + 1);
		}
	};

	const prevStep = () => {
		setValidationError("");
		setStep((prev) => prev - 1);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateStep()) return;

		setIsSubmitting(true);
		setSubmitStatus("idle");

		try {
			const finalPayload = {
				...formData,
				renovations: formData.renovations === "Yes" ? formData.renovationDetails : "No",
				images: uploadedImages,
			};

			const res = await fetch("/api/v2/valuation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(finalPayload),
			});

			if (!res.ok) throw new Error("Request failed");
			setSubmitStatus("success");
			if (typeof window !== "undefined") {
				localStorage.removeItem("valuation_form_data");
				localStorage.removeItem("valuation_form_step");
				localStorage.removeItem("valuation_country_code");
				localStorage.removeItem("valuation_phone_number");
				localStorage.removeItem("valuation_uploaded_images");
			}
		} catch (err) {
			setSubmitStatus("error");
		} finally {
			setIsSubmitting(false);
		}
	};

	const stepsConfig = [
		{ id: 1, label: "Property", icon: Home },
		{ id: 2, label: "Details", icon: ClipboardList },
		{ id: 3, label: "Timeline", icon: Clock },
		{ id: 4, label: "Owner", icon: UserCheck },
	];

	if (submitStatus === "success") {
		return (
			<Card className="max-w-2xl mx-auto p-8 border border-emerald-100 bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl text-center space-y-6 animate-fade-in">
				<div className="flex justify-center">
					<div className="p-4 bg-emerald-50 rounded-full text-emerald-500 animate-bounce">
						<CheckCircle2 size={64} />
					</div>
				</div>
				<h2 className="text-3xl font-bold text-gray-900 font-serif">Valuation Request Submitted!</h2>
				<p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
					Thank you! We have received your property details. Our real estate specialist (and AI pricing engine) will evaluate your home's current market value and contact you shortly.
				</p>
				<div className="pt-4">
					<Button onClick={() => window.location.href = "/"} className="px-8 py-3 bg-primary hover:bg-primary/95 text-white font-semibold rounded-full shadow-lg transition-transform hover:scale-105">
						Back to Homepage
					</Button>
				</div>
			</Card>
		);
	}

	return (
		<Card className="max-w-2xl mx-auto border border-gray-100 bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden transition-all duration-300">
			{/* Wizard Progress Header */}
			<div className="bg-gray-50/80 border-b border-gray-100 px-6 py-4">
				<div className="flex items-center justify-between">
					{stepsConfig.map((s, idx) => {
						const Icon = s.icon;
						const isActive = step >= s.id;
						const isCurrent = step === s.id;
						return (
							<React.Fragment key={s.id}>
								<div className="flex flex-col items-center flex-1 relative">
									<div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
										isCurrent
											? "bg-primary text-white ring-4 ring-primary/20 scale-110 font-bold"
											: isActive
											? "bg-primary/90 text-white font-bold"
											: "bg-gray-200 text-gray-400"
									}`}>
										<Icon size={18} />
									</div>
									<span className={`text-xs mt-2 font-medium transition-colors ${isActive ? "text-primary font-semibold" : "text-gray-400"}`}>
										{s.label}
									</span>
								</div>
								{idx < stepsConfig.length - 1 && (
									<div className={`h-1 flex-1 mx-2 -mt-6 rounded transition-colors duration-500 ${step > s.id ? "bg-primary/50" : "bg-gray-200"}`} />
								)}
							</React.Fragment>
						);
					})}
				</div>
			</div>

			<div className="p-8">
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Validation Error Message */}
					{validationError && (
						<div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium animate-shake">
							{validationError}
						</div>
					)}

					{/* STEP 1: Property Location */}
					{step === 1 && (
						<div className="space-y-6 animate-fade-in">
							<div>
								<h3 className="text-2xl font-bold text-gray-900 font-serif mb-2">Tell us about your property</h3>
								<p className="text-sm text-gray-500">We will verify this address against the active MLS records.</p>
							</div>

							<div className="space-y-4">
								<div className="relative">
									<label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
									<Input
										name="address"
										placeholder="e.g. 2367 Vanderbilt Beach Rd"
										value={formData.address}
										onChange={handleAddressChange}
										onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
										onFocus={() => {
											if (addressSuggestions.length > 0) setShowSuggestions(true);
										}}
										required
										className="h-12 border-gray-200 rounded-xl"
										autoComplete="off"
									/>
									{isSearchingAddress && (
										<span className="absolute right-3 top-10 text-xs text-muted-foreground animate-pulse">
											Searching...
										</span>
									)}

									{showSuggestions && addressSuggestions.length > 0 && (
										<div className="absolute z-[9999] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
											{addressSuggestions.map((s, idx) => (
												<button
													key={idx}
													type="button"
													onMouseDown={() => selectAddress(s)}
													className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors text-sm text-gray-900 cursor-pointer"
												>
													<p className="font-semibold">{s.text}</p>
													{s.city && (
														<p className="text-xs text-gray-500 mt-0.5">
															{s.city}, FL {s.zip || ""}
														</p>
													)}
												</button>
											))}
										</div>
									)}
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
										<Select
											value={formData.city}
											onValueChange={(val) => {
												setFormData((prev) => ({ ...prev, city: val }));
												setValidationError("");
											}}
										>
											<SelectTrigger className="h-12 border-gray-200 rounded-xl bg-white text-gray-900">
												<SelectValue placeholder="Select City" />
											</SelectTrigger>
											<SelectContent className="bg-white border text-gray-900 max-h-60">
												{swFloridaCities.map((city) => (
													<SelectItem key={city} value={city}>
														{city}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
										<Input
											name="state"
											value={formData.state}
											readOnly
											disabled
											className="h-12 border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed"
										/>
									</div>

									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code</label>
										<Input
											name="zip"
											placeholder="34109"
											maxLength={5}
											value={formData.zip}
											onChange={(e) => {
												const val = e.target.value.replace(/\D/g, "");
												setFormData((prev) => ({ ...prev, zip: val }));
											}}
											required
											className="h-12 border-gray-200 rounded-xl"
										/>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* STEP 2: Property Structural Details */}
					{step === 2 && (
						<div className="space-y-6 animate-fade-in">
							<div>
								<h3 className="text-2xl font-bold text-gray-900 font-serif mb-2">Property Details</h3>
								<p className="text-sm text-gray-500">Provide key structural features of your home to calculate a precise value.</p>
							</div>

							{/* Key Features (Beds, Baths, SqFt, Year) */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
								<div>
									<label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Bedrooms</label>
									<Select
										value={formData.beds}
										onValueChange={(val) => setFormData((prev) => ({ ...prev, beds: val }))}
									>
										<SelectTrigger className="h-11 border-gray-200 bg-white text-gray-900 rounded-xl">
											<SelectValue placeholder="Beds" />
										</SelectTrigger>
										<SelectContent className="bg-white border text-gray-900">
											<SelectItem value="1">1 Bed</SelectItem>
											<SelectItem value="2">2 Beds</SelectItem>
											<SelectItem value="3">3 Beds</SelectItem>
											<SelectItem value="4">4 Beds</SelectItem>
											<SelectItem value="5">5 Beds</SelectItem>
											<SelectItem value="6+">6+ Beds</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div>
									<label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Bathrooms</label>
									<Select
										value={formData.baths}
										onValueChange={(val) => setFormData((prev) => ({ ...prev, baths: val }))}
									>
										<SelectTrigger className="h-11 border-gray-200 bg-white text-gray-900 rounded-xl">
											<SelectValue placeholder="Baths" />
										</SelectTrigger>
										<SelectContent className="bg-white border text-gray-900">
											<SelectItem value="1">1 Bath</SelectItem>
											<SelectItem value="1.5">1.5 Baths</SelectItem>
											<SelectItem value="2">2 Baths</SelectItem>
											<SelectItem value="2.5">2.5 Baths</SelectItem>
											<SelectItem value="3">3 Baths</SelectItem>
											<SelectItem value="3.5">3.5 Baths</SelectItem>
											<SelectItem value="4">4 Baths</SelectItem>
											<SelectItem value="4.5">4.5 Baths</SelectItem>
											<SelectItem value="5+">5+ Baths</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div>
									<label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Area (SqFt)</label>
									<Input
										name="sqft"
										placeholder="e.g. 2000"
										value={formData.sqft}
										onChange={(e) => {
											const val = e.target.value.replace(/\D/g, "");
											setFormData((prev) => ({ ...prev, sqft: val }));
										}}
										className="h-11 border-gray-200 bg-white rounded-xl font-medium"
									/>
								</div>

								<div>
									<label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Year Built</label>
									<Input
										name="yearBuilt"
										placeholder="e.g. 2015"
										maxLength={4}
										value={formData.yearBuilt}
										onChange={(e) => {
											const val = e.target.value.replace(/\D/g, "");
											setFormData((prev) => ({ ...prev, yearBuilt: val }));
										}}
										className="h-11 border-gray-200 bg-white rounded-xl font-medium"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Has Garage?</label>
									<Select
										value={formData.garage}
										onValueChange={(val) => setFormData((prev) => ({ ...prev, garage: val }))}
									>
										<SelectTrigger className="h-12 border-gray-200 bg-white text-gray-900 rounded-xl">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-white border text-gray-900">
											<SelectItem value="Yes">Yes</SelectItem>
											<SelectItem value="No">No</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Private Pool?</label>
									<Select
										value={formData.pool}
										onValueChange={(val) => setFormData((prev) => ({ ...prev, pool: val }))}
									>
										<SelectTrigger className="h-12 border-gray-200 bg-white text-gray-900 rounded-xl">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-white border text-gray-900">
											<SelectItem value="Yes">Yes</SelectItem>
											<SelectItem value="No">No</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">In an HOA community?</label>
									<Select
										value={formData.hoa}
										onValueChange={(val) => setFormData((prev) => ({ ...prev, hoa: val }))}
									>
										<SelectTrigger className="h-12 border-gray-200 bg-white text-gray-900 rounded-xl">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-white border text-gray-900">
											<SelectItem value="Yes">Yes</SelectItem>
											<SelectItem value="No">No</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Waterfront property?</label>
									<Select
										value={formData.waterfront}
										onValueChange={(val) => setFormData((prev) => ({ ...prev, waterfront: val }))}
									>
										<SelectTrigger className="h-12 border-gray-200 bg-white text-gray-900 rounded-xl">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-white border text-gray-900">
											<SelectItem value="Yes">Yes</SelectItem>
											<SelectItem value="No">No</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Lot Size</label>
									<Select
										value={formData.lotSize}
										onValueChange={(val) => setFormData((prev) => ({ ...prev, lotSize: val }))}
									>
										<SelectTrigger className="h-12 border-gray-200 bg-white text-gray-900 rounded-xl">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-white border text-gray-900">
											<SelectItem value="Under 0.25 Acres">Under 0.25 Acres</SelectItem>
											<SelectItem value="0.25 - 0.5 Acres">0.25 - 0.5 Acres</SelectItem>
											<SelectItem value="0.5 - 1 Acre">0.5 - 1 Acre</SelectItem>
											<SelectItem value="1 - 5 Acres">1 - 5 Acres</SelectItem>
											<SelectItem value="5+ Acres">5+ Acres</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Recent Renovations?</label>
									<Select
										value={formData.renovations}
										onValueChange={(val) => setFormData((prev) => ({ ...prev, renovations: val }))}
									>
										<SelectTrigger className="h-12 border-gray-200 bg-white text-gray-900 rounded-xl">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-white border text-gray-900">
											<SelectItem value="Yes">Yes</SelectItem>
											<SelectItem value="No">No</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{formData.renovations === "Yes" && (
								<div className="animate-fade-in">
									<label className="block text-sm font-semibold text-gray-700 mb-2">Describe Recent Renovations</label>
									<Textarea
										name="renovationDetails"
										placeholder="e.g. Kitchen remodeled in 2025 with new countertops, new roof added in 2024..."
										value={formData.renovationDetails}
										onChange={handleChange}
										rows={3}
										className="border-gray-200 rounded-xl resize-none"
									/>
								</div>
							)}
						</div>
					)}

					{/* STEP 3: Selling Timeline */}
					{step === 3 && (
						<div className="space-y-6 animate-fade-in">
							<div>
								<h3 className="text-2xl font-bold text-gray-900 font-serif mb-2">When do you plan to sell?</h3>
								<p className="text-sm text-gray-500">Timeline helps us customize comparable sales reports for your target window.</p>
							</div>

							<div className="grid grid-cols-1 gap-3">
								{[
									{ value: "Immediately", label: "Immediately", desc: "Ready to list and sell now" },
									{ value: "30 Days", label: "Within 30 Days", desc: "Planning to sell in the coming month" },
									{ value: "3 Months", label: "Within 3 Months", desc: "Getting property prepped for market" },
									{ value: "6 Months", label: "Within 6 Months", desc: "Looking ahead or watching seasonal trends" },
									{ value: "Just Curious", label: "Just Curious", desc: "Only looking to know my home equity value" },
								].map((t) => (
									<button
										key={t.value}
										type="button"
										onClick={() => setFormData((prev) => ({ ...prev, timeline: t.value }))}
										className={`flex items-center justify-between p-4 border rounded-xl text-left transition-all cursor-pointer ${
											formData.timeline === t.value
												? "border-primary bg-primary/5 shadow-md ring-1 ring-primary"
												: "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
										}`}
									>
										<div>
											<p className="font-semibold text-gray-900">{t.label}</p>
											<p className="text-xs text-gray-500 mt-1">{t.desc}</p>
										</div>
										<div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
											formData.timeline === t.value ? "border-primary bg-primary text-white" : "border-gray-300"
										}`}>
											{formData.timeline === t.value && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
										</div>
									</button>
								))}
							</div>
						</div>
					)}

					{/* STEP 4: Owner Info & Images */}
					{step === 4 && (
						<div className="space-y-6 animate-fade-in">
							<div>
								<h3 className="text-2xl font-bold text-gray-900 font-serif mb-2">Contact & Images</h3>
								<p className="text-sm text-gray-500">Provide your contact info and optional photos of the property to complete the request.</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
									<Input
										name="firstName"
										placeholder="First Name"
										value={formData.firstName}
										onChange={handleChange}
										required
										className="h-12 border-gray-200 rounded-xl"
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
									<Input
										name="lastName"
										placeholder="Last Name"
										value={formData.lastName}
										onChange={handleChange}
										required
										className="h-12 border-gray-200 rounded-xl"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
									<Input
										name="email"
										type="email"
										placeholder="example@domain.com"
										value={formData.email}
										onChange={handleChange}
										required
										className="h-12 border-gray-200 rounded-xl"
									/>
								</div>

								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
									<div className="flex gap-2">
										<Select value={countryCode} onValueChange={handleCountryChange}>
											<SelectTrigger className="w-28 h-12 border-gray-200 bg-white text-gray-900 rounded-xl">
												<SelectValue />
											</SelectTrigger>
											<SelectContent className="bg-white border text-gray-900">
												{countryCodes.map((c) => (
													<SelectItem key={c.code} value={c.code}>
														{c.flag} {c.code}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Input
											type="tel"
											placeholder="(239) 000-0000"
											value={phoneNumber}
											onChange={handlePhoneChange}
											required
											className={`h-12 border-gray-200 rounded-xl w-full ${
												isPhoneValid ? "" : "border-red-500 focus:ring-red-500"
											}`}
										/>
									</div>
								</div>
							</div>

							{/* Photo Upload Widget */}
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">Upload Property Photos (Optional)</label>
								<div className="border-2 border-dashed border-gray-200 hover:border-primary/50 rounded-2xl p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
									<input
										type="file"
										multiple
										accept="image/*"
										onChange={handleImageUpload}
										className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
										disabled={isUploading}
									/>
									<div className="flex flex-col items-center justify-center space-y-2 text-gray-500">
										<Upload size={36} className="text-gray-400" />
										<p className="text-sm font-medium">
											{isUploading ? "Uploading photos..." : "Drag & Drop or Click to Upload Photos"}
										</p>
										<p className="text-xs text-gray-400">JPG, PNG, WEBP files supported.</p>
									</div>
								</div>

								{/* Uploaded Photos Grid */}
								{uploadedImages.length > 0 && (
									<div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-4">
										{uploadedImages.map((url, idx) => (
											<div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm">
												<img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
												<button
													type="button"
													onClick={() => removeImage(idx)}
													className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 text-white rounded-full hover:bg-red-700 shadow transition-transform scale-90 sm:scale-100"
												>
													<Trash2 size={14} />
												</button>
											</div>
										))}
									</div>
								)}
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">Additional Comments or Details</label>
								<Textarea
									name="comments"
									placeholder="Tell us about special views, upgrades, or unique features of your home..."
									value={formData.comments}
									onChange={handleChange}
									rows={3}
									className="border-gray-200 rounded-xl resize-none"
								/>
							</div>
						</div>
					)}

					{/* Submit Error Message */}
					{submitStatus === "error" && (
						<div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium">
							Something went wrong while submitting your request. Please try again.
						</div>
					)}

					{/* Navigation Controls */}
					<div className="flex justify-between items-center pt-4 border-t border-gray-100">
						{step > 1 ? (
							<Button
								type="button"
								variant="outline"
								onClick={prevStep}
								disabled={isSubmitting}
								className="h-12 px-6 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full font-medium"
							>
								<ChevronLeft size={18} className="mr-1.5" /> Back
							</Button>
						) : (
							<div />
						)}

						{step < 4 ? (
							<Button
								type="button"
								onClick={nextStep}
								className="h-12 px-6 bg-primary hover:bg-primary/95 text-white rounded-full font-medium shadow-md transition-transform active:scale-95"
							>
								Next Step <ChevronRight size={18} className="ml-1.5" />
							</Button>
						) : (
							<Button
								type="submit"
								disabled={isSubmitting || isUploading}
								className="h-12 px-8 bg-primary hover:bg-primary/95 text-white rounded-full font-semibold shadow-lg transition-transform active:scale-95 disabled:opacity-50"
							>
								{isSubmitting ? "Submitting..." : "Get Home Value"}
							</Button>
						)}
					</div>
				</form>
			</div>
		</Card>
	);
}
