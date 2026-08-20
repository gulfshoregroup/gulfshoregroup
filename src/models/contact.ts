import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IContactRequest extends Document {
	user?: string;
	name: string;
	email: string;
	message: string;
	phone?: string;
	status?: string;
	ref?: string;
	refType?: string;
	createdAt: Date;
}

const contactRequestSchema = new Schema<IContactRequest>(
	{
		user: String,
		name: String,
		email: String,
		message: String,
		phone: String,
		status: String,
		ref: String,
		refType: String,
	},
	{ timestamps: true, strict: false }
);

const ContactRequest =
	models.ContactRequest ||
	model<IContactRequest>("ContactRequest", contactRequestSchema);

export default ContactRequest;
