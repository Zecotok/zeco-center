import mongoose from "mongoose";

const  MONGODB_URI  = process.env.DB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

export const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB..., MONGODB_URI: ", MONGODB_URI);
    const {connection} = await mongoose.connect(MONGODB_URI);
    if (connection.readyState === 1) {
      console.log("MongoDB connected");
      return Promise.resolve(true);
    }
  } catch (error) {
    console.log(error);
    return Promise.reject(false);
  }
}