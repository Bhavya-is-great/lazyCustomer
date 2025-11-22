import { Router } from "express";
const router = Router();

import {
    sendToken,
    verifyToken,
    onboardUser,
    logoutUser,
} from "../controllers/user.controller.js";
import {
    requireAuth,
    requireNotOnboarded,
} from "../middlewares/auth.middleware.js";
import wrapAsync from "../utils/wrapAsync.js";

router.post("/send-token", wrapAsync(sendToken));
router.post("/verify/:token", wrapAsync(verifyToken));
router.post(
    "/onboard",
    requireAuth,
    requireNotOnboarded,
    wrapAsync(onboardUser)
);

router.post("/logout", wrapAsync(logoutUser));

export default router;
