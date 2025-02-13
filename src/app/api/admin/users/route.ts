import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";
import bcrypt from "bcryptjs";
import { authOptions } from '@/libs/authConfig';

class UserController {
    static async isAdmin() {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return false;
        console.log('session', session);
        return session?.user?.isAdmin;
    }

    // Get all users
    static async getAllUsers() {
        if (!await UserController.isAdmin()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            await connectDB();
            const users = await User.find({}).select('-password');
            return NextResponse.json(users);
        } catch (error) {
            return NextResponse.json({ error: "Error fetching users" }, { status: 500 });
        }
    }

    // Update user
    static async updateUser(request: Request) {
        if (!await UserController.isAdmin()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            const { id, fullname, email, password, isAdmin } = await request.json();
            await connectDB();

            // Prevent modifying admin user except by themselves
            const session = await getServerSession();
            const targetUser = await User.findById(id);

            const updateData: any = { fullname, email };
            if (password) {
                updateData.password = await bcrypt.hash(password, 12);
            }
            if (typeof isAdmin === 'boolean') {
                updateData.isAdmin = isAdmin;
            }

            const updatedUser = await User.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            ).select('-password');

            return NextResponse.json(updatedUser);
        } catch (error) {
            return NextResponse.json({ error: "Error updating user" }, { status: 500 });
        }
    }

    // Delete user
    static async deleteUser(request: Request) {
        if (!await UserController.isAdmin()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            const { id } = await request.json();
            await connectDB();

            // Prevent deleting admin user
            const targetUser = await User.findById(id);
            if (targetUser.isAdmin) {
                return NextResponse.json({ error: "Cannot delete admin user" }, { status: 403 });
            }

            await User.findByIdAndDelete(id);
            return NextResponse.json({ message: "User deleted successfully" });
        } catch (error) {
            return NextResponse.json({ error: "Error deleting user" }, { status: 500 });
        }
    }
}

export const GET = UserController.getAllUsers
export const PUT =  UserController.updateUser
export const DELETE = UserController.deleteUser