import mongoose from "mongoose";

const BlogSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		slug: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
		},
		description: {
			type: String,
			required: true,
		},
		content: {
			type: String,
			required: true,
		},
		coverImage: {
			type: String, // Cloudinary URL
		},
		category: {
			type: String,
			enum: [
				"market-trends",
				"home-buying",
				"investment",
				"local-news",
				"others",
			],
			default: "others",
		},
		metaTitle: {
			type: String,
			required: true,
		},
		metaDescription: {
			type: String,
		},
		metaKeywords: {
			type: [String],
		},
		author: {
			type: String,
			default: "Gulfshore Group",
		},
		published: {
			type: Boolean,
			default: false,
		},
		publishedAt: {
			type: Date,
		},
	},
	{ timestamps: true }
);

export default mongoose.models.Blog ||
	mongoose.model("Blog", BlogSchema);
