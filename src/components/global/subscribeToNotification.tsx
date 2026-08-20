"use client";
import { useState } from "react";
import { X, Phone, Bell, Check } from "lucide-react";

const PhoneNumberForm = ({ onSubmit, onClose }: any) => {
	const [phoneNumber, setPhoneNumber] = useState("");
	const [countryCode, setCountryCode] = useState("+1");
	const [email, setEmail] = useState("");
	const [isPhoneValid, setIsPhoneValid] = useState(false);
	const [isEmailValid, setIsEmailValid] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	// Country codes for real estate markets
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

	// Format phone number based on country
	const formatPhoneNumber = (value: string, country: string) => {
		const phoneNumber = value.replace(/[^\d]/g, "");

		if (country === "+1") {
			if (phoneNumber.length < 4) return phoneNumber;
			if (phoneNumber.length < 7) {
				return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
			}
			return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
		}
		if (country === "+91") {
			if (phoneNumber.length < 6) return phoneNumber;
			return `${phoneNumber.slice(0, 5)}-${phoneNumber.slice(5, 10)}`;
		}
		return phoneNumber.replace(/(\d{3})(?=\d)/g, "$1 ");
	};

	// Validate phone number based on country
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

	// Validate email
	const validateEmail = (email: string) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const handlePhoneChange = (e: { target: { value: any } }) => {
		const formatted = formatPhoneNumber(e.target.value, countryCode);
		setPhoneNumber(formatted);
		setIsPhoneValid(validatePhoneNumber(formatted, countryCode));
	};

	const handleCountryChange = (e: { target: { value: any } }) => {
		const newCountry = e.target.value;
		setCountryCode(newCountry);
		// Reformat existing phone number for new country
		if (phoneNumber) {
			const formatted = formatPhoneNumber(
				phoneNumber.replace(/\D/g, ""),
				newCountry
			);
			setPhoneNumber(formatted);
			setIsPhoneValid(validatePhoneNumber(formatted, newCountry));
		}
	};

	const handleEmailChange = (e: { target: { value: any } }) => {
		const emailValue = e.target.value;
		setEmail(emailValue);
		setIsEmailValid(validateEmail(emailValue));
	};

	const isFormValid = isPhoneValid && isEmailValid;

	const handleSubmit = async () => {
		if (!isFormValid) return;

		setIsSubmitting(true);

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1500));

		setIsSubmitting(false);
		setIsSubmitted(true);

		// Call parent onSubmit if provided
		if (onSubmit) {
			onSubmit({ phone: `${countryCode} ${phoneNumber}`, email });
		}

		// Auto close after success
		setTimeout(() => {
			setIsSubmitted(false);
			setPhoneNumber("");
			setEmail("");
			setCountryCode("+1");
			setIsPhoneValid(false);
			setIsEmailValid(false);
			if (onClose) onClose();
		}, 2000);
	};

	if (isSubmitted) {
		return (
			<div className="text-center py-8">
				<div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
					<Check className="w-8 h-8" style={{ color: "#d90429" }} />
				</div>
				<h3 className="text-lg font-semibold text-gray-900 mb-2">
					Success!
				</h3>
				<p className="text-gray-600">
					You'll receive property alerts at {countryCode}{" "}
					{phoneNumber} and {email}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="text-center mb-6">
				<div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
					<Bell className="w-8 h-8" style={{ color: "#d90429" }} />
				</div>
				<div className="mb-3">
					<h3
						className="text-xl font-bold"
						style={{ color: "#d90429" }}>
						Gulfshoregroup
					</h3>
				</div>
				<h2 className="text-2xl font-bold text-gray-900 mb-2">
					Stay Updated on Properties
				</h2>
				<p className="text-gray-600">
					Get instant notifications about new listings, price changes,
					and market updates
				</p>
			</div>

			<div className="space-y-4">
				<div>
					<label
						htmlFor="email"
						className="block text-sm font-medium text-gray-700 mb-2">
						Email Address
					</label>
					<div className="relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<svg
								className="h-5 w-5 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
								/>
							</svg>
						</div>
						<input
							type="email"
							id="email"
							value={email}
							onChange={handleEmailChange}
							placeholder="your.email@example.com"
							className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
								email && !isEmailValid
									? "border-red-300 focus:border-red-500"
									: email && isEmailValid
									? "border-green-300 focus:border-green-500"
									: "border-gray-300 focus:border-gray-400"
							}`}
						/>
					</div>
					{email && !isEmailValid && (
						<p className="mt-2 text-sm text-red-600">
							Please enter a valid email address
						</p>
					)}
				</div>

				<div>
					<label
						htmlFor="phone"
						className="block text-sm font-medium text-gray-700 mb-2">
						Phone Number
					</label>
					<div className="flex space-x-3">
						<div className="w-32">
							<select
								value={countryCode}
								onChange={handleCountryChange}
								className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors text-sm">
								{countryCodes.map((country) => (
									<option key={country.code} value={country.code}>
										{country.flag} {country.code}
									</option>
								))}
							</select>
						</div>
						<div className="flex-1 relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Phone className="h-5 w-5 text-gray-400" />
							</div>
							<input
								type="tel"
								id="phone"
								value={phoneNumber}
								onChange={handlePhoneChange}
								placeholder={
									countryCode === "+1"
										? "(555) 123-4567"
										: "123 456 789"
								}
								className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
									phoneNumber && !isPhoneValid
										? "border-red-300 focus:border-red-500"
										: phoneNumber && isPhoneValid
										? "border-green-300 focus:border-green-500"
										: "border-gray-300 focus:border-gray-400"
								}`}
							/>
						</div>
					</div>
					{phoneNumber && !isPhoneValid && (
						<p className="mt-2 text-sm text-red-600">
							Please enter a valid phone number
						</p>
					)}
				</div>

				<div className="flex items-start space-x-2">
					<input
						type="checkbox"
						id="consent"
						className="mt-1 h-4 w-4 border-gray-300 rounded focus:outline-none"
						style={{ accentColor: "#d90429" }}
						required
					/>
					<label htmlFor="consent" className="text-sm text-gray-600">
						I agree to receive property notifications via SMS and
						email.
					</label>
				</div>
			</div>

			<button
				onClick={handleSubmit}
				disabled={!isFormValid || isSubmitting}
				className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-200 ${
					!isFormValid || isSubmitting
						? "bg-gray-400 cursor-not-allowed"
						: "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 active:opacity-80"
				}`}>
				{isSubmitting ? (
					<div className="flex items-center">
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
						Setting up property alerts...
					</div>
				) : (
					"Get Property Notifications"
				)}
			</button>
		</div>
	);
};

export const PhoneNotificationPopup = ({ isOpen, onClose }: any) => {
	const handleSubmit = (contactData: any) => {
		console.log("Contact data submitted:", contactData);
		// Handle the phone number and email submission here
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="flex min-h-full items-center justify-center p-4">
				<div className="relative bg-white rounded-xl shadow-xl w-full max-w-md transform transition-all">
					{/* Close button */}
					<button
						onClick={onClose}
						className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
						<X className="w-6 h-6" />
					</button>

					{/* Form content */}
					<div className="p-6">
						<PhoneNumberForm
							onSubmit={handleSubmit}
							onClose={onClose}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

// Main component demonstrating usage
export default function SubscribeToNotificationsPopup() {
	const [isPopupOpen, setIsPopupOpen] = useState(false);

	return (
		<div className="flex items-center justify-center">
			<div className="text-center">
				<button
					onClick={() => setIsPopupOpen(true)}
					className="text-white cursor-pointer bg-primary ring-primary font-medium py-3 px-6 rounded-lg shadow-lg transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 active:opacity-80">
					Subscribe to Property Alerts
				</button>

				<PhoneNotificationPopup
					isOpen={isPopupOpen}
					onClose={() => setIsPopupOpen(false)}
				/>
			</div>
		</div>
	);
}
