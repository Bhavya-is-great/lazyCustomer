import mongoose from "mongoose";
import { hash, compare } from "bcrypt";

const userSchema = mongoose.Schema({
    userName: {
        type: String,
        minlength: 3,
        maxlength: 30,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    role: {
        type: String,
        enum: ["customer", "seller", "deliveryPartner", "admin"],
        default: "customer",
    },

    loginToken: String,
    loginTokenExpiresAt: Date,
});

const User = mongoose.model("User", userSchema);
export default User;
