import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authConfig';
import { connectDB } from "@/libs/mongodb";
import User from '@/models/user';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const users = await User.find({}, { email: 1, id: 1, fullname: 1 }).sort({ email: 1 });
    return NextResponse.json(users.map(user => ({
      id: user._id.toString(),  // Ensure we're converting ObjectId to string
      email: user.email,
      fullname: user.fullname,
      firstName: user.fullname.split(' ')[0],
      lastName: user.lastName
    })));
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}