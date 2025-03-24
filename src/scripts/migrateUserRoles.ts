import { connectDB } from "../libs/mongodb";
import User from "../models/user";

async function migrateUserRoles() {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    // Update all admin users
    const adminResult = await User.updateMany(
      { isAdmin: true, role: { $exists: false } },
      { $set: { role: 'ADMIN' } }
    );
    
    // Update all non-admin users
    const userResult = await User.updateMany(
      { isAdmin: false, role: { $exists: false } },
      { $set: { role: 'USER' } }
    );

    console.log(`Updated ${adminResult.modifiedCount} admin users`);
    console.log(`Updated ${userResult.modifiedCount} regular users`);

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

migrateUserRoles(); 