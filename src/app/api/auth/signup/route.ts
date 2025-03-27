import { NextResponse } from 'next/server';
import User from '@/models/user'
import PendingUser from '@/models/pendingUser';
import { connectDB } from "@/libs/mongodb";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {

    const { fullname, email, password } = await request.json();

    if (!password || password.length < 6) return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 });

    try {
        
        await connectDB();
        
        // Check if user already exists in either collection
        const userFound = await User.findOne({ email });
        const pendingUserFound = await PendingUser.findOne({ email });

        if (userFound) return NextResponse.json({ message: 'Email already exists' }, { status: 400 });
        if (pendingUserFound) return NextResponse.json({ message: 'Registration already pending approval' }, { status: 400 });

        const hashedPassword = await bcrypt.hash(password, 12);

        // Create pending user instead of actual user
        const pendingUser = new PendingUser({ 
            fullname, 
            email, 
            password: hashedPassword
        });

        const savedPendingUser = await pendingUser.save();

        return NextResponse.json({
            _id: savedPendingUser._id,
            email: savedPendingUser.email,
            fullname: savedPendingUser.fullname,
            pending: true,
            message: 'Registration submitted and pending admin approval'
        });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json(
                {
                    message: error.message,
                },
                {
                    status: 400,
                }
            );
        }
    }
}