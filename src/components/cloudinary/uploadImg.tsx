"use client";
import { CldUploadWidget } from "next-cloudinary";
import React from "react";

interface UploadImgProps {
	formData: {
		Images: string[];
		defaultImage: string;
		[key: string]: any;
	};
	setFormData: React.Dispatch<
		React.SetStateAction<{
			Images: string[];
			defaultImage: string;
			[key: string]: any;
		}>
	>;
	label?: string;
	maxFiles?: number;
	seoFileName?: string;
}

export default function UploadImg({
	formData,
	setFormData,
	label = "Upload Images",
	maxFiles = 10,
	seoFileName,
}: UploadImgProps) {
	const handleUploadSuccess = (result: any) => {
		const uploadedUrl = result?.info?.secure_url;
		if (!uploadedUrl) return;

		setFormData((prev) => {
			const currentImages = Array.isArray(prev.Images)
				? prev.Images
				: [];
			// append the new one, keep within max limit
			const updatedImages = [...currentImages, uploadedUrl].slice(
				0,
				maxFiles
			);

			return {
				...prev,
				Images: updatedImages,
				defaultImage: prev.defaultImage || uploadedUrl,
			};
		});
	};

	const handleSetDefault = (url: string) => {
		setFormData((prev) => ({
			...prev,
			defaultImage: url,
		}));
	};

	const handleRemoveImage = (url: string) => {
		setFormData((prev) => {
			const updated = prev.Images.filter((img) => img !== url);
			return {
				...prev,
				Images: updated,
				defaultImage:
					prev.defaultImage === url
						? updated[0] || ""
						: prev.defaultImage,
			};
		});
	};

	return (
		<div className="space-y-3">
			<CldUploadWidget
				signatureEndpoint="/api/signed-cloudinary-params"
				options={{
					sources: ["local", "url", "google_drive"],
					multiple: true,
					maxFiles,
					...(seoFileName ? { public_id: seoFileName } : {})
				}}
				onSuccess={handleUploadSuccess}>
				{({ open }) => (
					<button
						type="button"
						onClick={() => open()}
						className="bg-blue-600 text-white px-4 py-2 rounded">
						{label}
					</button>
				)}
			</CldUploadWidget>

			{/* Image previews */}
			<div className="grid grid-cols-2 gap-2">
				{formData.Images?.map((img) => (
					<div
						key={img}
						className="relative w-32 h-32 border rounded overflow-hidden group">
						<img
							src={img}
							alt="uploaded"
							className="object-cover w-full h-full cursor-pointer transition-transform duration-200 group-hover:scale-105"
							onClick={() => handleSetDefault(img)}
						/>
						{formData.defaultImage === img && (
							<span className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded">
								Default
							</span>
						)}
						<button
							type="button"
							onClick={() => handleRemoveImage(img)}
							className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-80 hover:opacity-100">
							X
						</button>
					</div>
				))}
			</div>
		</div>
	);
}
