import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authConfig';
import { connectDB } from "@/libs/mongodb";
import User from '@/models/user';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const users = await User.find({}, 'email').sort({ email: 1 });
    
    return NextResponse.json(users.map(user => ({
      id: user._id.toString(),  // Ensure we're converting ObjectId to string
      email: user.email
    })));
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}