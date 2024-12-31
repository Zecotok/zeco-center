import mongoose from "mongoose";
// import dotenv from "dotenv";

// Load environment variables from the `.env` file
// dotenv.config();

const MONGODB_URI = "Your connection string";

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in your .env file"
  );
}

export const connectDB = async () => {
  try {
    const dbConnection = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    if (dbConnection.connection.readyState === 1) {
      console.log("✅ MongoDB connected successfully");
      return true; // Resolve with true when connected
    } else {
      console.log("⚠️ MongoDB connection is not in a ready state");
      return false; // Resolve with false when not ready
    }
  } catch (error: any) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    return false; // Reject with false on error
  }
};
