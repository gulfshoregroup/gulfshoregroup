import mongoose, { Schema, type Document } from "mongoose";

export interface IPropertyCriteria {
	city?: string | null;
	developmentName?: string | null;
	beds?: string;
	baths?: string;
	minPrice?: string;
	maxPrice?: string;
	propertyTypes?: string[];
	features?: string[];
}

export interface INote {
	_id?: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface IPreferredProperty {
	_id?: string;
	MLSNumber?: string;
	Address?: string;
	createdAt: Date;
	updatedAt: Date;
}

const PropertyCriteriaSchema = new Schema<IPropertyCriteria>({
	city: { type: String },
	developmentName: { type: String },
	beds: { type: String },
	baths: { type: String },
	minPrice: { type: String },
	maxPrice: { type: String },
	propertyTypes: {
		type: [String],
	},
	features: {
		type: [String],
	},
});

export interface IInquiry {
	_id?: string;
	MLSNumber?: string;
	propertyAddress: string;
	inquiryType: string;
	message: string;
	createdAt: Date;
}

const PreferredPropertySchema = new Schema<IPreferredProperty>(
	{
		MLSNumber: String,
		Address: String,
		createdAt: Date,
		updatedAt: Date,
	},
	{ timestamps: true }
);
export interface ILead extends Document {
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
	status: "New" | "Contacted" | "Interested" | "Closed";
	source:
		| "Signup"
		| "Contact_Form"
		| "Tour_Request"
		| "Admin"
		| "General"
		| "Other";
	tags: ("Buyer" | "Seller" | "Hot Lead" | "Cold Lead")[];
	notes: INote[];
	inquiryHistory: IInquiry[];
	preferredProperties?: any[];
	propertyCriteria?: any[];
	budget?: {
		min: number;
		max: number;
	};
	location?: string;
	lastContactedAt?: Date | string | null;
	lastEmailSent?: Date;
	lastTextSent?: Date;
	lastWhatsappSent?: Date;
	whatsappEnabled?: boolean;
	emailEnabled?: boolean;
	textEnabled?: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;
}

// Plain interface for Prisma/MySQL response (no Mongoose Document)
export interface IPrismaLead {
	id: string;
	_id?: string;
	firstName?: string | null;
	lastName?: string | null;
	fullName?: string | null;
	email: string;
	phone?: string | null;
	status: string;
	source: string;
	tags: string[];
	notes?: INote[];
	inquiryHistory?: IInquiry[];
	lastContactedAt?: Date | string | null;
	createdAt: Date | string;
	updatedAt: Date | string;
}

const NoteSchema = new Schema<INote>(
	{
		content: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

const InquirySchema = new Schema<IInquiry>(
	{
		MLSNumber: String,
		propertyAddress: String,
		inquiryType: {
			type: String,
			required: true,
		},
		message: String,
	},
	{ timestamps: true }
);

const LeadSchema = new Schema<ILead>(
	{
		firstName: {
			type: String,
			required: true,
		},
		lastName: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
			lowercase: true,
		},
		phone: {
			type: String,
			default: "",
		},
		status: {
			type: String,
			enum: ["New", "Contacted", "Interested", "Closed", "Trash"],
			default: "New",
		},
		tags: {
			type: [String],
			enum: ["Buyer", "Seller", "Hot Lead", "Cold Lead"],
			default: [],
		},
		notes: {
			type: [NoteSchema],
			default: [],
		},
		inquiryHistory: {
			type: [InquirySchema],
			default: [],
		},
		preferredProperties: {
			type: [PreferredPropertySchema],
			default: [],
		},
		propertyCriteria: {
			type: [PropertyCriteriaSchema],
			default: [],
		},
		budget: {
			min: Number,
			max: Number,
		},
		location: String,
		lastEmailSent: Date,
		lastTextSent: Date,
		lastWhatsappSent: Date,
		whatsappEnabled: {
			type: Boolean,
			default: true,
		},
		emailEnabled: {
			type: Boolean,
			default: true,
		},
		textEnabled: {
			type: Boolean,
			default: true,
		},
		source: {
			type: String,
			required: true,
			enum: [
				"Signup",
				"Contact_Form",
				"Tour_Request",
				"Admin",
				"General",
				"Other",
			],
			default: "General",
		},
		lastContactedAt: Date,
	},
	{ timestamps: true }
);

export default mongoose.models.Lead ||
	mongoose.model<ILead>("Lead", LeadSchema);
