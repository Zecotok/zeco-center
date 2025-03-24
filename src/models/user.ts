import { ROLES } from "@/libs/rolesConfig";
import {Schema, model, models} from "mongoose";

const userSchema = new Schema({
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
    fullname: {
        type: String,
        required: [true, "Fullname is required"],
        minLength: [3, "Fullname must be at least 3 characters long"],
        maxLength: [50, "Fullname must be at most 50 characters long"]
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.USER
    }
});

const User = models.User || model("User", userSchema);
export default User;