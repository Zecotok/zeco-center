import { NextResponse } from 'next/server';
import { connectDB } from '@/libs/mongodb'; // MongoDB connection utility
import { getSession } from 'next-auth/react'; // NextAuth to get authenticated user session
import mongoose from 'mongoose';
import User from '@/models/user'; // User model

// Define the MeditationSession model (inside this file)
const MeditationSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  fullName: { type: String, required: true },
  meditationTime: { type: Number, required: true }, // Time in seconds
  time: { type: Date, default: Date.now }, // Timestamp of the session
});

const MeditationSession =
  mongoose.models.MeditationSession || mongoose.model('MeditationSession', MeditationSessionSchema);

// API route handler for tracking meditation time
export async function POST(req: Request) {
  try {
    // Connect to MongoDB
    await connectDB();

    // Get session info to track the logged-in user
    const session = await getSession({ req });

    if (!session) {
      return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
    }

    // Extract user info from the session
    const { userId, email } = session.user; // `userId` is the MongoDB user ID and `email` is from the session
    console.log(userId,email)
    const { meditationTime } = await req.json(); // Extract meditation time from the request body

    // Validate the received meditation time
    if (!meditationTime || meditationTime <= 0) {
      return NextResponse.json({ message: 'Invalid meditation time' }, { status: 400 });
    }

    // Get the user's full name from the User model (since it's stored in the User document)
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const { name } = user; // Extract full name from the User document

    // Save meditation session data
    const newSession = new MeditationSession({
      userId, // Store user ID for reference
      email, // Store email from session
      fullName: name, // Store full name from the User model
      meditationTime, // Store the meditation time (in seconds)
      time: new Date(), // Store the current timestamp
    });

    await newSession.save(); // Save session data to MongoDB

    return NextResponse.json({ message: 'Meditation session tracked successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error tracking meditation session:', error);
    return NextResponse.json({ message: 'Error tracking meditation' }, { status: 500 });
  }
}
