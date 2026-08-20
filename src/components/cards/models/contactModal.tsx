"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";

const ContactForm = ({
	propertyId,
	onClose,
}: {
	propertyId: any;
	onClose: any;
}) => {
	const { user } = useUser();
	const [formData, setFormData] = useState({
		fullName: "",
		email: "",
		phone: "",
		message: "",
		property: propertyId,
	});

	useEffect(() => {
		if (user) {
			const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
			setFormData((prev) => ({
				...prev,
				fullName: prev.fullName || fullName || user.username || "",
				email: prev.email || user.primaryEmailAddress?.emailAddress || "",
				phone: prev.phone || user.primaryPhoneNumber?.phoneNumber || "",
			}));
		}
	}, [user]);


	const [isSubmitting, setIsSubmitting] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");

	const handleChange = (e: any) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmit = async (e: any) => {
		e.preventDefault();

		// Perform form validation (example)
		if (!formData.fullName || !formData.email || !formData.phone) {
			alert("Please fill out all required fields.");
			return;
		}

		setIsSubmitting(true);

		try {
			// Replace this URL with your API endpoint
			const response = await axios.post(
				`${process.env.REACT_APP_SERVER}api/contact`,
				formData
			);

			if (response.status === 200) {
				setSuccessMessage(
					"Your Request has been successfully submitteds!"
				);
				setFormData({
					fullName: "",
					email: "",
					phone: "",
					message: "",
					property: "",
				});
				onClose();
			} else {
				alert(
					"There was an error scheduling the tour. Please try again."
				);
			}
		} catch (error) {
			console.error("Error scheduling tour:", error);
			alert("An error occurred. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
			<div className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/3 p-6">
				<h2 className="text-xl font-semibold mb-4">Get in touch</h2>

				{successMessage && (
					<div className="bg-green-100 text-green-700 p-4 mb-4 rounded">
						{successMessage}
					</div>
				)}

				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label className="block text-gray-700 font-bold mb-2">
							Name
						</label>
						<input
							type="text"
							name="fullName"
							value={formData.fullName}
							onChange={handleChange}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
							required
						/>
					</div>

					<div className="mb-4">
						<label className="block text-gray-700 font-bold mb-2">
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
						<label className="block text-gray-700 font-bold mb-2">
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
						<label className="block text-gray-700 font-bold mb-2">
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
							className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 focus:outline-none">
							Cancel
						</button>
						<button
							type="submit"
							className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 focus:outline-none"
							disabled={isSubmitting}>
							{isSubmitting ? "Submitting..." : "Submit"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ContactForm;
