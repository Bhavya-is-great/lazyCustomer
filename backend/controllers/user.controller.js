import User from "../models/user.model.js";
import { createHash } from "crypto";

import { generateLoginToken, generateAndSetJWT } from "../utils/tokens.util.js";
import sendEmail from "../utils/sendEmail.js";
import AppError from "../utils/AppError.js";
import { sanitizeUser } from "../utils/sanitize.js";

export const sendToken = async (req, res) => {
    const { userName, email } = req.body;

    const existingUser = await User.findOne({ email });

    const { hash, token } = generateLoginToken();

    const link = `${process.env.BACKEND_URL}/api/v1/user/verify/${token}`;
    await sendEmail(email, link);

    if (existingUser) {
        existingUser.loginToken = hash;
        existingUser.loginTokenExpiresAt = new Date(
            Date.now() + 15 * 60 * 1000
        ); // 15 mins
        await existingUser.save();

        return res.status(201).json({
            success: true,
            message: "A login link has been sent to your email address.",
        });
    }

    const newUser = new User({
        email,
        loginToken: hash,
        loginTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    });
    await newUser.save();

    return res.status(201).json({
        success: true,
        message:
            "Registration successful! A login link has been sent to your email address.",
    });
};

export const verifyToken = async (req, res) => {
    const { token } = req.params;
    const hash = createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        loginToken: hash,
        loginTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
        throw new AppError(400, "Invalid or expired token");
    }

    user.loginToken = undefined;
    user.loginTokenExpiresAt = undefined;
    await user.save();

    generateAndSetJWT(res, user);

    return res.status(200).json({
        success: true,
        message: "User logged in successfully.",
        data: {
            user: sanitizeUser(user),
        },
    });
};

export const onboardUser = async (req, res) => {
    const { userName } = req.body;
    const email = req.user.email;

    const updatedUser = await User.findOneAndUpdate(
        { email },
        { userName },
        { new: true }
    );

    if (!updatedUser) {
        throw new AppError(404, "User not found");
    }

    generateAndSetJWT(res, updatedUser);

    return res.status(200).json({
        success: true,
        message: "User onboarded successfully!",
        data: {
            user: sanitizeUser(updatedUser),
        },
    });
};

export const logoutUser = async (req, res) => {
    res.clearCookie("lazy-customer-token");

    return res.status(200).json({
        success: true,
        message: "User logged out succesfully.",
    });
};
