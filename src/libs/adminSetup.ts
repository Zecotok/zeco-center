import User from "@/models/user";
import bcrypt from "bcryptjs";
import { connectDB } from "./mongodb";

export async function ensureAdminExists() {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_FULLNAME) {
        throw new Error("Admin environment variables are not properly configured");
    }

    try {
        console.log("Connecting to MongoDB... and trying to ensure admin exists");
        await connectDB();

        // Check if admin exists
        const adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
        if (!adminUser) {
            // Create admin user if doesn't exist
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
            const newAdmin = new User({
                email: process.env.ADMIN_EMAIL,
                password: hashedPassword,
                fullname: process.env.ADMIN_FULLNAME,
                isAdmin: true,
                role: 'ADMIN' // Add role field
            });
            await newAdmin.save();
            console.log("Admin user created successfully");
        } else {
            // Update admin password if it has changed
            const passwordMatch = adminUser.password ? await bcrypt.compare(process.env.ADMIN_PASSWORD, adminUser.password) : false;
            if (!passwordMatch) {
                const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
                adminUser.password = hashedPassword;
                await adminUser.save();
                console.log("Admin password updated successfully");
            }
            
            // Ensure admin has isAdmin flag and ADMIN role
            if (!adminUser.isAdmin || adminUser.role !== 'ADMIN') {
                adminUser.isAdmin = true;
                adminUser.role = 'ADMIN';
                await adminUser.save();
                console.log("Admin role and privileges updated");
            }
        }
    } catch (error) {
        console.error("Error ensuring admin exists:", error);
    }
} 