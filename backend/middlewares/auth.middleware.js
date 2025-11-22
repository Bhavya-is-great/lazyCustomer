import User from "../models/user.model.js";
import { decodeJWT } from "../utils/tokens.util.js";
import AppError from "../utils/AppError.js";

export function getUser(req, res, next) {
    const token = req.cookies["lazy-customer-token"];

    if (!token) {
        req.user = null;
        return next();
    }

    const decoded = decodeJWT(token);
    if (!decoded) {
        req.user = null;
        return next();
    }

    req.user = decoded;

    return next();
}

export async function requireAuth(req, res, next) {
    if (!req.user) throw new AppError(401, "User is not logged in.");

    const user = await User.findOne({ _id: req.user._id });

    if (!user) {
        throw new AppError(404, "User not found!");
    }

    req.user = user;

    return next();
}

export function requireOnboarded(req, res, next) {
    if (!req.user.userName) {
        throw new AppError(401, "You haven't onboarded yet!");
    }

    return next();
}

export function requireNotOnboarded(req, res, next) {
    if (req.user.userName) {
        throw new AppError(404, "You have already onboarded!");
    }

    return next();
}
