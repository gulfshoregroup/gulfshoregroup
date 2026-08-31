"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { Clock, ArrowRight, ArrowLeft } from "lucide-react";
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
		if (user) {
			setFormData((prev) => ({
				...prev,
				firstName: prev.firstName || user.firstName || "",
				lastName: prev.lastName || user.lastName || "",
				email: prev.email || user.primaryEmailAddress?.emailAddress || "",
				phone: prev.phone || user.primaryPhoneNumber?.phoneNumber || "",
			}));
		}
	}, [user]);



	const [isSubmitting, setIsSubmitting] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");
	
	// Signature flow states
	const [step, setStep] = useState(1);
	const [signatureData, setSignatureData] = useState<string | null>(null);
	let sigPad: any = {};
	const formType = propertyId && propertyId !== MLSNumber ? "Property-Specific" : "General";
	const pdfUrl = formType === "Property-Specific" ? "/forms/bb-spec.pdf" : "/forms/bb-ex.pdf";

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
			const response = await axios.post(`/api/v2/tour`, formData);

			if (response.data && response.data.success) {
				setSuccessMessage(
					"Your tour has been successfully scheduled!"
				);
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

				onClose();
				toast.success("Tour Request has been created.");
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
			<div className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/3 p-6">
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
							<div className="bg-gray-50 border rounded-lg p-2 h-64 overflow-hidden">
								<iframe src={pdfUrl} width="100%" height="100%" className="rounded" title="Buyer Broker Agreement" />
							</div>
							<div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
								<div className="bg-gray-100 px-3 py-2 border-b text-sm font-medium flex justify-between items-center">
									<span>Sign Here</span>
									<button type="button" onClick={() => sigPad.clear()} className="text-xs text-blue-600 hover:underline">Clear</button>
								</div>
								<SignatureCanvas 
									penColor="black"
									canvasProps={{className: "w-full h-32 cursor-crosshair"}}
									ref={(ref) => { sigPad = ref }}
									onEnd={() => setSignatureData(sigPad.getTrimmedCanvas().toDataURL('image/png'))}
								/>
							</div>
							<p className="text-xs text-gray-500">By signing, you agree to the terms of the Buyer Broker Agreement.</p>
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
						) : (
							<button
								type="button"
								onClick={() => setStep(1)}
								className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 focus:outline-none transition-colors flex items-center gap-2">
								<ArrowLeft className="w-4 h-4" /> Back
							</button>
						)}
						
						{step === 1 ? (
							<button
								type="submit"
								className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-accent focus:outline-none transition-colors flex items-center gap-2">
								Next <ArrowRight className="w-4 h-4" />
							</button>
						) : (
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
						)}
					</div>
				</form>
			</div>
		</div>
	);
};

export default ScheduleTourForm;
