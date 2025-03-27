import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";
import PendingUser from "@/models/pendingUser";
import { authOptions } from '@/app/api/auth/authConfig';

class PendingUserController {
    static async isAdmin() {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return false;
        return session?.user?.isAdmin;
    }

    // Get all pending users
    static async getAllPendingUsers() {
        if (!await PendingUserController.isAdmin()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            await connectDB();
            const pendingUsers = await PendingUser.find({}).select('-password');
            return NextResponse.json(pendingUsers);
        } catch (error) {
            return NextResponse.json({ error: "Error fetching pending users" }, { status: 500 });
        }
    }

    // Approve pending user
    static async approvePendingUser(request: Request) {
        if (!await PendingUserController.isAdmin()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            const { id, role, isAdmin = false } = await request.json();
            
            if (!id) {
                return NextResponse.json({ error: "User ID is required" }, { status: 400 });
            }
            
            await connectDB();

            // Get the pending user
            const pendingUser = await PendingUser.findById(id).select('+password');
            
            if (!pendingUser) {
                return NextResponse.json({ error: "Pending user not found" }, { status: 404 });
            }
            
            // Create actual user from pending user
            const user = new User({
                fullname: pendingUser.fullname,
                email: pendingUser.email,
                password: pendingUser.password, // Already hashed
                role: role || pendingUser.role,
                isAdmin: isAdmin
            });
            
            await user.save();
            
            // Delete pending user
            await PendingUser.findByIdAndDelete(id);
            
            return NextResponse.json({ 
                message: "User approved successfully",
                user: {
                    _id: user._id,
                    fullname: user.fullname,
                    email: user.email,
                    role: user.role,
                    isAdmin: user.isAdmin
                }
            });
        } catch (error: any) {
            return NextResponse.json({ 
                error: `Error approving user: ${error.message}` 
            }, { status: 500 });
        }
    }

    // Delete pending user (reject)
    static async deletePendingUser(request: Request) {
        if (!await PendingUserController.isAdmin()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            const { id } = await request.json();
            
            if (!id) {
                return NextResponse.json({ error: "User ID is required" }, { status: 400 });
            }
            
            await connectDB();
            
            const pendingUser = await PendingUser.findById(id);
            
            if (!pendingUser) {
                return NextResponse.json({ error: "Pending user not found" }, { status: 404 });
            }
            
            await PendingUser.findByIdAndDelete(id);
            
            return NextResponse.json({ message: "Pending registration rejected" });
        } catch (error: any) {
            return NextResponse.json({ 
                error: `Error rejecting user: ${error.message}` 
            }, { status: 500 });
        }
    }
}

export const GET = PendingUserController.getAllPendingUsers;
export const POST = PendingUserController.approvePendingUser; // Approve
export const DELETE = PendingUserController.deletePendingUser; // Reject 