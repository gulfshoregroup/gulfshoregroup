import mongoose, {
	Schema,
	Document,
	model,
	models,
	Types,
} from "mongoose";

export interface IUserSearchQuery extends Document {
	user: Types.ObjectId;
	searchQuery: Record<string, any>; // or stricter type if you know your query shape
	searchCount: number;
	lastSearched: Date;
	totalResultsFound: number;
}

const userSearchQuerySchema = new Schema<IUserSearchQuery>(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		searchQuery: {
			type: Object,
			required: true,
		},
		searchCount: {
			type: Number,
			default: 1,
		},
		totalResultsFound: {
			type: Number,
		},
		lastSearched: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	}
);

const UserSearchQuery =
	models.UserSearchQuery ||
	model<IUserSearchQuery>("UserSearchQuery", userSearchQuerySchema);

export default UserSearchQuery;
