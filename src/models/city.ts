import { Schema, Document, models, model } from "mongoose";

export interface ICities extends Document {
	City?: string;
	index?: number;
	name?: string;
	featured?: boolean;
	title?: string;
	metaDescription?: string;
	infoText?: string;
	keywords?: string;
	Images?: string[];
	DefaultImage?: string;
	PropertyCount?: number;
	[key: string]: any;
}

const citiesSchema = new Schema<ICities>(
	{
		City: String,
		index: Number,
		name: String,
		featured: Boolean,
		title: String,
		metaDescription: String,
		infoText: String,
		keywords: String,
		Images: [String],
		DefaultImage: String,
		PropertyCount: Number,
	},
	{ timestamps: true, strict: false }
);

const City = models.Cities || model<ICities>("Cities", citiesSchema);
export default City;
