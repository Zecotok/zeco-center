import { connectDB } from '@/libs/mongodb';

// Export the dbConnect function that our video API routes are using
export const dbConnect = connectDB; 