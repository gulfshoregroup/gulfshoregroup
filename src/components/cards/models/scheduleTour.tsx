"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { Clock } from "lucide-react";
import { toast } from "sonner";

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

		setIsSubmitting(true);

		try {
			// Replace this URL with your API endpoint
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
		<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
			<div className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/3 p-6">
				<h2 className="text-xl font-medium mb-4">Schedule a Tour</h2>

				{successMessage && (
					<div className="bg-green-100 text-green-700 p-4 mb-4 rounded">
						{successMessage}
					</div>
				)}

				<form onSubmit={handleSubmit}>
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

					<div className="flex justify-between">
						<button
							type="button"
							onClick={onClose}
							className="bg-gray-600 text-white px-4 py-2 rounded-lg  hover:bg-gray-700 focus:outline-none">
							Cancel
						</button>
						<button
							type="submit"
							className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-accent focus:outline-none"
							disabled={isSubmitting}>
							{isSubmitting ? (
								"Submitting..."
							) : (
								<span className="flex flex-nowrap gap-2 justify-center font-medium text-sm items-center text-center">
									<Clock />
									Schedule Tour
								</span>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ScheduleTourForm;
