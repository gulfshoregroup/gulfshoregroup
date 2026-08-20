import mongoose, {
	Schema,
	Document,
	models,
	model,
	Types,
} from "mongoose";

export interface IWishlist extends Document {
	user: Types.ObjectId;
	property: Types.ObjectId;
}

const wishlistSchema = new Schema<IWishlist>(
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
	},
	{
		timestamps: true,
	}
);

const Wishlist =
	models.Wishlist || model<IWishlist>("Wishlist", wishlistSchema);

export default Wishlist;
