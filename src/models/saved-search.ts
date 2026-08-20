import mongoose, {
	Model,
	Schema,
	Types,
	type Document,
} from "mongoose";

export interface ISavedSearch extends Document {
	user: Types.ObjectId;
	name: string;
	link: string;
	filters: Record<string, any>;
	subscriptionEnabled: boolean;
	subscriptionFrequency: "Instant" | "Daily" | "Weekly" | "Monthly";
	matchCount: number;
	lastUpdated: Date;
	createdAt: Date;
}

const SavedSearchSchema = new Schema<ISavedSearch>(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		name: { type: String, required: true },
		link: { type: String, required: true },
		filters: {
			type: Object,
		},
		subscriptionEnabled: { type: Boolean, default: true },
		subscriptionFrequency: { type: String, default: "Instant" },
		matchCount: { type: Number, default: 0 },
		lastUpdated: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

const SavedSearch: Model<ISavedSearch> =
	mongoose.models.SavedSearch ||
	mongoose.model<ISavedSearch>("SavedSearch", SavedSearchSchema);

export default SavedSearch;
