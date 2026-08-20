import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";
const DB_NAME = process.env.DB_NAME || "";

let isConnected = false;

const connectDB = async () => {
	if (isConnected) return;

	if (!MONGODB_URI)
		throw new Error("MONGODB_URI is missing in environment");

	try {
		await mongoose.connect(MONGODB_URI, {
			dbName: DB_NAME || "gulfshoregroup",
			minPoolSize: 4,
			family: 4,
			socketTimeoutMS: 45000,
			maxPoolSize: 10,
			serverSelectionTimeoutMS: 5000,
		});
		isConnected = true;
	} catch (err) {
		console.error("MongoDB connection error", err);
		throw err;
	}
};

export default connectDB;
