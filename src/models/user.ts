import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
	clerkId: string;
	email: string;
	name?: string;
	firstName?: string;
	lastName?: string;
	profileImage?: string;
	lastSignIn?: Date;
	isActive: boolean;
	metadata: Record<string, any>;
	createdAt: Date;
	updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
	{
		clerkId: {
			type: String,
			required: true,
			unique: true,
		},
		email: {
			type: String,
			required: true,
		},
		name: String,
		firstName: String,
		lastName: String,
		profileImage: String,
		lastSignIn: Date,
		isActive: {
			type: Boolean,
			default: true,
		},
		metadata: {
			type: Object,
			default: {},
		},
	},
	{ timestamps: true }
);

const User: Model<IUser> =
	mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
