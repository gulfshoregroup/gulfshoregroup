"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { Clock, ArrowRight, ArrowLeft, ExternalLink, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";

const ScheduleTourForm = ({
	propertyAddress,
	MLSNumber,
	propertyId,
	onClose,
}: any) => {
	const { user } = useUser();
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		message: "",
		propertyAddress: propertyAddress,
		MLSNumber: MLSNumber,
		propertyId: propertyId || MLSNumber,
	});

	useEffect(() => {
		const fetchProfile = async () => {
			if (user) {
				try {
					const res = await axios.get('/api/v2/user/profile');
					if (res.data && res.data.success && res.data.profile) {
						const p = res.data.profile;
						setFormData((prev) => ({
							...prev,
							firstName: prev.firstName || p.firstName || user.firstName || "",
							lastName: prev.lastName || p.lastName || user.lastName || "",
							email: prev.email || p.email || user.primaryEmailAddress?.emailAddress || "",
							phone: prev.phone || p.phone || user.primaryPhoneNumber?.phoneNumber || "",
						}));
						return;
					}
				} catch (error) {
					console.error("Failed to fetch user profile", error);
				}

				// Fallback to clerk data
				setFormData((prev) => ({
					...prev,
					firstName: prev.firstName || user.firstName || "",
					lastName: prev.lastName || user.lastName || "",
					email: prev.email || user.primaryEmailAddress?.emailAddress || "",
					phone: prev.phone || user.primaryPhoneNumber?.phoneNumber || "",
				}));
			}
		};

		fetchProfile();
	}, [user]);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");
	
	// Signature flow states
	const [step, setStep] = useState(1);
	const [signatureData, setSignatureData] = useState<string | null>(null);
	const sigPadRef = useRef<any>(null);
	const [activePage, setActivePage] = useState<number | "all">(1);
	const formType = propertyId && propertyId !== MLSNumber ? "Property-Specific" : "General";
	
	const fullName = `${formData.firstName} ${formData.lastName}`.trim() || "Client Name";
	const previewPdfUrl = `/api/tour/preview-agreement?name=${encodeURIComponent(fullName)}&email=${encodeURIComponent(formData.email)}&phone=${encodeURIComponent(formData.phone)}&formType=${encodeURIComponent(formType)}`;

	useEffect(() => {
		const checkMobile = () => {
			const mobile = typeof window !== "undefined" && window.innerWidth < 768;
			if (!mobile) {
				setActivePage("all");
			} else {
				setActivePage(1);
			}
		};
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	const handleChange = (e: { target: { name: any; value: any } }) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmit = async (e: { preventDefault: () => void }) => {
		e.preventDefault();

		// Perform form validation (example)
		if (
			!formData.firstName ||
			!formData.lastName ||
			!formData.email ||
			!formData.phone
		) {
			alert("Please fill out all required fields.");
			return;
		}

		if (step === 1) {
			setStep(2);
			return;
		}

		if (step === 2 && !signatureData) {
			alert("Please sign the agreement before submitting.");
			return;
		}

		setIsSubmitting(true);

		try {
			// First, process the signature
			const signaturePayload = {
				signatureData,
				name: `${formData.firstName} ${formData.lastName}`,
				email: formData.email,
				phone: formData.phone,
				formType,
				propertyId: formData.propertyId,
			};
			
			const signRes = await axios.post(`/api/tour/sign-agreement`, signaturePayload);
			
			if (!signRes.data.success) {
				toast.error("Error signing agreement. Please try again.");
				setIsSubmitting(false);
				return;
			}

			// Then, schedule the tour
			const tourPayload = {
				...formData,
				signedPdfUrl: signRes.data.signedAgreement?.signedPdfUrl || null
			};
			const response = await axios.post(`/api/v2/tour`, tourPayload);

			if (response.data && response.data.success) {
				setFormData({
					firstName: "",
					lastName: "",
					email: "",
					phone: "",
					message: "",
					propertyAddress: propertyAddress || "",
					MLSNumber: MLSNumber || "",
					propertyId: propertyId || MLSNumber || "",
				});
				setStep(3);
			} else {
				toast.error(
					"There was an error scheduling the tour. Please try again."
				);
			}
		} catch (error) {
			toast.error("An error occurred. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
			<div className="bg-white rounded-lg shadow-lg w-11/12 md:max-w-4xl max-h-[95vh] overflow-y-auto p-6">
				<h2 className="text-xl font-medium mb-4">Schedule a Tour</h2>

				{successMessage && (
					<div className="bg-green-100 text-green-700 p-4 mb-4 rounded">
						{successMessage}
					</div>
				)}

				<form onSubmit={handleSubmit}>
					{step === 1 && (
						<>
							<div className="mb-4">
						<label className="block text-gray-900 font-medium mb-2">
							First Name
						</label>
						<input
							type="text"
							name="firstName"
							value={formData.firstName}
							onChange={handleChange}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
							required
						/>
					</div>
					<div className="mb-4">
						<label className="block text-gray-900 font-medium mb-2">
							Last Name
						</label>
						<input
							type="text"
							name="lastName"
							value={formData.lastName}
							onChange={handleChange}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
							required
						/>
					</div>

					<div className="mb-4">
						<label className="block text-gray-900 font-medium mb-2">
							Email
						</label>
						<input
							type="email"
							name="email"
							value={formData.email}
							onChange={handleChange}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
							required
						/>
					</div>

					<div className="mb-4">
						<label className="block text-gray-900 font-medium mb-2">
							Phone
						</label>
						<input
							type="tel"
							name="phone"
							value={formData.phone}
							onChange={handleChange}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
							required
						/>
					</div>

					<div className="mb-4">
						<label className="block text-gray-900 font-medium mb-2">
							Message
						</label>
						<textarea
							name="message"
							value={formData.message}
							onChange={handleChange}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
							rows={4}></textarea>
					</div>
						</>
					)}

					{step === 2 && (
						<div className="mb-4 space-y-4">
							{/* Document Header & Page Navigation Toolbar */}
							<div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
								<div className="bg-gray-100 px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2">
									<div className="flex items-center gap-1.5 flex-wrap">
										<span className="text-xs font-semibold text-gray-700 mr-1 flex items-center gap-1">
											<FileText className="w-3.5 h-3.5 text-primary" /> Pages:
										</span>
										<button
											type="button"
											onClick={() => setActivePage(1)}
											className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
												activePage === 1
													? "bg-primary text-white shadow-xs font-bold"
													: "bg-white text-gray-700 hover:bg-gray-200 border border-gray-300"
											}`}>
											Page 1
										</button>
										<button
											type="button"
											onClick={() => setActivePage(2)}
											className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
												activePage === 2
													? "bg-primary text-white shadow-xs font-bold"
													: "bg-white text-gray-700 hover:bg-gray-200 border border-gray-300"
											}`}>
											Page 2
										</button>
										<button
											type="button"
											onClick={() => setActivePage(3)}
											className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
												activePage === 3
													? "bg-primary text-white shadow-xs font-bold"
													: "bg-white text-gray-700 hover:bg-gray-200 border border-gray-300"
											}`}>
											Page 3 (Signatures)
										</button>
										<button
											type="button"
											onClick={() => setActivePage("all")}
											className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
												activePage === "all"
													? "bg-primary text-white shadow-xs font-bold"
													: "bg-white text-gray-700 hover:bg-gray-200 border border-gray-300"
											}`}>
											All Pages
										</button>
									</div>

									<a
										href={previewPdfUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-xs text-blue-700 hover:text-blue-900 font-semibold underline flex items-center gap-1 ml-auto">
										<ExternalLink className="w-3.5 h-3.5" /> Full PDF
									</a>
								</div>

								{/* PDF Viewer Body */}
								{activePage === "all" ? (
									<>
										{/* Desktop view: Native full 3-page PDF viewer with scrollbar */}
										<div className="hidden md:block h-[50vh] p-1 bg-gray-100">
											<iframe
												src={previewPdfUrl}
												width="100%"
												height="100%"
												className="rounded border border-gray-200"
												title="Buyer Broker Agreement Full"
											/>
										</div>
										{/* Mobile view: Stack all 3 pages vertically so iOS Safari doesn't cut off page 2 & 3 */}
										<div className="block md:hidden max-h-[55vh] overflow-y-auto p-2 space-y-3 bg-gray-100">
											<div className="bg-white border rounded shadow-xs overflow-hidden">
												<div className="bg-gray-50 px-2 py-1 text-[11px] font-bold text-gray-600 border-b">
													Page 1 of 3: Terms & Compensation
												</div>
												<iframe
													src={`${previewPdfUrl}&page=1`}
													width="100%"
													height="420px"
													className="border-0"
													title="Agreement Page 1"
												/>
											</div>
											<div className="bg-white border rounded shadow-xs overflow-hidden">
												<div className="bg-gray-50 px-2 py-1 text-[11px] font-bold text-gray-600 border-b">
													Page 2 of 3: Standard Provisions
												</div>
												<iframe
													src={`${previewPdfUrl}&page=2`}
													width="100%"
													height="420px"
													className="border-0"
													title="Agreement Page 2"
												/>
											</div>
											<div className="bg-white border rounded shadow-xs overflow-hidden">
												<div className="bg-gray-50 px-2 py-1 text-[11px] font-bold text-gray-600 border-b">
													Page 3 of 3: Signatures & Licensee Info
												</div>
												<iframe
													src={`${previewPdfUrl}&page=3`}
													width="100%"
													height="420px"
													className="border-0"
													title="Agreement Page 3"
												/>
											</div>
										</div>
									</>
								) : (
									/* Single-page viewer for the active page (Page 1, 2, or 3) */
									<div className="h-[50vh] p-1 bg-gray-100">
										<iframe
											src={`${previewPdfUrl}&page=${activePage}`}
											width="100%"
											height="100%"
											className="rounded border border-gray-200"
											title={`Buyer Broker Agreement Page ${activePage}`}
										/>
									</div>
								)}

								{/* Page Footer Navigation */}
								{activePage !== "all" && (
									<div className="bg-gray-100 px-3 py-2 border-t flex justify-between items-center text-xs text-gray-700">
										<button
											type="button"
											disabled={activePage === 1}
											onClick={() => setActivePage((prev) => (typeof prev === "number" && prev > 1 ? prev - 1 : 1))}
											className="flex items-center gap-1 font-semibold text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:underline">
											<ChevronLeft className="w-4 h-4" /> Previous Page
										</button>
										<span className="font-medium text-gray-600">
											{activePage === 1 && "Page 1: Terms & Compensation"}
											{activePage === 2 && "Page 2: Standard NABOR Provisions"}
											{activePage === 3 && "Page 3: Signatures & Licensee Info"}
										</span>
										<button
											type="button"
											disabled={activePage === 3}
											onClick={() => setActivePage((prev) => (typeof prev === "number" && prev < 3 ? prev + 1 : 3))}
											className="flex items-center gap-1 font-semibold text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:underline">
											Next Page <ChevronRight className="w-4 h-4" />
										</button>
									</div>
								)}
							</div>

							{/* Signature Pad */}
							<div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-xs">
								<div className="bg-gray-100 px-3 py-2 border-b text-sm font-medium flex justify-between items-center">
									<span className="flex items-center gap-1 font-semibold text-gray-800">
										✍️ Sign Here <span className="text-xs text-red-500 font-normal">*required</span>
									</span>
									<button
										type="button"
										onClick={() => {
											sigPadRef.current?.clear();
											setSignatureData(null);
										}}
										className="text-xs text-red-600 hover:underline font-medium">
										Clear Signature
									</button>
								</div>
								<SignatureCanvas
									penColor="black"
									canvasProps={{ className: "w-full h-32 cursor-crosshair touch-none" }}
									ref={(ref: any) => {
										sigPadRef.current = ref;
									}}
									onEnd={() => {
										if (sigPadRef.current) {
											setSignatureData(sigPadRef.current.getTrimmedCanvas().toDataURL("image/png"));
										}
									}}
								/>
								{signatureData && (
									<div className="bg-green-50 px-3 py-1.5 border-t border-green-200 text-green-700 text-xs font-semibold flex items-center gap-1">
										✓ Signature captured successfully
									</div>
								)}
							</div>
							<p className="text-xs text-gray-500">
								By signing, you agree to the terms of the Buyer Broker Agreement (NABOR) with GulfShore Group & London Foster Realty.
							</p>
						</div>
					)}

					{step === 3 && (
						<div className="text-center py-10">
							<div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
								<svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
							</div>
							<h3 className="text-3xl font-bold text-gray-900 mb-4">Tour Scheduled!</h3>
							<p className="text-gray-600 text-lg">
								We have successfully scheduled your tour and sent the executed Buyer Broker Agreement to your email inbox.
							</p>
						</div>
					)}

					<div className="flex justify-between mt-6">
						{step === 1 ? (
							<button
								type="button"
								onClick={onClose}
								className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 focus:outline-none transition-colors">
								Cancel
							</button>
						) : step === 2 ? (
							<button
								type="button"
								onClick={() => setStep(1)}
								className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 focus:outline-none transition-colors flex items-center gap-2">
								<ArrowLeft className="w-4 h-4" /> Back
							</button>
						) : (
							<div className="hidden"></div>
						)}
						
						{step === 1 ? (
							<button
								type="submit"
								className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-accent focus:outline-none transition-colors flex items-center gap-2">
								Next <ArrowRight className="w-4 h-4" />
							</button>
						) : step === 2 ? (
							<button
								type="submit"
								className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-accent focus:outline-none transition-colors"
								disabled={isSubmitting || !signatureData}>
								{isSubmitting ? (
									"Submitting..."
								) : (
									<span className="flex flex-nowrap gap-2 justify-center font-medium text-sm items-center text-center">
										<Clock className="w-4 h-4" />
										Confirm & Schedule
									</span>
								)}
							</button>
						) : (
							<button
								type="button"
								onClick={onClose}
								className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 focus:outline-none transition-colors w-full font-bold text-lg">
								Done
							</button>
						)}
					</div>
				</form>
			</div>
		</div>
	);
};

export default ScheduleTourForm;
