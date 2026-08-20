import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ICommunity extends Document {
	City?: string;
	name?: string;
	title?: string;
	metaDescription?: string;
	infoText?: string;
	keywords?: string;
	Image?: string;
	Images?: string[];
	PropertyCount?: number;
	[key: string]: any;
}

const communitySchema = new Schema<ICommunity>(
	{
		City: String,
		Development: String,
		name: String,
		title: String,
		metaDescription: String,
		infoText: String,
		keywords: String,
		Image: String,
		Images: [String],
		PropertyCount: Number,
	},
	{ timestamps: true, strict: false }
);

const Community =
	models.Communities ||
	model<ICommunity>("Communities", communitySchema);

export default Community;
