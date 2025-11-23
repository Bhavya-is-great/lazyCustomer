import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "crypto";

export function generateAndSetJWT(res, user) {
    const payload = {
        _id: user._id.toString(),
        userName: user.userName,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const token = jwt.sign(payload, secret, {
        expiresIn: "7d",
    });

    res.cookie("lazy-customer-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return token;
}

export function decodeJWT(token) {
    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    try {
        return jwt.verify(token, secret);
    } catch (err) {
        return null;
    }
}

export function generateLoginToken() {
    const token = randomBytes(32).toString("base64url");
    const hash = createHash("sha256").update(token).digest("hex");
    return { token, hash };
}
