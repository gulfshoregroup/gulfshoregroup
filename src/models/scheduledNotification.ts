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

export interface IScheduledNotification extends Document {
	name: string;
	notificationType:
		| "New Updates"
		| "Reminders"
		| "New user"
		| "Welcome"
		| "Price drop";
	channel: "Text" | "WhatsApp" | "Email";
	segment: "users" | "admin" | "user";
	propertyCriteria: IPropertyCriteria;
	status: "active" | "paused" | "scheduled" | "completed";
	scheduledTime?: Date;
	frequency?: "once" | "daily" | "weekly" | "monthly";
	lastSent?: Date;
	userId?: string;
	propertyId?: string;
	nextScheduled?: Date;
	messageTemplate: string;
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

const ScheduledNotificationSchema =
	new Schema<IScheduledNotification>(
		{
			name: {
				type: String,
				required: true,
			},
			notificationType: {
				type: String,
				enum: [
					"New Updates",
					"Reminders",
					"New user",
					"Welcome",
					"Price drop",
				],
				required: true,
			},
			channel: {
				type: String,
				enum: ["Text", "WhatsApp", "Email"],
				required: true,
			},
			segment: {
				type: String,
				enum: ["users", "admin", "user"],
				required: true,
			},
			propertyCriteria: {
				type: PropertyCriteriaSchema,
				required: true,
				default: {
					city: "",
					developmentName: "",
					beds: "",
					baths: "",
					minPrice: "",
					maxPrice: "",
					propertyTypes: [],
					features: [],
				},
			},

			status: {
				type: String,
				enum: ["active", "paused", "scheduled", "completed"],
				default: "scheduled",
			},
			scheduledTime: Date,
			frequency: {
				type: String,
				enum: ["once", "daily", "weekly", "monthly"],
			},
			userId: {
				type: String,
			},
			propertyId: {
				type: {
					id: String,
					idType: String, // "MLSNumber","Property Slug", "ObjId"
				},
			},

			lastSent: Date,
			nextScheduled: Date,
			messageTemplate: {
				type: String,
				required: true,
			},
		},
		{ timestamps: true }
	);

export default mongoose.models.ScheduledNotification ||
	mongoose.model<IScheduledNotification>(
		"ScheduledNotification",
		ScheduledNotificationSchema
	);
