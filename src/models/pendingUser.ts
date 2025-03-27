import { ROLES } from "@/libs/rolesConfig";
import {Schema, model, models} from "mongoose";

const pendingUserSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: [true, "Email is required"],
        match: [
            /^[^@]+@[^@]+\.[^@]+$/,
            "Please provide a valid email address"
        ]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        select: false
    },
    role: {
        type: String,
        enum: Object.keys(ROLES),
        default: ROLES.USER
    },
    fullname: {
        type: String,
        required: [true, "Fullname is required"],
        minLength: [3, "Fullname must be at least 3 characters long"],
        maxLength: [50, "Fullname must be at most 50 characters long"]
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 604800 // Auto-delete after 7 days if not approved
    }
});

const PendingUser = models.PendingUser || model("PendingUser", pendingUserSchema);
export default PendingUser; 