"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { usePathname } from "next/navigation";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";

export default function ContactForm({
	MLSNumber = "",
	propertyAddress = "",
}: {
	MLSNumber?: string;
	propertyAddress?: string;
}) {
	const path = usePathname();

	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		message: "",
		userRole: "Buyer",
	});

	const [countryCode, setCountryCode] = useState("+1");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [isPhoneValid, setIsPhoneValid] = useState(true);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [message, setMessage] = useState("");
	const [submitStatus, setSubmitStatus] = useState<
		"idle" | "success" | "error"
	>("idle");
	const [validationError, setValidationError] = useState("");

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		setValidationError("");
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

	const formatPhoneNumber = (value: string, country: string) => {
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

	const validatePhoneNumber = (phone: string, country: string) => {
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

	const handlePhoneChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const input = e.target.value;
		const digitsOnly = input.replace(/[^\d]/g, ""); // remove formatting for API
		const formatted = formatPhoneNumber(digitsOnly, countryCode);

		setPhoneNumber(formatted);
		setIsPhoneValid(validatePhoneNumber(formatted, countryCode));

		setFormData((prev) => ({
			...prev,
			phone: `${countryCode}${digitsOnly}`, // ✅ send clean version to API
		}));
	};

	const handleCountryChange = (code: string) => {
		setCountryCode(code);
		if (phoneNumber) {
			const digitsOnly = phoneNumber.replace(/[^\d]/g, "");
			const formatted = formatPhoneNumber(digitsOnly, code);

			setPhoneNumber(formatted);
			setIsPhoneValid(validatePhoneNumber(formatted, code));

			setFormData((prev) => ({
				...prev,
				phone: `${code}${digitsOnly}`, // ✅ clean phone for API
			}));
		}
	};

	const validateForm = () => {
		const messageWords = formData.message.trim().split(/\s+/);
		const messageLength = formData.message.trim().length;

		if (messageWords.length < 2) {
			setValidationError("Message must contain two words.");
			return false;
		}

		if (messageLength < 10) {
			setValidationError(
				"Message must contain at least 10 characters."
			);
			return false;
		}

		if (!isPhoneValid) {
			setValidationError("Please enter a valid phone number.");
			return false;
		}

		return true;
	};

	const handleSubmit = async (
		e: React.FormEvent<HTMLFormElement>
	) => {
		e.preventDefault();

		if (!validateForm()) return;

		setIsSubmitting(true);
		setSubmitStatus("idle");

		try {
			const response = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					ref: path,
					refType: path.includes("Florida-Real-Estate-Listings")
						? "Property-Page"
						: path.includes("Florida-Real-Estate-Search")
						? "Search-Page"
						: "Contact-Form",
					propertyAddress,
					MLSNumber,
				}),
			});

			if (response.ok) {
				setSubmitStatus("success");
				setMessage((await response.json()).message || "");
				setFormData({
					firstName: "",
					lastName: "",
					email: "",
					phone: "",
					message: "",
					userRole: "Buyer",
				});
				setPhoneNumber("");
			} else setSubmitStatus("error");
		} catch (error) {
			setSubmitStatus("error");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card className="p-2 border-none bg-transparent shadow-none rounded-2xl">
			{/* Header */}
			<div className="mb-8">
				<h2 className="text-3xl font-serif font-bold text-foreground mb-2">
					Get in Touch
				</h2>
				<p className="text-lg text-muted-foreground">
					Let's discuss your real estate needs. We're here to help you
					find your perfect property.
				</p>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Role Selector (Buyer / Seller / General) */}
				<div>
					<label className="block text-sm font-medium text-foreground mb-2">
						I am a... <span className="text-red-500">*</span>
					</label>
					<Select
						value={formData.userRole}
						onValueChange={(val) => setFormData((prev) => ({ ...prev, userRole: val }))}
					>
						<SelectTrigger className="w-full h-12 px-4 border rounded-lg bg-gray-50 text-foreground font-medium focus:ring-2 focus:ring-primary transition">
							<SelectValue placeholder="Select your role" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="Buyer">🛒 Buyer (Looking to Buy a Home)</SelectItem>
							<SelectItem value="Seller">🏠 Seller (Looking to Sell My Home)</SelectItem>
							<SelectItem value="General">💬 General Inquiry / Other Question</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Name Field */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

					<div>
						<label
							htmlFor="name"
							className="block text-sm font-medium text-foreground mb-2">
							First Name
						</label>
						<Input
							id="name"
							name="firstName"
							type="text"
							placeholder="First Name"
							value={formData.firstName}
							onChange={handleChange}
							required
							className="w-full px-4 py-3 border rounded-lg bg-gray-50 text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition"
						/>
					</div>
					<div>
						<label
							htmlFor="lname"
							className="block text-sm font-medium text-foreground mb-2">
							Last Name
						</label>
						<Input
							id="lname"
							name="lastName"
							type="text"
							placeholder="Last Name"
							value={formData.lastName}
							onChange={handleChange}
							required
							className="w-full px-4 py-3 border rounded-lg bg-gray-50 text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Email Field */}
					<div>
						<label
							htmlFor="email"
							className="block text-sm font-medium text-foreground mb-2">
							Email Address
						</label>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="example@example.com"
							value={formData.email}
							onChange={handleChange}
							required
							className="w-full px-4 py-3 border rounded-lg bg-gray-50 text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition"
						/>
					</div>

					{/* Phone with Country Select */}
					<div>
						<label
							htmlFor="phone"
							className="block text-sm font-medium text-foreground mb-2">
							Phone Number
						</label>
						<div className="flex gap-2">
							<Select
								value={countryCode}
								onValueChange={(e) => handleCountryChange(e)}>
								<SelectTrigger className="w-28">
									<SelectValue placeholder="Code" />
								</SelectTrigger>
								<SelectContent className="border max-h-50 rounded px-2">
									{countryCodes.map((c) => (
										<SelectItem key={c.code} value={c.code}>
											{c.flag} {c.code}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Input
								id="phone"
								name="phone"
								type="tel"
								placeholder="(239) 000-0000"
								value={phoneNumber}
								onChange={handlePhoneChange}
								required
								className={`w-full px-4 py-3 border rounded-lg bg-gray-50 text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 ${
									isPhoneValid
										? "focus:ring-primary"
										: "focus:ring-red-500 border-red-500"
								} transition`}
							/>
						</div>
					</div>
				</div>

				{/* Message Field */}
				<div>
					<label
						htmlFor="message"
						className="block text-sm font-medium text-foreground mb-2">
						Message
					</label>
					<Textarea
						id="message"
						name="message"
						placeholder="Comment or message..."
						value={formData.message}
						onChange={handleChange}
						required
						rows={5}
						className="w-full px-4 py-3 border rounded-lg bg-gray-50 text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none transition"
					/>
				</div>

				{/* Validation Error */}
				{validationError && (
					<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
						{validationError}
					</div>
				)}

				<p className="text-xs text-muted-foreground">
					I agree to receive marketing and customer service calls and
					text messages from Gulfshoregroup. Msg/data rates may apply.
				</p>

				{/* Status Messages */}
				{submitStatus === "success" && (
					<div className="p-4 bg-green-50 border border-green-200 rounded-lg">
						<p className="text-green-800 font-medium">
							{message ||
								`Thank you! We've received your message and will get back to you soon.`}
						</p>
					</div>
				)}
				{submitStatus === "error" && (
					<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
						<p className="text-red-800 font-medium">
							Something went wrong. Please try again.
						</p>
					</div>
				)}

				{/* Submit Button */}
				<Button
					type="submit"
					disabled={isSubmitting}
					className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
					{isSubmitting ? "Sending..." : "Send Message"}
				</Button>
			</form>
		</Card>
	);
}
