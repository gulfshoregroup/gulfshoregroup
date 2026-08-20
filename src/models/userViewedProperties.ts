import mongoose, {
	Schema,
	Document,
	model,
	models,
	Types,
} from "mongoose";

export interface IUserViewedProperty extends Document {
	user: Types.ObjectId;
	property: Types.ObjectId;
	viewCount: number;
	lastViewed: Date;
}

const userViewedPropertySchema = new Schema<IUserViewedProperty>(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		property: {
			type: Schema.Types.ObjectId,
			ref: "Property",
			required: true,
		},
		viewCount: {
			type: Number,
			default: 1,
		},
		lastViewed: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	}
);

const UserViewedProperty =
	models.UserViewedProperty ||
	model<IUserViewedProperty>(
		"UserViewedProperty",
		userViewedPropertySchema
	);

export default UserViewedProperty;
